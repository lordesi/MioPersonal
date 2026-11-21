<?php

namespace App\Support;

use App\Enums\GroupSessionStatus;
use App\Enums\GymLinkStatus;
use App\Enums\TrainerProfileStatus;
use App\Models\Booking;
use App\Models\CalendarBusyTime;
use App\Models\GroupSession;
use App\Models\TrainerDayOverride;
use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
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
 * Working hours are ranges on the half hour (WorkingRanges). Start times are
 * every hour from the start of a range (07:30–12:00 → 07:30, 08:30 …), plus
 * the half hour left free by a 30-minute session (18:00–18:30 booked →
 * 18:30, for 30-minute sessions only).
 *
 * A day in `trainer_day_overrides` ("Giorni e settimane diverse") uses its
 * own hours instead of the weekly ones; no hours = closed (holidays).
 *
 * "Blocca gli orari occupati": the times the trainer is busy on Google
 * (`calendar_busy_times`) take their time like a session, break included,
 * but don't count as sessions for "Massimo sedute al giorno".
 *
 * @phpstan-type Preloaded array{overrides: EloquentCollection<int, TrainerDayOverride>, bookings: EloquentCollection<int, Booking>, events: EloquentCollection<int, GroupSession>, busy: EloquentCollection<int, CalendarBusyTime>}
 */
final class TrainerSlots
{
    public const TIMEZONE = 'Europe/Rome';

    /**
     * Day by day, from today in Rome. maxMinutes is the longest session that
     * fits from that start: the working hours in a row, up to the longest
     * duration the trainer accepts (e.g. 18:00 and 19:00 free → 120), and
     * ending a break before the next booking. closed: the trainer doesn't work
     * that day (no working hours, paused, after the booking window); without
     * slots and not closed, the day is full.
     *
     * $exceptBookingId: a booking (and its proposal) that doesn't take its
     * time, to move it ("Sposta").
     *
     * @return list<array{date: string, closed: bool, slots: list<array{start: string, maxMinutes: int}>}>
     */
    public static function days(TrainerProfile $profile, int $days, ?CarbonImmutable $now = null, ?int $exceptBookingId = null): array
    {
        return self::compute($profile, $days, $now, $exceptBookingId);
    }

    /**
     * days() for many trainers at once (the search with a date or a time
     * band): the working hours, the days with their own hours, the bookings,
     * the events and the busy times of all of them are read in a few queries,
     * not five per trainer. The days are the same as days() one by one.
     *
     * @param  EloquentCollection<int, TrainerProfile>  $profiles
     * @return array<int, list<array{date: string, closed: bool, slots: list<array{start: string, maxMinutes: int}>}>> by profile id
     */
    public static function daysForMany(EloquentCollection $profiles, int $days, ?CarbonImmutable $now = null): array
    {
        if ($profiles->isEmpty()) {
            return [];
        }

        $now = ($now ?? CarbonImmutable::now())->setTimezone(self::TIMEZONE);
        $from = $now->startOfDay();
        // The widest window: each trainer's own booking window is applied in activeBookings().
        $until = $from->addDays($days);
        $ids = $profiles->modelKeys();

        $profiles->loadMissing('workingHours');

        $overrides = TrainerDayOverride::query()
            ->whereIn('trainer_profile_id', $ids)
            ->whereBetween('date', [$from->toDateString(), $from->addDays($days - 1)->toDateString()])
            ->get(['trainer_profile_id', 'date', 'hours'])
            ->groupBy('trainer_profile_id');

        $bookings = Booking::query()
            ->whereIn('trainer_profile_id', $ids)
            ->active()
            ->where(fn ($query) => self::takingTime($query, $from, $until))
            ->get([...self::BOOKING_COLUMNS, 'trainer_profile_id'])
            ->groupBy('trainer_profile_id');

        $events = GroupSession::query()
            ->join('group_session_hosts as host', 'host.group_session_id', '=', 'group_sessions.id')
            ->whereIn('host.trainer_profile_id', $ids)
            ->where('host.status', GymLinkStatus::Accepted)
            ->where('group_sessions.status', GroupSessionStatus::Published)
            ->where('group_sessions.ends_at', '>', $from)
            ->where('group_sessions.starts_at', '<', $until)
            ->get(['host.trainer_profile_id as host_trainer_profile_id', 'group_sessions.id', 'group_sessions.starts_at', 'group_sessions.ends_at'])
            ->groupBy('host_trainer_profile_id');

        $busy = CalendarBusyTime::query()
            ->join('trainer_calendar_connections as connection', 'connection.id', '=', 'calendar_busy_times.trainer_calendar_connection_id')
            ->whereIn('connection.trainer_profile_id', $ids)
            ->whereNotNull('connection.reads_busy_at')
            ->where('calendar_busy_times.ends_at', '>', $from)
            ->where('calendar_busy_times.starts_at', '<', $until)
            ->get(['connection.trainer_profile_id as busy_trainer_profile_id', 'calendar_busy_times.starts_at', 'calendar_busy_times.ends_at'])
            ->groupBy('busy_trainer_profile_id');

        $result = [];

        foreach ($profiles as $profile) {
            $result[$profile->id] = self::compute($profile, $days, $now, null, [
                'overrides' => $overrides->get($profile->id, new EloquentCollection),
                'bookings' => $bookings->get($profile->id, new EloquentCollection),
                'events' => $events->get($profile->id, new EloquentCollection),
                'busy' => $busy->get($profile->id, new EloquentCollection),
            ]);
        }

        return $result;
    }

