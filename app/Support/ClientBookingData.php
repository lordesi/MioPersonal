<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Enums\TrainerProfileStatus;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\Review;
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
    public const RELATIONS = ['trainerProfile.user', 'trainerProfile.disciplines', 'clientPackage.bookings'];

    /** "I tuoi trainer": a short list, the search has the others. */
    private const TRAINERS_LIMIT = 5;

    /** "Prossime": confirmed and not over yet. */
    public static function isUpcoming(Booking $booking): bool
    {
        return $booking->status === BookingStatus::Confirmed && $booking->ends_at->isFuture();
    }

    /** Waiting for the trainer, or refused/expired: shown until the time has passed. */
    public static function isPending(Booking $booking): bool
    {
        return $booking->starts_at->isFuture()
            && in_array($booking->status, [BookingStatus::Pending, BookingStatus::Declined, BookingStatus::Expired], true);
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
            'freeCancellationUntil' => self::iso($booking->starts_at->subHours($booking->trainerProfile->free_cancellation_hours)),
            'calendarHref' => route('client.bookings.calendar', $booking, false),
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
            'status' => match (true) {
                $booking->status === BookingStatus::Declined => 'declined',
                $booking->isExpired() => 'expired',
                default => 'pending',
            },
            'expiresAt' => $booking->isPending() && $booking->expires_at !== null ? self::iso($booking->expires_at) : null,
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
     * `booked` counts the sessions that take a place (done ones included),
     * `nextStart` is the next session already booked.
     *
     * @return list<array<string, mixed>>
     */
    public static function packages(User $client): array
    {
        return array_values($client->clientPackages()
            ->bought()
            ->withSessionCounts()
            ->with(['trainerProfile.user', 'bookings' => fn ($bookings) => $bookings->active()->where('ends_at', '>', now())->orderBy('starts_at')])
            ->oldest('bought_at')
            ->get()
            ->filter(fn (ClientPackage $package) => ($package->done_count ?? 0) < $package->sessions_total)
            ->map(function (ClientPackage $package) {
                /** @var Booking|null $next */
                $next = $package->bookings->first();

                return [
                    'id' => $package->id,
                    'name' => $package->name,
                    'trainerName' => $package->trainerProfile->user->name,
                    'trainerHref' => route('trainers.show', $package->trainerProfile->slug, false),
                    'total' => $package->sessions_total,
                    'done' => $package->done_count ?? 0,
                    'booked' => $package->bookedCount(),
                    'nextStart' => $next === null ? null : self::iso($next->starts_at),
                ];
            })->all());
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

        return array_values($booked
            ->concat($favorites->whereNotIn('id', $bookedIds))
            ->take(self::TRAINERS_LIMIT)
            ->map(fn (TrainerProfile $trainer) => [
                'name' => $trainer->user->name,
                'href' => route('trainers.show', $trainer->slug, false),
                'discipline' => $trainer->disciplines->first()?->name,
                'nextSlotStart' => $trainer->next_free_slot_at === null ? null : self::iso($trainer->next_free_slot_at),
                'favorite' => in_array($trainer->id, $favoriteIds, true),
                'booked' => in_array($trainer->id, $bookedIds, true),
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
