<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ClientProgress;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The numbers of "Panoramica": ISO weeks in Rome time, weeks in a row. */
class ClientProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_late_sunday_session_belongs_to_the_rome_week()
    {
        // Monday 00:30 in Rome is still Sunday in UTC: it belongs to the new week.
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        Booking::factory()->for($client, 'client')->for($trainer)->confirmed()
            ->at(CarbonImmutable::parse('2026-11-09 00:30', 'Europe/Rome'))->create();
        Booking::factory()->for($client, 'client')->for($trainer)->confirmed()
            ->at(CarbonImmutable::parse('2026-11-08 21:00', 'Europe/Rome'))->create();

        $progress = ClientProgress::for($client, CarbonImmutable::parse('2026-11-12 10:00', 'Europe/Rome'));

        $this->assertSame(1, $progress->thisWeek());
        $this->assertSame(['start' => '2026-11-02', 'count' => 1], $progress->weeks()[10]);
        $this->assertSame(['start' => '2026-11-09', 'count' => 1], $progress->weeks()[11]);
    }

    public function test_the_current_week_does_not_break_the_row_until_it_is_over()
    {
        $client = User::factory()->create();
        $client->clientPreference()->create(['sessions_per_week' => 2]);
        // A week with the goal reached, one short, one reached, then the current one empty.
        foreach (['2026-10-19', '2026-10-21', '2026-10-27', '2026-11-02', '2026-11-04'] as $day) {
            $client->activityLogs()->create(['done_on' => $day, 'kind' => 'strength']);
        }

        $monday = ClientProgress::for($client->refresh(), CarbonImmutable::parse('2026-11-09 08:00', 'Europe/Rome'));
        $this->assertSame(1, $monday->streak());
        $this->assertSame(0, $monday->thisWeek());

        // The week of 26 October had one training out of two; with a second one the row goes back to 19 October.
        $client->activityLogs()->create(['done_on' => '2026-10-28', 'kind' => 'strength']);
        $this->assertSame(3, ClientProgress::for($client, CarbonImmutable::parse('2026-11-09 08:00', 'Europe/Rome'))->streak());

        // Reaching the goal this week adds it to the row.
        $client->activityLogs()->create(['done_on' => '2026-11-09', 'kind' => 'strength']);
        $client->activityLogs()->create(['done_on' => '2026-11-10', 'kind' => 'strength']);
        $this->assertSame(4, ClientProgress::for($client, CarbonImmutable::parse('2026-11-10 20:00', 'Europe/Rome'))->streak());
    }

    public function test_without_a_goal_one_training_a_week_keeps_the_row()
    {
        $client = User::factory()->create();
        $client->activityLogs()->create(['done_on' => '2026-11-03', 'kind' => 'walking']);
        $client->activityLogs()->create(['done_on' => '2026-11-11', 'kind' => 'walking']);
        // Tomorrow's can't be there, but it would never count.
        $client->activityLogs()->create(['done_on' => '2026-11-13', 'kind' => 'walking']);

        $progress = ClientProgress::for($client, CarbonImmutable::parse('2026-11-12 10:00', 'Europe/Rome'));

        $this->assertSame(2, $progress->streak());
        $this->assertSame(2, $progress->total());
        $this->assertSame(2, $progress->thisMonth());
    }
}
