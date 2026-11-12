<?php

namespace App\Support;

use App\Actions\Bookings\CreateBookingSeries;
use App\Enums\BookingActor;
use App\Enums\BookingGuestStatus;
use App\Enums\BookingStatus;
use App\Enums\TrainerProfileStatus;
use App\Models\Booking;
use App\Models\BookingGuest;
use App\Models\ClientPackage;
use App\Models\Review;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * A client's bookings, packages and trainers in the format of the client
 * dashboard (resources/js/types/booking.ts). Load the bookings with
 * self::RELATIONS.
 */
final class ClientBookingData
{
    /** The relations the methods below read: one query each instead of one per booking. */
    public const RELATIONS = ['trainerProfile.user', 'trainerProfile.disciplines', 'clientPackage.bookings', 'client', 'service', 'guests.user'];

    /** "I tuoi trainer": a short list, the search has the others. */
    private const TRAINERS_LIMIT = 5;

    /**
     * The client's own bookings (first one first) and, for "Invita un
     * amico", the sessions of others the client joined that are still to come.
     *
     * @return array{bookings: Collection<int, Booking>, asGuest: Collection<int, Booking>}
     */
    public static function load(User $client): array
    {
        $bookings = $client->bookings()
            ->with(self::RELATIONS)
            ->orderBy('starts_at')
            ->get()
            ->toBase();

        $asGuest = Booking::query()
            ->withGuest($client)
            ->where('starts_at', '>', now())
            ->with(self::RELATIONS)
            ->get()
            ->toBase()
            ->filter(fn (Booking $booking) => $booking->status === BookingStatus::Confirmed || $booking->isPending());

        return ['bookings' => $bookings, 'asGuest' => $asGuest];
    }

    /**
     * Confirmed and not over, own and as a friend, first one first.
     *
     * @param  Collection<int, Booking>  $bookings
     * @param  Collection<int, Booking>  $asGuest
     * @return Collection<int, Booking>
     */
    public static function upcomingOf(Collection $bookings, Collection $asGuest): Collection
    {
        return $bookings->concat($asGuest)
            ->filter(self::isUpcoming(...))
            ->sortBy('starts_at')
            ->values();
    }

    /**
     * Waiting, refused or cancelled by the trainer, first one first.
     *
     * @param  Collection<int, Booking>  $bookings
     * @param  Collection<int, Booking>  $asGuest
     * @return Collection<int, Booking>
     */
    public static function pendingOf(Collection $bookings, Collection $asGuest): Collection
    {
        return $bookings->concat($asGuest->filter(fn (Booking $booking) => $booking->isPending()))
            ->filter(self::isPending(...))
            ->sortBy('starts_at')
            ->values();
    }

    /** "Prossime": confirmed and not over yet. */
    public static function isUpcoming(Booking $booking): bool
    {
        return $booking->status === BookingStatus::Confirmed && $booking->ends_at->isFuture();
    }

    /**
     * Waiting for the trainer, refused/expired, or cancelled by the trainer:
     * shown until the time has passed.
     */
    public static function isPending(Booking $booking): bool
    {
        return $booking->starts_at->isFuture()
            && (in_array($booking->status, [BookingStatus::Pending, BookingStatus::Declined, BookingStatus::Expired], true)
                || ($booking->status === BookingStatus::Cancelled && $booking->cancelled_by === BookingActor::Trainer));
    }

    /**
     * "Sedute svolte": confirmed and over. The "Saltata" mark is only for the
     * trainer: the client still sees the session as done.
     */
    public static function isDone(Booking $booking): bool
    {
        return $booking->status === BookingStatus::Confirmed && ! $booking->ends_at->isFuture();
    }

    /** A review only for a session really done: not one marked "Saltata". */
    public static function canBeReviewed(Booking $booking): bool
    {
        return self::isDone($booking) && $booking->no_show_at === null;
    }

    /**
     * ClientUpcomingBooking.
     *
     * @return array<string, mixed>
     */
    public static function upcoming(Booking $booking): array
    {
        return [
            ...self::trainer($booking),
            'id' => $booking->id,
            'discipline' => self::discipline($booking),
            // "Seduta singola", or "Pacchetto 10 sedute · seduta 1 di 10".
            'serviceLabel' => BookingLabels::service($booking),
            'start' => self::iso($booking->starts_at),
            'hours' => self::hours($booking),
            'placeLabel' => $booking->place_label,
            'status' => 'confirmed',
            'freeCancellationUntil' => self::iso($booking->freeCancellationEndsAt()),
            // "Sposta": the time the trainer proposes, until the client answers.
            'proposal' => self::proposal($booking),
        ];
    }

