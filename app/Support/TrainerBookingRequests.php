<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\TrainerProfile;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * The bookings waiting for the trainer's answer: the page "Richieste" and the
 * summary in "Panoramica". The ones expiring first on top.
 */
final class TrainerBookingRequests
{
    /**
     * @return HasMany<Booking, TrainerProfile>
     */
    public static function query(TrainerProfile $profile): HasMany
    {
        return $profile->bookings()
            ->awaitingAnswer()
            ->with(TrainerSessions::WITH)
            ->orderBy('expires_at');
    }

    /**
     * In the format of TrainerBookingRequest (resources/js/types/trainer.ts),
     * with how often the client shows up: it helps to decide.
     *
     * @param  Collection<int, Booking>  $requests
     * @return list<array<string, mixed>>
     */
    public static function rows(Collection $requests, TrainerProfile $profile): array
    {
        $attendance = ClientAttendance::forClients($requests->pluck('client_id'), $profile);

        return array_values($requests
            ->map(fn (Booking $booking) => [
                ...TrainerSessions::row($booking),
                'note' => $booking->client_note,
                'expiresAt' => $booking->expires_at === null ? null : ClientBookingData::iso($booking->expires_at),
                // null once the client deleted the account.
                'attendance' => $booking->client_id === null ? null : $attendance[$booking->client_id],
            ])
            ->all());
    }
}
