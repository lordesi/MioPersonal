<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * "Aggiungi al calendario": a confirmed session as an .ics file, the format
 * Google Calendar, Apple Calendar and Outlook all open. Written by hand: it
 * is a few lines of text, no library needed.
 */
class ClientCalendarController extends Controller
{
    public function __invoke(Request $request, Booking $booking): Response
    {
        /** @var User $client */
        $client = $request->user();

        // Someone else's booking, or not confirmed (yet): as if it didn't exist.
        abort_unless($booking->client_id === $client->id && $booking->status === BookingStatus::Confirmed, 404);

        $booking->load(['trainerProfile.user', 'trainerProfile.disciplines']);
        $trainer = $booking->trainerProfile;
        $discipline = $trainer->disciplines->first()->name ?? $booking->service_name;

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//MioPersonal//Prenotazioni//IT',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            // Same UID for the same session: downloading it again updates the event.
            'UID:booking-'.$booking->id.'@miopersonal',
            'DTSTAMP:'.self::date(now()),
            'DTSTART:'.self::date($booking->starts_at),
            'DTEND:'.self::date($booking->ends_at),
            'SUMMARY:'.self::text("{$discipline} con {$trainer->user->name}"),
            'LOCATION:'.self::text($booking->place_label),
            'DESCRIPTION:'.self::text("{$booking->service_name}. Prenotazione su MioPersonal: ".route('client.home')),
            'URL:'.route('trainers.show', $trainer->slug),
            'END:VEVENT',
            'END:VCALENDAR',
        ];

        // The format wants CRLF line ends and lines of at most 75 bytes.
        $ics = implode("\r\n", array_map(self::fold(...), $lines))."\r\n";

        return response($ics, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="seduta-'.$booking->starts_at->setTimezone('Europe/Rome')->format('Y-m-d').'.ics"',
        ]);
    }

    /** In UTC, e.g. 20261019T110000Z: the calendar shows it in the user's time zone. */
    private static function date(CarbonInterface $date): string
    {
        return $date->utc()->format('Ymd\THis\Z');
    }

    /** Commas, semicolons, backslashes and new lines have a special meaning in the format. */
    private static function text(string $value): string
    {
        return str_replace(['\\', ';', ',', "\r\n", "\n"], ['\\\\', '\;', '\,', '\n', '\n'], $value);
    }

    /** Long lines go on, after a line break, on lines starting with a space. */
    private static function fold(string $line): string
    {
        $parts = [];

        while (strlen($line) > 75) {
            // mb_strcut never splits a letter like "à" in two.
            $part = mb_strcut($line, 0, $parts === [] ? 75 : 74, 'UTF-8');
            $parts[] = $part;
            $line = substr($line, strlen($part));
        }

        $parts[] = $line;

        return implode("\r\n ", $parts);
    }
}