    /**
     * ClientPendingBooking.
     *
     * @return array<string, mixed>
     */
    public static function pending(Booking $booking): array
    {
        return [
            ...self::trainer($booking),
            'id' => $booking->id,
            'start' => self::iso($booking->starts_at),
            'hours' => self::hours($booking),
            'serviceName' => $booking->service_name,
            // "Ripeti ogni settimana": "Ogni martedì alle 18:00", while waiting for the trainer.
            'repeatWeekly' => $booking->repeat_weekly && $booking->isPending()
                ? CreateBookingSeries::label($booking->starts_at->toImmutable())
                : null,
            'status' => match (true) {
                $booking->status === BookingStatus::Cancelled => 'cancelled',
                $booking->status === BookingStatus::Declined => 'declined',
                $booking->isExpired() => 'expired',
                default => 'pending',
            },
            'expiresAt' => $booking->isPending() && $booking->expires_at !== null ? self::iso($booking->expires_at) : null,
            // The trainer's message when cancelling.
            'cancelNote' => $booking->status === BookingStatus::Cancelled ? $booking->cancel_note : null,
        ];
    }

    /**
     * "Invita un amico" (BookingGroup), for a session of more people, as
     * `$viewer` sees it: the booker gets the link and manages the friends,
     * a friend sees who else comes. Null for one person.
     *
     * @return array<string, mixed>|null
     */
    public static function group(Booking $booking, User $viewer): ?array
    {
        if ($booking->people <= 1) {
            return null;
        }

        $isBooker = $booking->client_id === $viewer->id;
        $canChange = $isBooker && $booking->client_package_id === null && $booking->canBeCancelledByClient();

        return [
            'people' => $booking->people,
            'priceCents' => $booking->price_cents,
            'role' => $isBooker ? 'booker' : 'guest',
            'bookerName' => $booking->client?->publicName() ?? 'Account eliminato',
            'inviteUrl' => $isBooker && $booking->acceptsGuests() && $booking->invite_token !== null
                ? route('bookings.invite', $booking->invite_token)
                : null,
            'freeSeats' => $booking->freeSeats(),
            'guests' => array_values($booking->guests
                ->where('status', BookingGuestStatus::Joined)
                ->map(fn (BookingGuest $guest) => [
                    'id' => $guest->id,
                    'name' => $guest->user?->publicName() ?? 'Account eliminato',
                    'isYou' => $guest->user_id === $viewer->id,
                ])->all()),
            // "Quante persone": up to the most the service allows, while cancelling is free.
            'maxPeople' => $canChange ? max($booking->people, $booking->service?->maxPeople() ?? 1) : null,
        ];
    }

    /**
     * @return array{start: string, hours: float, expiresAt: string}|null
     */
    private static function proposal(Booking $booking): ?array
    {
        $proposal = $booking->proposal();

        if ($proposal === null || $booking->proposal_expires_at === null) {
            return null;
        }

        return [
            'start' => self::iso($proposal['start']),
            'hours' => self::hours($booking),
            'expiresAt' => self::iso($booking->proposal_expires_at),
        ];
    }

    /**
     * ClientPastSession: one per done session, with the client's review if any.
     *
     * @param  Collection<int, Booking>  $done
     * @return list<array<string, mixed>>
     */
    public static function past(User $client, Collection $done): array
    {
        $reviews = Review::query()
            ->where('client_id', $client->id)
            ->whereIn('booking_id', $done->pluck('id')->all())
            ->get()
            ->keyBy('booking_id');

        return array_values($done->map(function (Booking $booking) use ($reviews) {
            /** @var Review|null $review */
            $review = $reviews->get($booking->id);

            return [
                ...self::trainer($booking),
                'id' => $booking->id,
                'discipline' => self::discipline($booking),
                'start' => self::iso($booking->starts_at),
                'hours' => self::hours($booking),
                'serviceName' => $booking->service_name,
                'review' => $review === null ? null : ['rating' => $review->rating, 'text' => $review->text],
                'canReview' => $review === null && self::canBeReviewed($booking),
            ];
        })->all());
    }

