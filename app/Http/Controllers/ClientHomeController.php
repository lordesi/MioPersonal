<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\GroupSession;
use App\Models\GroupSessionHost;
use App\Models\GymProfile;
use App\Models\TrainerClient;
use App\Models\User;
use App\Support\BookingLabels;
use App\Support\ClientBookingData;
use App\Support\GroupSessionCard;
use App\Support\GymCard;
use App\Support\RecommendedTrainers;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Home" of the client area, the first page after the login: the week with
 * the client's sessions and events (`?giorno=2026-11-18` picks the day), then
 * trainers and gyms to try. Everything else is in "Profilo".
 */
class ClientHomeController extends Controller
{
    /** How far the week strip goes, back and forward. */
    public const MAX_MONTHS = 12;

    /** "Trainer consigliati" and "Palestre consigliate". */
    private const SUGGESTIONS = 6;

    private const TIMEZONE = 'Europe/Rome';

    public function __invoke(Request $request): Response
    {
        /** @var User $client */
        $client = $request->user();
        $preference = $client->clientPreference;
        $today = CarbonImmutable::now(self::TIMEZONE)->startOfDay();
        $day = $this->day($request, $today);
        $monday = $day->startOfWeek(CarbonImmutable::MONDAY);

        // The suggested trainers show their first free slot.
        TrainerSlots::refreshStale();

        return Inertia::render('client/home', [
            'firstName' => $client->first_name,
            // Rome dates, "2026-11-18": the strip marks today and the chosen day.
            'today' => $today->toDateString(),
            'day' => $day->toDateString(),
            'minDate' => $today->subMonths(self::MAX_MONTHS)->toDateString(),
            'maxDate' => $today->addMonths(self::MAX_MONTHS)->toDateString(),
            'week' => $this->week($client, $monday),
            'dayBookings' => $this->dayItems($client, $day, $day->addDay()),
            'trainers' => fn () => RecommendedTrainers::for($client, $preference, self::SUGGESTIONS),
            'gyms' => fn () => $this->gyms($client, $preference?->city_id),
        ]);
    }

    /** `?giorno=` within MAX_MONTHS from today, otherwise today. */
    private function day(Request $request, CarbonImmutable $today): CarbonImmutable
    {
        $value = $request->string('giorno')->toString();

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return $today;
        }

        $day = CarbonImmutable::createFromFormat('!Y-m-d', $value, self::TIMEZONE);

        if ($day === null || $day->format('Y-m-d') !== $value) {
            return $today;
        }

