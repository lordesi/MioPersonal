<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Free slots from the weekly hours (Rome time), notice, pause and bookings. */
class TrainerSlotsTest extends TestCase
{
    use RefreshDatabase;

    /** @param  list<array{int, string, string}>  $ranges  weekday, from, to */
    private function profile(array $ranges, array $attributes = []): TrainerProfile
    {
        $profile = TrainerProfile::factory()->approved()->create(['notice_hours' => 2, ...$attributes]);

        foreach ($ranges as [$weekday, $from, $to]) {
            $profile->workingHours()->create(['weekday' => $weekday, 'starts_at' => $from, 'ends_at' => $to]);
        }

        // refresh(): the defaults of the table (e.g. booking_window_days = 60).
        return $profile->refresh()->load('workingHours');
    }

    public function test_slots_follow_the_hours_and_the_notice()
    {
        // Monday 12 October 2026, 17:30 in Rome.
        $now = CarbonImmutable::parse('2026-10-12 17:30', 'Europe/Rome');
        $profile = $this->profile([[1, '18:00', '21:00'], [2, '07:00', '09:00']]);

        $days = TrainerSlots::days($profile, 2, $now);

        // 18:00 and 19:00 are less than 2 hours away; 20:00 is the last start (ends at 21).
        $this->assertSame('2026-10-12', $days[0]['date']);
        $this->assertSame([['start' => '2026-10-12T18:00:00Z', 'maxMinutes' => 60]], $days[0]['slots']);
        // Tuesday 7 and 8 (Rome, summer time = UTC+2): at 7 two hours fit (the factory offers 1 and 2 hours).
        $this->assertSame([
            ['start' => '2026-10-13T05:00:00Z', 'maxMinutes' => 120],
            ['start' => '2026-10-13T06:00:00Z', 'maxMinutes' => 60],
        ], $days[1]['slots']);

        $this->assertSame('2026-10-12T18:00:00Z', TrainerSlots::next($profile, $now)?->utc()->format('Y-m-d\TH:i:s\Z'));
    }

    public function test_the_same_hour_after_the_clocks_change()
    {
        // Sunday 25 October 2026 the clocks go back: 18:00 in Rome is 17:00 UTC from then on.
        $now = CarbonImmutable::parse('2026-10-24 08:00', 'Europe/Rome');
        $profile = $this->profile([[6, '18:00', '19:00'], [1, '18:00', '19:00']]);

        $days = TrainerSlots::days($profile, 3, $now);

        $this->assertSame('2026-10-24T16:00:00Z', $days[0]['slots'][0]['start']);
        $this->assertSame([], $days[1]['slots']);
        $this->assertSame('2026-10-26T17:00:00Z', $days[2]['slots'][0]['start']);
    }

    public function test_half_hours_and_the_longest_duration()
    {
        $now = CarbonImmutable::parse('2026-10-12 08:00', 'Europe/Rome');
        // 30 minutes and 1 hour and a half; Monday 18–20, Tuesday 18–19.
        $profile = $this->profile([[1, '18:00', '20:00'], [2, '18:00', '19:00']], ['session_minutes' => [30, 90]]);

        $days = TrainerSlots::days($profile, 2, $now);

        // At 18:00 two hours are free, but the longest session is 90 minutes; at 19:00 only 30 fits.
        $this->assertSame([90, 60], array_column($days[0]['slots'], 'maxMinutes'));
        $this->assertSame([60], array_column($days[1]['slots'], 'maxMinutes'));
    }

    public function test_a_start_without_room_for_the_shortest_session_is_not_a_slot()
    {
        $now = CarbonImmutable::parse('2026-10-12 08:00', 'Europe/Rome');
        $profile = $this->profile([[1, '18:00', '19:00'], [1, '20:00', '22:00']], ['session_minutes' => [90, 180]]);

        $days = TrainerSlots::days($profile, 1, $now);

        // 18:00 has one free hour: no 90-minute session fits. 20:00 has two.
        $this->assertSame([['start' => '2026-10-12T18:00:00Z', 'maxMinutes' => 120]], $days[0]['slots']);
    }

