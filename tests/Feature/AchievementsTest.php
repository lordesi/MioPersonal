<?php

namespace Tests\Feature;

use App\Enums\Achievement;
use App\Models\Booking;
use App\Models\ClientAchievement;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\Achievements;
use App\Support\ClientProgress;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** "Traguardi": reached once, shown once, shared with the trainer's link. */
class AchievementsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-11-12 10:00', 'Europe/Rome'));
    }

    public function test_the_first_session_is_reached_once()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()
            ->at(CarbonImmutable::parse('2026-11-10 18:00', 'Europe/Rome'))->create();

        $progress = ClientProgress::for($client);
        $this->assertSame([Achievement::FirstSession], Achievements::sync($client, $progress));

        $summary = Achievements::summary($client, $progress);
        $this->assertCount(1, $summary['earned']);
        $this->assertSame('first_session', $summary['earned'][0]['key']);
        $this->assertSame($trainer->user->name, $summary['earned'][0]['trainer']['name']);
        $link = $summary['earned'][0]['trainer']['link'];
        $this->assertTrue(str_contains($link, 'utm_medium=traguardo') && str_contains($link, $trainer->slug));
        // The closest next one: 1 discipline of 3 beats 1 week of 4 and 1 training of 10.
        $this->assertSame('disciplines_3', $summary['next']['key']);
        $this->assertSame(1, $summary['next']['current']);
        $this->assertSame(3, $summary['next']['target']);

        // Reached once: the second time nothing new.
        $this->assertSame([], Achievements::sync($client, ClientProgress::for($client)));
        $this->assertSame(1, ClientAchievement::count());
    }

    public function test_sync_is_idempotent()
    {
        $client = User::factory()->create();
        $client->activityLogs()->create(['done_on' => '2026-11-11', 'kind' => 'running']);
        $progress = ClientProgress::for($client);

        $this->assertSame([Achievement::FirstLog], Achievements::sync($client, $progress));
        $this->assertSame([], Achievements::sync($client, $progress));
        $this->assertSame(1, $client->achievements()->count());
    }

    public function test_logging_a_training_can_bring_one()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('client.activities.store'), ['done_on' => '2026-11-12', 'kind' => 'yoga_pilates'])
            ->assertSessionHasNoErrors();

        $this->assertTrue($client->achievements()->where('key', Achievement::FirstLog)->exists());
    }

    public function test_weeks_in_a_row_count_the_longest_row_ever()
    {
        $client = User::factory()->create();
        // Four weeks in a row in September, then a pause: the row is over, the milestone stays.
        foreach (['2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22'] as $day) {
            $client->activityLogs()->create(['done_on' => $day, 'kind' => 'walking']);
        }

        $progress = ClientProgress::for($client);
        $this->assertSame(0, $progress->streak());
        $this->assertSame(4, $progress->longestStreak());

        Achievements::sync($client, $progress);
        $this->assertTrue($client->achievements()->where('key', Achievement::Weeks4)->exists());
    }

    public function test_three_ways_of_training()
    {
        $client = User::factory()->create();

        foreach (['running', 'swimming'] as $kind) {
            $client->activityLogs()->create(['done_on' => '2026-11-10', 'kind' => $kind]);
        }
        Achievements::sync($client, ClientProgress::for($client));
        $this->assertFalse($client->achievements()->where('key', Achievement::Disciplines3)->exists());

        $client->activityLogs()->create(['done_on' => '2026-11-11', 'kind' => 'cycling']);
        Achievements::sync($client, ClientProgress::for($client));
        $this->assertTrue($client->achievements()->where('key', Achievement::Disciplines3)->exists());
    }

    public function test_a_hidden_trainer_is_not_named_on_the_image()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->create();
        $client->achievements()->create(['key' => Achievement::FirstSession, 'earned_at' => now(), 'trainer_profile_id' => $trainer->id]);

        $summary = Achievements::summary($client, ClientProgress::for($client));

        $this->assertNull($summary['earned'][0]['trainer']);
        $this->assertStringContainsString('utm_medium=traguardo', $summary['siteLink']);
    }
}
