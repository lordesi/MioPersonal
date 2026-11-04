<?php

namespace App\Support;

use App\Models\Booking;
use Carbon\CarbonInterface;

/**
 * The texts of the booking emails (resources/views/mail/booking): dates are
 * saved in UTC, written in Rome time and in Italian.
 */
final class BookingMailData
{
    /**
     * The fields of mail/partials/booking.blade.php, but status and badge:
     * "mer", "28", "ott", "13:00–13:30", the service and, under it, who and where.
     *
     * @return array{weekday: string, day: string, month: string, time: string, title: string, subtitle: string}
     */
    public static function card(Booking $booking, string $who): array
    {
        $start = self::rome($booking->starts_at);

        return [
            'weekday' => $start->isoFormat('ddd'),
            'day' => $start->format('j'),
            'month' => $start->isoFormat('MMM'),
            'time' => $start->format('H:i').'–'.self::rome($booking->ends_at)->format('H:i'),
            'title' => $booking->service_name,
            // "Giorgio Montana · Online"; only the name if the place is empty.
            'subtitle' => $booking->place_label === '' ? $who : "{$who} · {$booking->place_label}",
        ];
    }

    /** "gio 29 ott alle 18:30" */
    public static function when(CarbonInterface $date): string
    {
        return self::rome($date)->isoFormat('ddd D MMM [alle] HH:mm');
    }

    /** "mer 28 ott": the day of the session, for subjects and previews. */
    public static function day(Booking $booking): string
    {
        return self::rome($booking->starts_at)->isoFormat('ddd D MMM');
    }

    /** "13:00": when the session starts, for subjects. */
    public static function hour(Booking $booking): string
    {
        return self::rome($booking->starts_at)->format('H:i');
    }

    /** "+393912391238" → "+39 391 239 1238"; other numbers as they are. */
    public static function phone(?string $phone): ?string
    {
        if ($phone !== null && preg_match('/^\+39(\d{3})(\d{3})(\d{3,})$/', $phone, $parts) === 1) {
            return "+39 {$parts[1]} {$parts[2]} {$parts[3]}";
        }

        return $phone;
    }

    private static function rome(CarbonInterface $date): CarbonInterface
    {
        return $date->timezone('Europe/Rome')->locale('it');
    }
}