    /**
     * "Il tuo pacchetto" (ClientPackage): the bought ones not all done yet.
     * `booked` counts the sessions that take a place (done ones included).
     *
     * @return list<array<string, mixed>>
     */
    public static function packages(User $client): array
    {
        return array_values($client->clientPackages()
            ->bought()
            ->withSessionCounts()
            ->with('trainerProfile.user')
            ->oldest('bought_at')
            ->get()
            ->filter(fn (ClientPackage $package) => ($package->done_count ?? 0) < $package->sessions_total)
            ->map(fn (ClientPackage $package) => [
                'id' => $package->id,
                'name' => $package->name,
                'trainerName' => $package->trainerProfile->user->name,
                'trainerHref' => route('trainers.show', $package->trainerProfile->slug, false),
                'total' => $package->sessions_total,
                'done' => $package->done_count ?? 0,
                'booked' => $package->bookedCount(),
            ])->all());
    }

    /**
     * "I tuoi trainer": the ones with a confirmed session (last one first),
     * then the favorites. Only published profiles: the others can't be booked.
     *
     * @param  Collection<int, Booking>  $bookings
     * @return list<array<string, mixed>>
     */
    public static function trainers(User $client, Collection $bookings): array
    {
        $favorites = $client->favoriteTrainers()
            ->where('trainer_profiles.status', TrainerProfileStatus::Approved)
            ->with(['user', 'disciplines'])
            ->get();
        $favoriteIds = $favorites->modelKeys();

        $booked = $bookings
            ->filter(fn (Booking $booking) => $booking->status === BookingStatus::Confirmed)
            ->sortByDesc('starts_at')
            ->map(fn (Booking $booking) => $booking->trainerProfile)
            ->filter(fn (TrainerProfile $trainer) => $trainer->isApproved())
            ->unique('id');
        $bookedIds = $booked->pluck('id')->all();

        // "5 sedute insieme": the sessions done with each trainer.
        $doneCounts = $bookings
            ->filter(self::isDone(...))
            ->countBy('trainer_profile_id');

        // "Scrivi": the trainers who have the client in their "Clienti".
        $records = TrainerClient::query()->where('user_id', $client->id)->pluck('id', 'trainer_profile_id');

        return array_values($booked
            ->concat($favorites->whereNotIn('id', $bookedIds))
            ->take(self::TRAINERS_LIMIT)
            ->map(fn (TrainerProfile $trainer) => [
                'name' => $trainer->user->name,
                // "Riprendi con Alessandro" when nothing is booked.
                'firstName' => $trainer->user->first_name,
                // The heart saves the favorite by slug.
                'slug' => $trainer->slug,
                'href' => route('trainers.show', $trainer->slug, false),
                'sessionsDone' => $doneCounts->get($trainer->id, 0),
                'discipline' => $trainer->disciplines->first()?->name,
                'favorite' => in_array($trainer->id, $favoriteIds, true),
                'booked' => in_array($trainer->id, $bookedIds, true),
                'messageHref' => $records->has($trainer->id)
                    ? route('client.messages', ['con' => $records->get($trainer->id)], false)
                    : null,
            ])->all());
    }

    /**
     * @return array{trainerName: string, trainerFirstName: string, trainerHref: string}
     */
    public static function trainer(Booking $booking): array
    {
        $trainer = $booking->trainerProfile;

        return [
            'trainerName' => $trainer->user->name,
            'trainerFirstName' => $trainer->user->first_name,
            'trainerHref' => route('trainers.show', $trainer->slug, false),
        ];
    }

    /** Dates go to the frontend in UTC; the browser shows them in Europe/Rome. */
    public static function iso(CarbonInterface $date): string
    {
        return $date->utc()->format('Y-m-d\TH:i:s\Z');
    }

    /** The first discipline of the trainer, e.g. "Yoga" in "Yoga con Chiara Galli". */
    private static function discipline(Booking $booking): string
    {
        return $booking->trainerProfile->disciplines->first()->name ?? $booking->service_name;
    }

    /** e.g. 1.5 for an hour and a half. */
    private static function hours(Booking $booking): float
    {
        return $booking->starts_at->diffInMinutes($booking->ends_at) / 60;
    }
}
