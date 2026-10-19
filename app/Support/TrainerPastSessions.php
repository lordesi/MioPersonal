<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use Illuminate\Database\Eloquent\Builder;

/**
 * The trainer's finished sessions: "Ultimi 7 giorni" in "Le tue prenotazioni"
 * and the page "Sedute passate". Each one is done ("Effettuata") unless the
 * trainer marked it as missed ("Saltata"), which is possible for 7 days.
 */
final class TrainerPastSessions
{
    /**
     * Confirmed and over, the most recent first.
     *
     * @return Builder<Booking>
     */
    public static function query(TrainerProfile $profile): Builder
    {
        return Booking::query()
            ->whereBelongsTo($profile)
            ->where('status', BookingStatus::Confirmed)
            ->where('ends_at', '<=', now())
            ->with(TrainerSessions::WITH)
            ->orderByDesc('starts_at');
    }

    /**
     * In the format of TrainerPastSession (resources/js/types/trainer.ts).
     *
     * @return array<string, mixed>
     */
    public static function row(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            // For the link to the client's profile; null once the account is deleted.
            'clientId' => $booking->client_id,
            'clientName' => $booking->client->name ?? 'Account eliminato',
            // UTC: the browser shows it in Europe/Rome.
            'start' => $booking->starts_at->utc()->format('Y-m-d\TH:i:s\Z'),
            'hours' => $booking->starts_at->diffInMinutes($booking->ends_at) / 60,
            'serviceName' => BookingLabels::service($booking),
            'placeLabel' => $booking->place_label,
            'noShow' => $booking->no_show_at !== null,
            // After 7 days the session stays as it is.
            'canChangeNoShow' => $booking->canChangeNoShow(),
        ];
    }
}