    public function test_a_pause_and_two_hour_sessions_only()
    {
        $now = CarbonImmutable::parse('2026-10-12 08:00', 'Europe/Rome');
        $profile = $this->profile([[1, '10:00', '13:00'], [2, '10:00', '13:00']], [
            'session_minutes' => [120],
            // Dates are saved in UTC.
            'paused_until' => CarbonImmutable::parse('2026-10-13 00:00', 'Europe/Rome')->utc(),
        ]);

        $days = TrainerSlots::days($profile, 2, $now);

        // Monday is paused; on Tuesday 12:00 can't start a 2-hour session (ends at 13).
        $this->assertSame([], $days[0]['slots']);
        $this->assertSame(['2026-10-13T08:00:00Z', '2026-10-13T09:00:00Z'], array_column($days[1]['slots'], 'start'));
    }

    public function test_a_booking_takes_its_hours()
    {
        $now = CarbonImmutable::parse('2026-10-12 08:00', 'Europe/Rome');
        $profile = $this->profile([[1, '18:00', '21:00']], ['break_minutes' => 0]);
        Booking::factory()->for($profile)->confirmed()->at(CarbonImmutable::parse('2026-10-12 19:00', 'Europe/Rome'))->create();

        $days = TrainerSlots::days($profile, 1, $now);

        // 19:00 is taken; 18:00 must end when the booking starts.
        $this->assertSame([
            ['start' => '2026-10-12T16:00:00Z', 'maxMinutes' => 60],
            ['start' => '2026-10-12T18:00:00Z', 'maxMinutes' => 60],
        ], $days[0]['slots']);
    }

    public function test_the_break_keeps_the_hours_around_a_booking_free()
    {
        $now = CarbonImmutable::parse('2026-10-12 08:00', 'Europe/Rome');
        $profile = $this->profile([[1, '18:00', '21:00']], ['break_minutes' => 15, 'session_minutes' => [30, 60]]);
        // 19:00–20:00, then 15 minutes of break: blocked until 20:15.
        Booking::factory()->for($profile)->confirmed()->create([
            'starts_at' => CarbonImmutable::parse('2026-10-12 19:00', 'Europe/Rome')->utc(),
            'ends_at' => CarbonImmutable::parse('2026-10-12 20:00', 'Europe/Rome')->utc(),
            'blocked_until' => CarbonImmutable::parse('2026-10-12 20:15', 'Europe/Rome')->utc(),
        ]);

        $days = TrainerSlots::days($profile, 1, $now);

        // At 18:00 only 45 minutes are left before the break: a 30-minute session fits.
        // 20:00 is still blocked by the break.
        $this->assertSame([['start' => '2026-10-12T16:00:00Z', 'maxMinutes' => 45]], $days[0]['slots']);
    }

    public function test_a_full_day_and_expired_requests()
    {
        $now = CarbonImmutable::parse('2026-10-12 08:00', 'Europe/Rome');
        $profile = $this->profile([[1, '18:00', '21:00'], [2, '18:00', '21:00']], ['max_sessions_per_day' => 1, 'break_minutes' => 0]);
        Booking::factory()->for($profile)->confirmed()->at(CarbonImmutable::parse('2026-10-12 20:00', 'Europe/Rome'))->create();
        // Not answered in time: the slot is free again, even before bookings:expire runs.
        Booking::factory()->for($profile)->expired()->at(CarbonImmutable::parse('2026-10-13 18:00', 'Europe/Rome'))->create();

        $days = TrainerSlots::days($profile, 2, $now);

        // "Massimo sedute al giorno": 1, already booked on Monday.
        $this->assertSame([], $days[0]['slots']);
        $this->assertSame('2026-10-13T16:00:00Z', $days[1]['slots'][0]['start']);
    }
}
