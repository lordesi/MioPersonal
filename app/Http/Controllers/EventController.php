<?php

namespace App\Http\Controllers;

use App\Actions\GroupSessions\CourseLessonSessions;
use App\Actions\GroupSessions\GroupSessionPlaces;
use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionStatus;
use App\Enums\UserRole;
use App\Models\GroupSession;
use App\Models\GroupSessionHost;
use App\Models\GymCourseLesson;
use App\Models\GymProfile;
use App\Models\User;
use App\Support\GroupSessionCard;
use App\Support\Seo;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The page of an event (/evento/{slug}) and its places: a client takes one,
 * confirmed at once while there are places left, and gives it back until
 * the event starts. The lessons of a course with "Prenotazione posto" are
 * booked from the gym's page, then shown here too.
 */
class EventController extends Controller
{
    public function show(Request $request, string $slug): Response
    {
        $session = $this->session($slug);

        /** @var User|null $viewer */
        $viewer = $request->user();
        $hostOfViewer = $session->hostOf($viewer);

        abort_if($session->hidden_at !== null && $hostOfViewer === null && $viewer?->role !== UserRole::Admin, 404);

        $registration = $viewer === null ? null : $session->registrations()->where('user_id', $viewer->id)->first();
        $others = $session->series_id === null ? collect() : GroupSessionCard::load($session->series()->whereKeyNot($session->id))
            ->upcoming()
            ->where('status', GroupSessionStatus::Published)
            ->orderBy('starts_at')
            ->limit(8)
            ->get();

        $card = GroupSessionCard::from($session);
        $listed = ! $session->isLesson() && $session->hidden_at === null && ! $session->isCancelled() && ! $session->hasStarted();

        return Inertia::render('public/event', [
            'event' => [
                ...$card,
                'description' => $session->description,
                'cancelNote' => $session->cancel_note,
                'started' => $session->hasStarted(),
                'lesson' => $session->isLesson(),
                'mapsUrl' => $session->place === GroupSessionPlace::Gym && $session->gymProfile !== null
                    ? $session->gymProfile->googleMapsUrl()
                    : ($session->place === GroupSessionPlace::Address ? 'https://www.google.com/maps/search/?api=1&query='.urlencode($session->placeLabel()) : null),
                'gymHref' => $session->gymProfile?->isApproved() ? route('gyms.show', $session->gymProfile->slug, false) : null,
                'hosts' => $session->acceptedHosts()->map(fn (GroupSessionHost $host) => [
                    'name' => $host->name(),
                    'href' => $host->href(),
                    'kind' => $host->trainer_profile_id !== null ? 'trainer' : 'gym',
                    'photoUrl' => $host->trainerProfile?->portrait?->url() ?? $host->gymProfile?->cover?->url(),
                ])->values()->all(),
            ],
            'otherDates' => GroupSessionCard::many($others),
            // What the viewer can do: take a place, give it back, nothing.
            'state' => match (true) {
                $hostOfViewer !== null => 'organizer',
                $registration?->isActive() === true => 'registered',
                $viewer !== null && $viewer->role !== UserRole::Client => 'not-client',
                default => 'open',
            },
            'organizerHref' => $hostOfViewer === null ? null : route(
                ($hostOfViewer->gym_profile_id !== null ? 'gym' : 'trainer').'.events.show',
                $session,
                false,
            ),
            'seo' => Seo::page(
                $session->title.($session->city !== null ? " a {$session->city->name}" : ''),
                trim(($session->description ?? '').' '.$session->type->label().' · '.$session->placeLabel()),
                index: $listed,
                canonical: route('events.show', $session->slug),
                image: $session->coverUrl(),
                jsonLd: $listed ? [$this->jsonLd($session)] : [],
            ),
        ]);
    }

    /** "Accedi per iscriverti": guests go through login or sign-up, then back here. */
    public function start(string $slug): RedirectResponse
    {
        return to_route('events.show', $slug);
    }