        return $day->betweenIncluded($today->subMonths(self::MAX_MONTHS), $today->addMonths(self::MAX_MONTHS)) ? $day : $today;
    }

    /**
     * The 7 days, Monday to Sunday, with how many sessions and events each
     * has: the dot under the day.
     *
     * @return list<array{date: string, count: int}>
     */
    private function week(User $client, CarbonImmutable $monday): array
    {
        $counts = collect($this->dayItems($client, $monday, $monday->addDays(7)))
            ->countBy(fn (array $item) => CarbonImmutable::parse($item['start'])->setTimezone(self::TIMEZONE)->toDateString());

        return array_map(function (int $i) use ($monday, $counts) {
            $date = $monday->addDays($i)->toDateString();

            return ['date' => $date, 'count' => (int) $counts->get($date, 0)];
        }, range(0, 6));
    }

    /**
     * ClientDayItem (resources/js/types/client.ts): the sessions with a trainer
     * (own and as a friend; confirmed or waiting for the trainer) and the
     * events with a place taken, from `$from` to `$until` (Rome), in order.
     *
     * @return list<array<string, mixed>>
     */
    private function dayItems(User $client, CarbonImmutable $from, CarbonImmutable $until): array
    {
        $bookings = Booking::query()
            ->where(fn (Builder $mine) => $mine
                ->where('client_id', $client->id)
                ->orWhere(fn (Builder $guest) => $guest->withGuest($client)))
            ->where('starts_at', '>=', $from->utc())
            ->where('starts_at', '<', $until->utc())
            ->with([...ClientBookingData::RELATIONS, 'trainerProfile.portrait'])
            ->get()
            ->filter(fn (Booking $booking) => $booking->status === BookingStatus::Confirmed || $booking->isPending());

        // "Scrivi": the trainers who have the client in their "Clienti".
        $records = $bookings->isEmpty() ? collect() : TrainerClient::query()
            ->where('user_id', $client->id)
            ->whereIn('trainer_profile_id', $bookings->pluck('trainer_profile_id')->unique()->all())
            ->pluck('id', 'trainer_profile_id');

        $events = GroupSession::query()
            ->whereHas('activeRegistrations', fn (Builder $registration) => $registration->where('user_id', $client->id))
            ->where('starts_at', '>=', $from->utc())
            ->where('starts_at', '<', $until->utc())
            ->with(GroupSessionCard::RELATIONS)
            ->get();

        /** @var Collection<int, array<string, mixed>> $items */
        $items = $bookings->map(fn (Booking $booking) => $this->bookingItem($booking, $records->get($booking->trainer_profile_id)))
            ->toBase()
            ->concat($events->map(fn (GroupSession $event) => $this->eventItem($event)));

        return array_values($items->sortBy('start')->values()->all());
    }

    /**
     * @return array<string, mixed>
     */
    private function bookingItem(Booking $booking, ?int $recordId): array
    {
        $trainer = $booking->trainerProfile;

        return [
            'key' => 'booking-'.$booking->id,
            'kind' => 'trainer',
            'title' => $trainer->user->name,
            // The photo of the public profile, as User::avatar for trainers.
            'avatar' => $trainer->portrait?->url('sm'),
            'activity' => $trainer->disciplines->first()->name ?? $booking->service_name,
            'start' => ClientBookingData::iso($booking->starts_at),
            'end' => ClientBookingData::iso($booking->ends_at),
            'status' => $booking->status === BookingStatus::Confirmed ? 'confirmed' : 'pending',
            // "Pacchetto Boxe · seduta 9 di 10", only for a package.
            'packageLabel' => $booking->client_package_id === null ? null : BookingLabels::service($booking),
            'placeLabel' => $booking->place_label,
            'cancelled' => false,
            'messageHref' => $recordId === null ? null : route('client.messages', ['con' => $recordId], false),
            'detailsHref' => route('client.bookings', [], false),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function eventItem(GroupSession $event): array
    {
        /** @var GroupSessionHost|null $host */
        $host = $event->acceptedHosts()->first();
        $title = $host === null ? $event->title : $event->title.' · '.$host->name();

        return [
            'key' => 'event-'.$event->id,
            'kind' => 'event',
            'title' => $title,
            'avatar' => null,
            'activity' => $event->type->label(),
            'start' => GroupSessionCard::iso($event->starts_at),
            'end' => GroupSessionCard::iso($event->ends_at),
            'status' => 'confirmed',
            'packageLabel' => null,
            'placeLabel' => $event->placeLabel(),
            'cancelled' => $event->isCancelled(),
            'messageHref' => null,
            'detailsHref' => route('events.show', $event->slug, false),
        ];
    }

    /**
     * "Palestre consigliate": published gyms in the client's city (in Italy
     * without one), the saved ones with the heart full.
     *
     * @return list<array<string, mixed>>
     */
    private function gyms(User $client, ?int $cityId): array
    {
        $gyms = GymProfile::query()
            ->published()
            ->when($cityId !== null, fn (Builder $query) => $query->where('city_id', $cityId))
            ->with(GymCard::RELATIONS)
            ->withCount('trainers')
            ->latest('approved_at')
            ->orderByDesc('id')
            ->limit(self::SUGGESTIONS)
            ->get();

        return GymCard::many($gyms, GymCard::favoriteIds($client));
    }
}
