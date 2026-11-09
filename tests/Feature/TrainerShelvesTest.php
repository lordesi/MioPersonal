<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\City;
use App\Models\TrainerProfile;
use App\Support\TrainerShelves;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** The home shelves "In tendenza", "Liberi oggi" and "Nuovi": hidden when too few trainers. */
class TrainerShelvesTest extends TestCase
{
    use RefreshDatabase;

    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();

        $this->now = CarbonImmutable::parse('2026-11-20 12:00', 'Europe/Rome');
        $this->travelTo($this->now);
    }

    private function trainer(array $attributes = []): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->bookable()
            ->inCity(City::factory()->create())
            ->create(['approved_at' => $this->now->subMonths(6), ...$attributes]);
    }

    private function visit(TrainerProfile $trainer, int $views, ?CarbonImmutable $day = null): void
    {
        DB::table('trainer_profile_views')->insert([
            'trainer_profile_id' => $trainer->id,
            'day' => ($day ?? $this->now)->toDateString(),
            'views' => $views,
        ]);
    }

    public function test_trending_ranks_by_visits_and_requests_of_the_last_days()
    {
        $quiet = $this->trainer();
        $visited = $this->trainer();
        $requested = $this->trainer();
        $old = $this->trainer();

        $this->visit($visited, 10);
        $this->visit($quiet, 1);
        $this->visit($old, 500, $this->now->subDays(40));
        Booking::factory()->count(3)->create(['trainer_profile_id' => $requested->id]);

        $this->assertSame(
            [$requested->id, $visited->id, $quiet->id],
            TrainerShelves::trendingIds($this->now),
        );
    }

    public function test_a_shelf_with_too_few_trainers_is_not_shown()
    {
        foreach (range(1, TrainerShelves::MIN_TRAINERS - 1) as $ignored) {
            $this->visit($this->trainer(), 5);
        }

        $this->assertSame([], TrainerShelves::all());

        $this->visit($this->trainer(), 5);

        $this->assertSame(['trending'], array_column(TrainerShelves::all(), 'key'));
    }

    public function test_available_today_needs_a_free_slot_in_the_next_24_hours()
    {
        $soon = $this->trainer(['next_free_slot_at' => $this->now->addHours(3)]);
        $tomorrowEvening = $this->trainer(['next_free_slot_at' => $this->now->addHours(30)]);
        $none = $this->trainer(['next_free_slot_at' => null]);

        $this->assertSame([$soon->id], TrainerShelves::availableTodayIds($this->now));
        $this->assertNotContains($tomorrowEvening->id, TrainerShelves::availableTodayIds($this->now));
        $this->assertNotContains($none->id, TrainerShelves::availableTodayIds($this->now));
    }

    public function test_new_trainers_are_the_ones_approved_in_the_last_month()
    {
        $new = $this->trainer(['approved_at' => $this->now->subDays(5)]);
        $this->trainer();

        $this->assertSame([$new->id], TrainerShelves::newIds($this->now));
    }

    public function test_hidden_or_paused_profiles_never_show()
    {
        $paused = $this->trainer(['paused_at' => $this->now]);
        $this->visit($paused, 99);

        $this->assertNotContains($paused->id, TrainerShelves::trendingIds($this->now));
    }

    public function test_the_home_carries_the_shelves_only_when_they_are_full()
    {
        $this->seed(CatalogSeeder::class);

        $this->get(route('home'))->assertOk()->assertInertia(fn ($page) => $page->where('trainerShelves', []));

        foreach (range(1, TrainerShelves::MIN_TRAINERS) as $ignored) {
            $this->visit($this->trainer(), 5);
        }

        $this->get(route('home'))->assertOk()->assertInertia(fn ($page) => $page
            ->has('trainerShelves', 1)
            ->where('trainerShelves.0.key', 'trending')
            ->has('trainerShelves.0.trainers', TrainerShelves::MIN_TRAINERS));
    }
}
