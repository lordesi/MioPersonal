<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * The free start times of a trainer, computed from the weekly working hours
 * minus the active bookings (see docs/database/analisi.md §4.2). They are never
 * stored: only the first one is saved in `trainer_profiles.next_free_slot_at`,
 * for the search.
 *
 * Working hours are in Rome time and every day is converted on its own, so
 * "18:00" stays 18:00 when the clocks change.
 *
 * TODO (step 4): remove holidays and imported calendars.
 */
final class TrainerSlots
{
    public const TIMEZONE = 'Europe/Rome';

    /**
     * Day by day, from today in Rome. maxMinutes is the longest session that
     * fits from that start: the working hours in a row, up to the longest
     * duration the trainer accepts (e.g. 18:00 and 19:00 free → 120), and
     * ending a break before the next booking.
     *
     * @return list<array{date: string, slots: list<array{start: string, maxMinutes: int}>}>
     */
    public static function days(TrainerProfile $profile, int $days, ?CarbonImmutable $now = null): array
    {
        $now = ($now ?? CarbonImmutable::now())->setTimezone(self::TIMEZONE);
        $hoursByWeekday = self::hoursByWeekday($profile);
        $earliest = self::earliestStart($profile, $now);
        $lastDay = $now->startOfDay()->addDays($profile->booking_window_days);
        $bookings = self::activeBookings($profile, $now, $now->startOfDay()->addDays(min($days, $profile->booking_window_days)));
        $result = [];

        for ($index = 0; $index < $days; $index++) {
            $date = $now->startOfDay()->addDays($index);
            $slots = [];

            // "Metti in pausa": no free slots until the trainer turns the profile back on.
            if ($profile->paused_at !== null) {
                $result[] = ['date' => $date->toDateString(), 'slots' => []];

                continue;
            }

            $dayBookings = $bookings->filter(fn (array $booking) => $booking['start']->isSameDay($date));
            // "Massimo sedute al giorno": that day is full.
            $full = $profile->max_sessions_per_day !== null && $dayBookings->count() >= $profile->max_sessions_per_day;

            if ($date->lessThan($lastDay) && ! $full) {
                $hours = $hoursByWeekday[$date->dayOfWeekIso] ?? [];

                foreach ($hours as $hour) {
                    $slot = self::slot($profile, $date, $hour, $hours, $earliest, $bookings);

                    if ($slot !== null) {
                        $slots[] = $slot;
                    }
                }
            }

            $result[] = ['date' => $date->toDateString(), 'slots' => $slots];
        }

        return $result;
    }

    /** The first free start time inside the booking window, or null. */
    public static function next(TrainerProfile $profile, ?CarbonImmutable $now = null): ?CarbonImmutable
    {
        foreach (self::days($profile, $profile->booking_window_days, $now) as $day) {
            if ($day['slots'] !== []) {
                return CarbonImmutable::parse($day['slots'][0]['start']);
            }
        }

        return null;
    }

    /** Saves the first free start time, read by the search and its filters. */
    public static function refresh(TrainerProfile $profile, ?CarbonImmutable $now = null): void
    {
        $profile->forceFill(['next_free_slot_at' => self::next($profile, $now)])->save();
    }

    /**
     * Whether a session of `$minutes` can start at `$start` (one of the free start times).
     */
    public static function isFree(TrainerProfile $profile, CarbonImmutable $start, int $minutes, ?CarbonImmutable $now = null): bool
    {
        $now = ($now ?? CarbonImmutable::now())->setTimezone(self::TIMEZONE);
        $start = $start->setTimezone(self::TIMEZONE);
        $index = (int) $now->startOfDay()->diffInDays($start->startOfDay());

        if ($index < 0 || $index >= $profile->booking_window_days) {
            return false;
        }

        $day = self::days($profile, $index + 1, $now)[$index];
        $iso = $start->utc()->format('Y-m-d\TH:i:s\Z');

        foreach ($day['slots'] as $slot) {
            if ($slot['start'] === $iso) {
                return $slot['maxMinutes'] >= $minutes;
            }
        }

        return false;
    }

    /**
     * @param  list<int>  $hours  start hours of that day
     * @param  Collection<int, array{start: CarbonImmutable, blockedUntil: CarbonImmutable}>  $bookings
     * @return array{start: string, maxMinutes: int}|null
     */
    private static function slot(TrainerProfile $profile, CarbonImmutable $date, int $hour, array $hours, CarbonImmutable $earliest, Collection $bookings): ?array
    {
        $start = $date->setTime($hour, 0);

        if ($start->lessThan($earliest)) {
            return null;
        }

        // Taken by a booking that started earlier (or by its break).
        if ($bookings->contains(fn (array $booking) => $booking['start']->lessThanOrEqualTo($start) && $booking['blockedUntil']->greaterThan($start))) {
            return null;
        }

        $durations = $profile->session_minutes ?: [60];
        $hoursInARow = 1;

        while (in_array($hour + $hoursInARow, $hours, true)) {
            $hoursInARow++;
        }

        $end = $date->setTime($hour + $hoursInARow, 0);
        // The next booking: the session must end a break before it.
        $next = $bookings->first(fn (array $booking) => $booking['start']->greaterThan($start) && $booking['start']->lessThan($end));

        if ($next !== null) {
            $end = $next['start']->subMinutes($profile->break_minutes);
        }

        $freeMinutes = max(0, (int) $start->diffInMinutes($end));

        // Not even the shortest session fits (e.g. only 2-hour sessions and one free hour).
        if (min($durations) > $freeMinutes) {
            return null;
        }

        return [
            'start' => $start->utc()->format('Y-m-d\TH:i:s\Z'),
            'maxMinutes' => min($freeMinutes, max($durations)),
        ];
    }

    /**
     * Weekday (1 = Monday) => start hours, e.g. 18:00–21:00 → [18, 19, 20].
     *
     * @return array<int, list<int>>
     */
    private static function hoursByWeekday(TrainerProfile $profile): array
    {
        $hours = [];

        foreach ($profile->workingHours as $range) {
            $hours[$range->weekday] = [...$hours[$range->weekday] ?? [], ...$range->startHours()];
        }

        return array_map(function (array $day) {
            sort($day);

            return array_values(array_unique($day));
        }, $hours);
    }

    /**
     * The bookings that take time in these days, in Rome time, by start.
     *
     * @return Collection<int, array{start: CarbonImmutable, blockedUntil: CarbonImmutable}>
     */
    private static function activeBookings(TrainerProfile $profile, CarbonImmutable $from, CarbonImmutable $until): Collection
    {
        return $profile->bookings()
            ->active()
            ->where('blocked_until', '>', $from->startOfDay())
            ->where('starts_at', '<', $until)
            ->orderBy('starts_at')
            ->get(['starts_at', 'blocked_until'])
            ->map(fn (Booking $booking) => [
                'start' => $booking->starts_at->setTimezone(self::TIMEZONE),
                'blockedUntil' => $booking->blocked_until->setTimezone(self::TIMEZONE),
            ])
            ->values();
    }

    /** Minimum notice ("Preavviso minimo") and the end of a pause. */
    private static function earliestStart(TrainerProfile $profile, CarbonImmutable $now): CarbonImmutable
    {
        $earliest = $now->addHours($profile->notice_hours);
        $pausedUntil = $profile->paused_until?->toImmutable()->setTimezone(self::TIMEZONE);

        return $pausedUntil !== null && $pausedUntil->greaterThan($earliest) ? $pausedUntil : $earliest;
    }
}
