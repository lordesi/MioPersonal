<?php

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * Makes the sessions of a "sedute fisse" rule: real, confirmed bookings, a
 * few weeks ahead (and never beyond the days the client could book). It can
 * run again and again: a date that already has its session, even one that
 * was cancelled, is left alone, so a session cancelled by hand never comes
 * back. A date that is taken or closed is skipped and tried again the next
 * time (it may free up).
 *
 * Every date goes through the same check as a normal booking
 * (TrainerSlots::isFree), inside the same lock on the trainer.
 */
class GenerateSeries
{
    /** How far ahead the sessions are made. */
    public const WEEKS_AHEAD = 8;

    /** PostgreSQL error code of an exclusion constraint (`bookings_no_overlap`). */
    private const EXCLUSION_VIOLATION = '23P01';

    /**
     * @return array{created: int, skipped: list<string>} the dates (Y-m-d) skipped
     */
    public function handle(BookingSeries $series): array
    {
        $result = ['created' => 0, 'skipped' => []];

        if (! $series->isActive()) {
            return $result;
        }

        $profile = $series->trainerProfile;
        $client = $series->client;
        $now = CarbonImmutable::now(TrainerSlots::TIMEZONE);
        $today = $now->startOfDay();

        // Over: the end date has passed.
        if ($series->ends_on !== null && $series->ends_on->toImmutable()->endOfDay()->lt($now)) {
            $this->end($series);

            return $result;
        }

        // Nothing is made for a paused trainer or a client leaving the site.
        if ($profile->paused_at !== null || ! $profile->ownerIsActive() || $client->suspended_at !== null || $client->deletion_scheduled_at !== null) {
            return $result;
        }

        $last = $today->addWeeks(self::WEEKS_AHEAD)->min($today->addDays($profile->booking_window_days - 1));

        if ($series->ends_on !== null) {
            $last = $last->min(CarbonImmutable::parse($series->ends_on->toDateString(), TrainerSlots::TIMEZONE));
        }

        $have = $series->bookings()->pluck('starts_at')
            ->map(fn ($start) => CarbonImmutable::parse($start)->setTimezone(TrainerSlots::TIMEZONE)->toDateString())
            ->flip();

        foreach ($this->dates($series, $today, $last) as $date) {
            if ($have->has($date)) {
                continue;
            }

            $outcome = $this->makeSession($series, $profile, $date);

            if ($outcome === 'used-up') {
                $this->end($series);

                break;
            }

            $outcome === 'created' ? $result['created']++ : $result['skipped'][] = $date;
        }

        if ($result['created'] > 0) {
            TrainerSlots::refresh($profile);
        }

        return $result;
    }

    /**
     * The days of the week of the rule, from today (or the first day) to `$last`.
     *
     * @return list<string> Y-m-d, Rome
     */
    private function dates(BookingSeries $series, CarbonImmutable $today, CarbonImmutable $last): array
    {
        $from = CarbonImmutable::parse($series->starts_on->toDateString(), TrainerSlots::TIMEZONE)->max($today);
        $date = $from->addDays(($series->weekday - $from->dayOfWeekIso + 7) % 7);
        $dates = [];

        while ($date->lte($last)) {
            $dates[] = $date->toDateString();
            $date = $date->addWeek();
        }

        return $dates;
    }

    /**
     * @return 'created'|'skipped'|'used-up'
     */
    private function makeSession(BookingSeries $series, TrainerProfile $profile, string $date): string
    {
        $start = CarbonImmutable::parse("{$date} {$series->start_time}", TrainerSlots::TIMEZONE)->utc();
        $end = $start->addMinutes($series->minutes);

        try {
            return DB::transaction(function () use ($series, $profile, $start, $end) {
                // One booking at a time for this trainer, as when a client books.
                TrainerProfile::whereKey($profile->id)->lockForUpdate()->first();

                $package = $series->client_package_id === null ? null : ClientPackage::find($series->client_package_id);

                // Counted inside the lock: the last session of the package is the last.
                if ($series->client_package_id !== null && ($package === null || $package->activeBookings()->count() >= $package->sessions_total)) {
                    return 'used-up';
                }

                // Requests not answered in time still hold their slot until they are marked.
                $profile->bookings()->overdue()->get()->each(fn (Booking $request) => $request->expire());

                if (! TrainerSlots::isFree($profile, $start, $series->minutes)) {
                    return 'skipped';
                }

                $booking = Booking::create([
                    'client_id' => $series->client_id,
                    'trainer_profile_id' => $profile->id,
                    'service_id' => $series->service_id,
                    'client_package_id' => $package?->id,
                    'booking_series_id' => $series->id,
                    'service_name' => $series->service_name,
                    'price_cents' => $package === null ? $series->price_cents : 0,
                    'place_label' => $series->place_label,
                    'starts_at' => $start,
                    'ends_at' => $end,
                    'blocked_until' => $end->addMinutes($profile->break_minutes),
                    'status' => BookingStatus::Confirmed,
                    'confirmed_at' => now(),
                ]);

                // The trainer made it: confirmed at once, with no email for each session.
                $booking->record('confirmed', $profile->user);

                if ($package !== null) {
                    ClientPackage::whereKey($package->id)->whereNull('bought_at')->update(['bought_at' => now()]);
                }

                return 'created';
            });
        } catch (QueryException $exception) {
            if ($exception->getCode() === self::EXCLUSION_VIOLATION) {
                return 'skipped';
            }

            throw $exception;
        }
    }

    private function end(BookingSeries $series): void
    {
        $series->forceFill(['status' => BookingSeries::ENDED, 'ended_at' => now()])->save();
    }
}
