<?php

namespace App\Support;

use App\Enums\BookingGuestStatus;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingGuest;

/**
 * What the trainer reads about the service of a session: "Seduta singola", or
 * "Pacchetto 10 sedute · seduta 1 di 10" for the sessions of a package.
 * Load the bookings with `clientPackage.bookings`.
 */
final class BookingLabels
{
    public static function service(Booking $booking): string
    {
        $package = $booking->clientPackage;

        if ($package === null) {
            return $booking->service_name;
        }

        $position = self::position($booking);

        // Cancelled or refused: it no longer takes a place of the package.
        if ($position === 0) {
            return $package->name;
        }

        return "{$package->name} · seduta {$position} di {$package->sessions_total}";
    }

    /**
     * For the trainer: the service, and "3 persone" for a session of more
     * people ("Invita un amico"): "Seduta singola · 3 persone".
     */
    public static function serviceForTrainer(Booking $booking): string
    {
        $service = self::service($booking);

        return $booking->people > 1 ? "{$service} · {$booking->people} persone" : $service;
    }

    /**
     * "Invita un amico": the friends who joined, as the trainer sees them
     * (first and last name, like the client). Load `guests.user`.
     *
     * @return list<string>
     */
    public static function guestNames(Booking $booking): array
    {
        if ($booking->people <= 1) {
            return [];
        }

        return array_values($booking->guests
            ->where('status', BookingGuestStatus::Joined)
            ->map(fn (BookingGuest $guest) => $guest->user->name ?? 'Account eliminato')
            ->all());
    }

    /** Its place among the package's sessions that count: confirmed or waiting. 0 without a package. */
    public static function position(Booking $booking): int
    {
        return $booking->clientPackage?->bookings
            ->filter(fn (Booking $session) => $session->status === BookingStatus::Confirmed || $session->isPending())
            ->filter(fn (Booking $session) => $session->starts_at <= $booking->starts_at)
            ->count() ?? 0;
    }
}