    /** What activeBookings() reads of a booking. */
    private const BOOKING_COLUMNS = ['id', 'starts_at', 'ends_at', 'blocked_until', 'proposed_starts_at', 'proposal_expires_at'];

    /**
     * The bookings taking time from `$from` (start of a day) to `$until`: a
     * session (with its break), or a new time proposed and not answered yet.
     *
     * @param  Builder<Booking>  $query
     */
    private static function takingTime(Builder $query, CarbonImmutable $from, CarbonImmutable $until): void
    {
        $query
            ->where(fn ($booked) => $booked->where('blocked_until', '>', $from)->where('starts_at', '<', $until))
            ->orWhere(fn ($proposed) => $proposed->whereNotNull('proposed_starts_at')->where('proposal_expires_at', '>', now()));
    }

    /**
     * @param  Preloaded|null  $preloaded  read by daysForMany(); null = read here
     * @return list<array{date: string, closed: bool, slots: list<array{start: string, maxMinutes: int}>}>
     */
    private static function compute(TrainerProfile $profile, int $days, ?CarbonImmutable $now, ?int $exceptBookingId, ?array $preloaded = null): array
    {
        $now = ($now ?? CarbonImmutable::now())->setTimezone(self::TIMEZONE);
        $rangesByWeekday = self::rangesByWeekday($profile);
        $earliest = self::earliestStart($profile, $now);
        $lastDay = $now->startOfDay()->addDays($profile->booking_window_days);
        $bookings = self::activeBookings($profile, $now, $now->startOfDay()->addDays(min($days, $profile->booking_window_days)), $exceptBookingId, $preloaded);
        // "Giorni e settimane diverse": these dates have their own hours (or none).
        $overrides = self::overrides($profile, $now->startOfDay(), $now->startOfDay()->addDays($days - 1), $preloaded['overrides'] ?? null);
        $result = [];

        for ($index = 0; $index < $days; $index++) {
            $date = $now->startOfDay()->addDays($index);
            $slots = [];

            // "Metti in pausa": no free slots until the trainer turns the profile back on.
            if ($profile->paused_at !== null) {
                $result[] = ['date' => $date->toDateString(), 'closed' => true, 'slots' => []];

                continue;
            }

            $dayBookings = $bookings->filter(fn (array $booking) => ! ($booking['external'] ?? false) && $booking['start']->isSameDay($date));
            // "Massimo sedute al giorno": that day is full.
            $full = $profile->max_sessions_per_day !== null && $dayBookings->count() >= $profile->max_sessions_per_day;

            $ranges = $date->lessThan($lastDay)
                ? $overrides[$date->toDateString()] ?? $rangesByWeekday[$date->dayOfWeekIso] ?? []
                : [];

            if (! $full) {
                foreach ($ranges as [$from, $to]) {
                    for ($minute = $from; $minute < $to; $minute += 60) {
                        $slot = self::slot($profile, $date, $minute, $to, $earliest, $bookings)
                            ?? self::halfHourSlot($profile, $date, $minute, min($minute + 60, $to), $earliest, $bookings);

                        if ($slot !== null) {
                            $slots[] = $slot;
                        }
                    }
                }
            }

            $result[] = ['date' => $date->toDateString(), 'closed' => $ranges === [], 'slots' => $slots];
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
     * The saved first free slots already passed, computed again before a page
     * shows the cards: the hourly `trainers:refresh-slots` may not have run yet
     * (or the scheduler is off), and "gio 22" must never be in the past.
     */
    public static function refreshStale(?CarbonImmutable $now = null): void
    {
        TrainerProfile::query()
            ->where('status', TrainerProfileStatus::Approved)
            ->where('next_free_slot_at', '<', $now ?? CarbonImmutable::now())
            ->with('workingHours')
            ->each(fn (TrainerProfile $profile) => self::refresh($profile, $now));
    }

    /**
     * Whether a session of `$minutes` can start at `$start` (one of the free start times).
     */
    public static function isFree(TrainerProfile $profile, CarbonImmutable $start, int $minutes, ?CarbonImmutable $now = null, ?int $exceptBookingId = null): bool
    {
        $now = ($now ?? CarbonImmutable::now())->setTimezone(self::TIMEZONE);
        $start = $start->setTimezone(self::TIMEZONE);
        $index = (int) $now->startOfDay()->diffInDays($start->startOfDay());

        if ($index < 0 || $index >= $profile->booking_window_days) {
            return false;
        }

        $day = self::days($profile, $index + 1, $now, $exceptBookingId)[$index];
        $iso = $start->utc()->format('Y-m-d\TH:i:s\Z');

        foreach ($day['slots'] as $slot) {
            if ($slot['start'] === $iso) {
                return $slot['maxMinutes'] >= $minutes;
            }
        }

        return false;
    }

    /**
     * A start at `$minute` of the day, free until `$rangeEnd` (the end of its
     * range of working hours), or to the break before the next booking.
     *
     * @param  Collection<int, array{start: CarbonImmutable, blockedUntil: CarbonImmutable, external?: bool}>  $bookings
     * @return array{start: string, maxMinutes: int}|null
     */
    private static function slot(TrainerProfile $profile, CarbonImmutable $date, int $minute, int $rangeEnd, CarbonImmutable $earliest, Collection $bookings): ?array
    {
        $start = self::at($date, $minute);

        if ($start->lessThan($earliest)) {
            return null;
        }

        // Taken by a booking that started earlier (or by its break).
        if ($bookings->contains(fn (array $booking) => $booking['start']->lessThanOrEqualTo($start) && $booking['blockedUntil']->greaterThan($start))) {
            return null;
        }

        $durations = $profile->session_minutes ?: [60];
        $freeMinutes = self::freeMinutes($profile, $start, self::at($date, $rangeEnd), $bookings);

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
     * "L'altra mezz'ora": a booking took the start of the hour and ended at the
     * half (e.g. a 30-minute session at 18:00), so 18:30 is free for another
     * 30-minute session, and only for that (maxMinutes is always 30).
     *
     * @param  Collection<int, array{start: CarbonImmutable, blockedUntil: CarbonImmutable, external?: bool}>  $bookings
     * @return array{start: string, maxMinutes: int}|null
     */
    private static function halfHourSlot(TrainerProfile $profile, CarbonImmutable $date, int $minute, int $hourEnd, CarbonImmutable $earliest, Collection $bookings): ?array
    {
        $hourStart = self::at($date, $minute);
        $start = self::at($date, $minute + 30);

        if (! in_array(30, $profile->session_minutes ?: [60], true) || $start->lessThan($earliest)) {
            return null;
        }

        $takenAt = fn (CarbonImmutable $time) => $bookings->contains(fn (array $booking) => $booking['start']->lessThanOrEqualTo($time) && $booking['blockedUntil']->greaterThan($time));

        // An hour all free stays whole; a half taken (or still in its break) isn't free.
        if (! $takenAt($hourStart) || $takenAt($start)) {
            return null;
        }

        if (self::freeMinutes($profile, $start, self::at($date, $hourEnd), $bookings) < 30) {
            return null;
        }

        return ['start' => $start->utc()->format('Y-m-d\TH:i:s\Z'), 'maxMinutes' => 30];
    }

    /**
     * The minutes from `$start` to `$end`, or to a break before the next booking.
     *
     * @param  Collection<int, array{start: CarbonImmutable, blockedUntil: CarbonImmutable, external?: bool}>  $bookings
     */
    private static function freeMinutes(TrainerProfile $profile, CarbonImmutable $start, CarbonImmutable $end, Collection $bookings): int
    {
        // The next booking: the session must end a break before it.
        $next = $bookings->first(fn (array $booking) => $booking['start']->greaterThan($start) && $booking['start']->lessThan($end));

        if ($next !== null) {
            $end = $next['start']->subMinutes($profile->break_minutes);
        }

        return max(0, (int) $start->diffInMinutes($end));
    }

    /** The time `$minutes` after the start of `$date` (1440 = midnight after). */
    private static function at(CarbonImmutable $date, int $minutes): CarbonImmutable
    {
        return $date->setTime(intdiv($minutes, 60), $minutes % 60);
    }

    /**
     * Weekday (1 = Monday) => ranges in minutes, e.g. 18:00–21:00 → [[1080, 1260]].
     *
     * @return array<int, list<array{int, int}>>
     */
    private static function rangesByWeekday(TrainerProfile $profile): array
    {
        $ranges = [];

        foreach ($profile->workingHours as $range) {
            $ranges[$range->weekday][] = $range->range();
        }

        return array_map(WorkingRanges::normalize(...), $ranges);
    }

    /**
     * Rome date => ranges of the days with their own hours ([] = closed).
     *
     * @param  EloquentCollection<int, TrainerDayOverride>|null  $preloaded  the ones of these days, from daysForMany()
     * @return array<string, list<array{int, int}>>
     */
    private static function overrides(TrainerProfile $profile, CarbonImmutable $from, CarbonImmutable $to, ?EloquentCollection $preloaded = null): array
    {
        $overrides = $preloaded ?? $profile->dayOverrides()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->get(['date', 'hours']);

        return $overrides
            ->mapWithKeys(fn (TrainerDayOverride $override) => [
                $override->date->toDateString() => WorkingRanges::normalize($override->hours),
            ])
            ->all();
    }

    /**
     * The bookings that take time in these days, in Rome time, by start. A
     * new time proposed by the trainer ("Sposta") takes its time too, until
     * the client answers or the proposal expires. So do the events the
     * trainer organizes, and the times they're busy on Google (external).
     *
     * With `$preloaded` (daysForMany(), read up to a wider `$until` for all
     * the trainers), the same rules are applied here to this trainer's window.
     *
     * @param  Preloaded|null  $preloaded
     * @return Collection<int, array{start: CarbonImmutable, blockedUntil: CarbonImmutable, external?: bool}>
     */
    private static function activeBookings(TrainerProfile $profile, CarbonImmutable $from, CarbonImmutable $until, ?int $exceptBookingId = null, ?array $preloaded = null): Collection
    {
        $dayStart = $from->startOfDay();

        $bookings = $preloaded === null
            ? $profile->bookings()
                ->active()
                ->when($exceptBookingId !== null, fn ($query) => $query->whereKeyNot($exceptBookingId))
                ->where(fn ($query) => self::takingTime($query, $dayStart, $until))
                ->get(self::BOOKING_COLUMNS)
            : $preloaded['bookings']->filter(fn (Booking $booking) => ($booking->blocked_until->greaterThan($dayStart) && $booking->starts_at->lessThan($until))
                || ($booking->proposed_starts_at !== null && $booking->proposal_expires_at?->greaterThan(now())));

        // "Eventi": the trainer's events take their time too.
        $events = ($preloaded === null
            ? GroupSession::query()
                ->hostedBy($profile)
                ->where('status', GroupSessionStatus::Published)
                ->where('ends_at', '>', $dayStart)
                ->where('starts_at', '<', $until)
                ->get(['id', 'starts_at', 'ends_at'])
            : $preloaded['events']->filter(fn (GroupSession $event) => $event->starts_at->lessThan($until)))
            ->map(fn (GroupSession $event) => [
                'start' => $event->starts_at->setTimezone(self::TIMEZONE),
                'blockedUntil' => $event->ends_at->setTimezone(self::TIMEZONE),
            ]);

        return $bookings
            ->flatMap(function (Booking $booking) {
                $times = [[
                    'start' => $booking->starts_at->setTimezone(self::TIMEZONE),
                    'blockedUntil' => $booking->blocked_until->setTimezone(self::TIMEZONE),
                ]];

                $proposal = $booking->proposal();

                if ($proposal !== null) {
                    $times[] = [
                        'start' => $proposal['start']->setTimezone(self::TIMEZONE),
                        'blockedUntil' => $proposal['blockedUntil']->setTimezone(self::TIMEZONE),
                    ];
                }

                return $times;
            })
            ->concat($events)
            ->concat(self::busyTimes($profile, $from, $until, $preloaded === null ? null : $preloaded['busy']->filter(fn (CalendarBusyTime $busy) => $busy->starts_at->lessThan($until))))
            ->sortBy(fn (array $time) => $time['start']->getTimestamp())
            ->values();
    }

    /**
     * "Blocca gli orari occupati": the times busy on Google, with the break
     * after them like a session (the one before is in freeMinutes).
     *
     * @param  EloquentCollection<int, CalendarBusyTime>|null  $preloaded  the ones of these days, from daysForMany()
     * @return Collection<int, array{start: CarbonImmutable, blockedUntil: CarbonImmutable, external: true}>
     */
    private static function busyTimes(TrainerProfile $profile, CarbonImmutable $from, CarbonImmutable $until, ?EloquentCollection $preloaded = null): Collection
    {
        $busy = $preloaded ?? CalendarBusyTime::query()
            ->whereHas('connection', fn ($connection) => $connection
                ->where('trainer_profile_id', $profile->id)
                ->whereNotNull('reads_busy_at'))
            ->where('ends_at', '>', $from->startOfDay())
            ->where('starts_at', '<', $until)
            ->get(['starts_at', 'ends_at']);

        return $busy->map(fn (CalendarBusyTime $busy) => self::busyTime($busy, $profile->break_minutes));
    }

    /**
     * @return array{start: CarbonImmutable, blockedUntil: CarbonImmutable, external: true}
     */
    private static function busyTime(CalendarBusyTime $busy, int $breakMinutes): array
    {
        return [
            'start' => $busy->starts_at->setTimezone(self::TIMEZONE),
            'blockedUntil' => $busy->ends_at->setTimezone(self::TIMEZONE)->addMinutes($breakMinutes),
            'external' => true,
        ];
    }

    /** Minimum notice ("Preavviso minimo") and the end of a pause. */
    private static function earliestStart(TrainerProfile $profile, CarbonImmutable $now): CarbonImmutable
    {
        $earliest = $now->addHours($profile->notice_hours);
        $pausedUntil = $profile->paused_until?->toImmutable()->setTimezone(self::TIMEZONE);

        return $pausedUntil !== null && $pausedUntil->greaterThan($earliest) ? $pausedUntil : $earliest;
    }
}
