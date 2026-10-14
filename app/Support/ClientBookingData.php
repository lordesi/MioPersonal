<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Enums\TrainerProfileStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonInterface;

/**
 * A client's bookings and favorites in the format of the client pages
 * (resources/js/types/booking.ts): shared by "Home" and "Le mie prenotazioni".
 * Load the bookings with `trainerProfile.user` and `trainerProfile.disciplines`.
 */
final class ClientBookingData
{
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
     * ClientUpcomingBooking.
     *
     * @return array<string, mixed>
     */
    public static function upcoming(Booking $booking): array
    {
        return [
            ...self::trainer($booking),
            'id' => $booking->id,
            // The first discipline of the trainer, e.g. "Yoga con Chiara Galli".
            'discipline' => $booking->trainerProfile->disciplines->first()->name ?? $booking->service_name,
            'start' => self::iso($booking->starts_at),
            'hours' => self::hours($booking),
            'placeLabel' => $booking->place_label,
            'status' => 'confirmed',
            'freeCancellationUntil' => self::iso($booking->starts_at->subHours($booking->trainerProfile->free_cancellation_hours)),
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
     * The "Trainer preferiti" row, with their first free slot.
     *
     * @return list<array{name: string, href: string, nextSlotStart: string|null}>
     */
    public static function favorites(User $client): array
    {
        return array_values($client->favoriteTrainers()
            ->where('trainer_profiles.status', TrainerProfileStatus::Approved)
            ->with('user')
            ->get()
            ->map(fn (TrainerProfile $trainer) => [
                'name' => $trainer->user->name,
                'href' => route('trainers.show', $trainer->slug, false),
                'nextSlotStart' => $trainer->next_free_slot_at === null ? null : self::iso($trainer->next_free_slot_at),
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

    /** e.g. 1.5 for an hour and a half. */
    private static function hours(Booking $booking): float
    {
        return $booking->starts_at->diffInMinutes($booking->ends_at) / 60;
    }
}
