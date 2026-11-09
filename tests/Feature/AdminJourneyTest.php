<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\City;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\AdminStats;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** "Admin · Statistiche · Il percorso": sessions each week, the second booking, the steps in between. */
class AdminJourneyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Friday 20 November 2026: the week started on Monday the 16th.
        $this->travelTo(CarbonImmutable::parse('2026-11-20 12:00', 'Europe/Rome'));
    }

    /** @return array<string, mixed> */
    private function journey(): array
    {
        return (new AdminStats)->all()['journey'];
    }

    private function trainer(?string $city = 'Milano'): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->bookable()
            ->when($city !== null, fn ($factory) => $factory->inCity(City::factory()->create(['name' => $city])))
            ->create();
    }

    /** A done session that ended `$daysAgo` days ago (at 10:00 Rome). */
    private function done(TrainerProfile $trainer, User $client, int $daysAgo, array $attributes = []): Booking
    {
        $start = CarbonImmutable::now('Europe/Rome')->subDays($daysAgo)->setTime(9, 0);

        return Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($start)
            ->create(['created_at' => $start->subDays(2), ...$attributes]);
    }

    public function test_sessions_are_counted_by_week_with_the_ones_from_a_rule_apart()
    {
        $trainer = $this->trainer();
        $series = new BookingSeries;
        $client = User::factory()->create();

        // This week (Monday the 16th): 2 sessions, one of them from a rule.
        $this->done($trainer, $client, 2);
        $ruleBooking = $this->done($trainer, $client, 3);
        $series->forceFill(['trainer_profile_id' => $trainer->id, 'client_id' => $client->id, 'service_name' => 'x', 'price_cents' => 1, 'minutes' => 60, 'weekday' => 1, 'start_time' => '09:00', 'starts_on' => '2026-11-01'])->save();
        $ruleBooking->forceFill(['booking_series_id' => $series->id])->save();
        // Last week.
        $this->done($trainer, $client, 8);
        // Marked as missed: not a session done. And one still to come.
        $this->done($trainer, $client, 4, ['no_show_at' => now()]);
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at(CarbonImmutable::now('Europe/Rome')->addDay()->setTime(9, 0))->create();

        $weeks = $this->journey()['weeks'];

        $this->assertCount(12, $weeks);
        $this->assertSame(['week' => '2026-11-16', 'total' => 2, 'fromSeries' => 1], end($weeks));
        $this->assertSame(['week' => '2026-11-09', 'total' => 1, 'fromSeries' => 0], $weeks[10]);
    }

    public function test_the_last_weeks_are_split_by_the_city_of_the_trainer()
    {
        $milano = $this->trainer('Milano');
        $online = $this->trainer(null);
        $client = User::factory()->create();

        $this->done($milano, $client, 2);
        $this->done($milano, $client, 9);
        $this->done($online, $client, 2);

        $cities = $this->journey()['cities'];

        $this->assertSame(['city' => 'Milano', 'weeks' => [0, 0, 1, 1], 'total' => 2], $cities[0]);
        $this->assertSame(['city' => 'Solo online', 'weeks' => [0, 0, 0, 1], 'total' => 1], $cities[1]);
    }

    public function test_the_steps_go_from_the_request_to_the_review_without_the_sessions_of_a_rule()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create();

        // Asked and answered, done, reviewed.
        $reviewed = $this->done($trainer, $client, 5);
        Review::factory()->create(['booking_id' => $reviewed->id, 'trainer_profile_id' => $trainer->id, 'client_id' => $client->id]);
        // Asked, confirmed, done, no review.
        $this->done($trainer, $client, 6);
        // Asked, still waiting.
        Booking::factory()->for($trainer)->create();
        // Made by a rule: confirmed at once, not a request.
        $this->done($trainer, $client, 7, ['booking_series_id' => $this->series($trainer, $client)->id]);

        $steps = collect($this->journey()['steps'])->pluck('count', 'label');

        $this->assertSame(3, $steps['Richieste di prenotazione']);
        $this->assertSame(2, $steps['Confermate']);
        $this->assertSame(2, $steps['Sedute svolte']);
        $this->assertSame(1, $steps['Con una recensione']);
    }

    private function series(TrainerProfile $trainer, User $client): BookingSeries
    {
        $series = new BookingSeries;
        $series->forceFill(['trainer_profile_id' => $trainer->id, 'client_id' => $client->id, 'service_name' => 'x', 'price_cents' => 1, 'minutes' => 60, 'weekday' => 1, 'start_time' => '09:00', 'starts_on' => '2026-10-01'])->save();

        return $series;
    }

    public function test_who_books_again_within_30_days_of_the_first_session()
    {
        $trainer = $this->trainer();

        // Came back: second session booked 10 days after the first one.
        $back = User::factory()->create();
        $this->done($trainer, $back, 60);
        $this->done($trainer, $back, 40, ['created_at' => now()->subDays(50)]);

        // Never came back.
        $gone = User::factory()->create();
        $this->done($trainer, $gone, 60);

        // Booked again, but only after 45 days: too late for this measure.
        $late = User::factory()->create();
        $this->done($trainer, $late, 90);
        $this->done($trainer, $late, 20, ['created_at' => now()->subDays(40)]);

        // Too recent: 30 days have not passed yet.
        $recent = User::factory()->create();
        $this->done($trainer, $recent, 10);

        // A rule: counted apart.
        $regular = User::factory()->create();
        $this->done($trainer, $regular, 60, ['booking_series_id' => $this->series($trainer, $regular)->id]);

        $this->assertSame(['eligible' => 3, 'rebooked' => 1, 'rate' => 0.333, 'withSeries' => 1], $this->journey()['rebooking']);
    }

    public function test_the_stats_page_carries_the_journey()
    {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.stats'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('stats.journey.weeks', 12)
                ->has('stats.journey.steps', 6)
                ->has('stats.journey.rebooking')
                ->where('stats.journey.seriesActive', 0));
    }

    public function test_without_data_the_numbers_are_empty_and_not_wrong()
    {
        $journey = $this->journey();

        $this->assertSame(['eligible' => 0, 'rebooked' => 0, 'rate' => null, 'withSeries' => 0], $journey['rebooking']);
        $this->assertNull($journey['noShowRate']);
        $this->assertNull($journey['seriesShare']);
        $this->assertSame(0, $journey['seriesActive']);
        $this->assertSame([], $journey['cities']);
    }

    public function test_the_no_show_rate_and_the_share_of_rule_sessions()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create();

        $this->done($trainer, $client, 3);
        $this->done($trainer, $client, 4);
        $this->done($trainer, $client, 5, ['booking_series_id' => $this->series($trainer, $client)->id]);
        $this->done($trainer, $client, 6, ['no_show_at' => now()]);

        $journey = $this->journey();

        $this->assertSame(0.25, $journey['noShowRate']);
        // 3 done, 1 of them from a rule.
        $this->assertSame(0.333, $journey['seriesShare']);
        $this->assertSame(1, $journey['seriesActive']);
    }
}
