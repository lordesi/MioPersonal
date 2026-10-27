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
    /** Filter of "Sedute passate": only the done ones or only the missed ones. */
    public const DONE = 'done';

    public const MISSED = 'missed';

    /**
     * Confirmed and over, the most recent first; with a filter only the done
     * or only the missed ones.
     *
     * @param  self::DONE|self::MISSED|null  $filter
     * @return Builder<Booking>
     */
    public static function query(TrainerProfile $profile, ?string $filter = null): Builder
    {
        return self::over($profile)
            ->when($filter === self::DONE, fn (Builder $query) => $query->whereNull('no_show_at'))
            ->when($filter === self::MISSED, fn (Builder $query) => $query->whereNotNull('no_show_at'))
            ->with(TrainerSessions::WITH)
            ->orderByDesc('starts_at');
    }

    /**
     * The numbers next to "Tutte", "Effettuate" and "Saltate".
     *
     * @return array{all: int, done: int, missed: int}
     */
    public static function counts(TrainerProfile $profile): array
    {
        $all = self::over($profile)->count();
        $missed = self::over($profile)->whereNotNull('no_show_at')->count();

        return ['all' => $all, 'done' => $all - $missed, 'missed' => $missed];
    }

    /**
     * "Ultimi 7 giorni" of "Sedute passate": the sessions over that can still
     * be changed (ended less than Booking::NO_SHOW_DAYS ago).
     *
     * @return array{sessions: int, hours: float, clients: int, missed: int, first: string|null, last: string|null}
     */
    public static function lastWeek(TrainerProfile $profile): array
    {
        $sessions = self::over($profile)
            ->where('ends_at', '>', now()->subDays(Booking::NO_SHOW_DAYS))
            ->orderBy('starts_at')
            ->get(['client_id', 'starts_at', 'ends_at', 'no_show_at']);

        // Rome calendar days, "2026-10-19": the browser writes "19 – 22 ottobre".
        $day = fn (?Booking $booking) => $booking?->starts_at->timezone('Europe/Rome')->format('Y-m-d');

        return [
            'sessions' => $sessions->count(),
            'hours' => (float) $sessions->sum(fn (Booking $booking) => $booking->starts_at->diffInMinutes($booking->ends_at) / 60),
            // Deleted accounts (client_id null) are not counted.
            'clients' => $sessions->pluck('client_id')->filter()->unique()->count(),
            'missed' => $sessions->whereNotNull('no_show_at')->count(),
            'first' => $day($sessions->first()),
            'last' => $day($sessions->last()),
        ];
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
            'package' => self::packageProgress($booking),
            'placeLabel' => $booking->place_label,
            'noShow' => $booking->no_show_at !== null,
            // After 7 days the session stays as it is.
            'canChangeNoShow' => $booking->canChangeNoShow(),
            // "Modificabile fino a gio 29 ott".
            'noShowUntil' => $booking->ends_at->addDays(Booking::NO_SHOW_DAYS)->utc()->format('Y-m-d\TH:i:s\Z'),
        ];
    }

    /**
     * Confirmed and over, without order or relations: the base of the others.
     *
     * @return Builder<Booking>
     */
    private static function over(TrainerProfile $profile): Builder
    {
        return Booking::query()
            ->whereBelongsTo($profile)
            ->where('status', BookingStatus::Confirmed)
            ->where('ends_at', '<=', now());
    }

    /**
     * "Seduta 2 di 10" as numbers, for the cells of the package; null for a
     * single session.
     *
     * @return array{position: int, total: int}|null
     */
    private static function packageProgress(Booking $booking): ?array
    {
        $position = BookingLabels::position($booking);

        if ($booking->clientPackage === null || $position === 0) {
            return null;
        }

        return ['position' => $position, 'total' => $booking->clientPackage->sessions_total];
    }
}
