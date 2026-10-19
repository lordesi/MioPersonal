<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\Booking;

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

        // Its place among the package's sessions that count: confirmed or waiting.
        $position = $package->bookings
            ->filter(fn (Booking $session) => $session->status === BookingStatus::Confirmed || $session->isPending())
            ->filter(fn (Booking $session) => $session->starts_at <= $booking->starts_at)
            ->count();

        // Cancelled or refused: it no longer takes a place of the package.
        if ($position === 0) {
            return $package->name;
        }

        return "{$package->name} · seduta {$position} di {$package->sessions_total}";
    }
}