    public function register(Request $request, string $slug, GroupSessionPlaces $places): RedirectResponse
    {
        $session = $this->session($slug);
        abort_if($session->hidden_at !== null, 404);

        /** @var User $client */
        $client = $request->user();
        $places->register($session, $client);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Posto confermato. Ti abbiamo mandato una mail.']);

        return back();
    }

    public function cancel(Request $request, string $slug, GroupSessionPlaces $places): RedirectResponse
    {
        /** @var User $client */
        $client = $request->user();
        $places->cancel($this->session($slug), $client);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Iscrizione annullata: il posto torna libero.']);

        return back();
    }

    /** "Prenota il posto" of a lesson in the gym's plan of the week. */
    public function registerLesson(Request $request, string $slug, GymCourseLesson $lesson, CourseLessonSessions $lessons, GroupSessionPlaces $places): RedirectResponse
    {
        $gym = GymProfile::query()->where('slug', $slug)->firstOrFail();
        $lesson->loadMissing('course');
        abort_unless($lesson->course->gym_profile_id === $gym->id && $gym->isApproved(), 404);

        $data = $request->validate(['date' => ['required', 'date_format:Y-m-d']], ['date.*' => 'Scegli il giorno della lezione.']);
        $date = CarbonImmutable::createFromFormat('Y-m-d', $data['date'], TrainerSlots::TIMEZONE)?->startOfDay();
        $today = CarbonImmutable::now(TrainerSlots::TIMEZONE)->startOfDay();

        if (! $lesson->course->bookable || ! $lesson->course->is_active || $lesson->capacity === null) {
            throw ValidationException::withMessages(['place' => 'Questo corso si prenota in palestra.']);
        }

        // This week and the next, as in the plan.
        if ($date === null || $date->lt($today) || $date->gt($today->addDays(14))) {
            throw ValidationException::withMessages(['place' => 'Puoi prenotare le lezioni di questa settimana e della prossima.']);
        }

        /** @var User $client */
        $client = $request->user();
        $places->register($lessons->occurrence($lesson, $date), $client);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Posto prenotato. Ti abbiamo mandato una mail.']);

        return back();
    }

    /** "Accedi per prenotare" a lesson: back to the gym's page. */
    public function startLesson(string $slug): RedirectResponse
    {
        return to_route('gyms.show', $slug);
    }

    private function session(string $slug): GroupSession
    {
        $session = GroupSession::query()->where('slug', $slug)->with(GroupSessionCard::RELATIONS)->withCount('activeRegistrations as registered_count')->first();

        abort_if($session === null, 404);

        // An event whose organizers are all gone is like a missing one.
        abort_if($session->acceptedHosts()->isEmpty(), 404);

        return $session;
    }

    /**
     * schema.org Event, for the search engines.
     *
     * @return array<string, mixed>
     */
    private function jsonLd(GroupSession $session): array
    {
        $online = $session->place === GroupSessionPlace::Online;

        return array_filter([
            '@type' => 'Event',
            'name' => $session->title,
            'description' => $session->description,
            'startDate' => $session->starts_at->toIso8601String(),
            'endDate' => $session->ends_at->toIso8601String(),
            'eventStatus' => 'https://schema.org/EventScheduled',
            'eventAttendanceMode' => $online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
            'location' => $online
                ? ['@type' => 'VirtualLocation', 'url' => route('events.show', $session->slug)]
                : ['@type' => 'Place', 'name' => $session->gymProfile->name ?? $session->placeLabel(), 'address' => $session->placeLabel()],
            'image' => $session->coverUrl(),
            'organizer' => $session->acceptedHosts()->map(fn (GroupSessionHost $host) => array_filter([
                '@type' => $host->trainer_profile_id !== null ? 'Person' : 'Organization',
                'name' => $host->name(),
                'url' => $host->href() !== null ? url($host->href()) : null,
            ]))->values()->all(),
            'offers' => [
                '@type' => 'Offer',
                'price' => number_format($session->price_cents / 100, 2, '.', ''),
                'priceCurrency' => 'EUR',
                'availability' => $session->remainingSeats() > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
                'url' => route('events.show', $session->slug),
            ],
        ], fn ($value) => $value !== null);
    }
}
