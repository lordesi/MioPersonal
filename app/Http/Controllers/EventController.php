<?php

namespace App\Http\Controllers;

use App\Actions\GroupSessions\GroupSessionPlaces;
use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionStatus;
use App\Enums\UserRole;
use App\Models\GroupSession;
use App\Models\GroupSessionHost;
use App\Models\User;
use App\Support\CourseCard;
use App\Support\GroupSessionCard;
use App\Support\Seo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The page of an event (/evento/{slug}) and its places: a client takes one,
 * confirmed at once while there are places left, and gives it back until
 * the event starts. The places already taken in a course lesson (before the
 * courses were only to look at) are shown here too.
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
            // The breadcrumb: "Eventi a Milano", or the gym and the course of a lesson.
            'city' => $session->city === null ? null : ['slug' => $session->city->slug, 'name' => $session->city->name],
            'course' => $this->course($session),
            // "Altri eventi a {città}": the next ones, not of the same series.
            'nearby' => $session->city_id === null ? [] : GroupSessionCard::many(GroupSessionCard::load(GroupSession::query()
                ->listed()
                ->upcoming()
                ->where('city_id', $session->city_id)
                ->whereKeyNot($session->id)
                ->when($session->series_id !== null, fn ($query) => $query->where(fn ($other) => $other
                    ->whereNull('series_id')
                    ->orWhere('series_id', '!=', $session->series_id))))
                ->orderBy('starts_at')
                ->limit(4)
                ->get()),
            // "Avvisami se si libera": only for a full event; whether the viewer is in line.
            'waitlist' => [
                'joined' => $viewer !== null && $session->waitlist()->where('user_id', $viewer->id)->exists(),
                'count' => $session->waitlist()->count(),
            ],
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

    /**
     * A lesson of a course: the course and the gym's plan, for the way back.
     *
     * @return array{name: string, href: string, gymName: string, gymHref: string}|null
     */
    private function course(GroupSession $session): ?array
    {
        $course = $session->lesson?->course;
        $gym = $course?->gymProfile;

        if ($course === null || $gym === null || ! $gym->isApproved()) {
            return null;
        }

        return [
            'name' => $course->name,
            'href' => CourseCard::href($course),
            'gymName' => $gym->name,
            'gymHref' => route('gyms.show', $gym->slug, false),
        ];
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
