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

/** "Trainer in tendenza" on the home, or "in evidenza" when too few trainers. */
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

    public function test_too_few_trending_trainers_give_no_shelf()
    {
        foreach (range(1, TrainerShelves::MIN_TRAINERS - 1) as $ignored) {
            $this->visit($this->trainer(), 5);
        }

        $this->assertNull(TrainerShelves::trending());

        $this->visit($this->trainer(), 5);

        $this->assertCount(TrainerShelves::MIN_TRAINERS, TrainerShelves::trending() ?? []);
    }

    public function test_hidden_or_paused_profiles_never_show()
    {
        $paused = $this->trainer(['paused_at' => $this->now]);
        $this->visit($paused, 99);

        $this->assertNotContains($paused->id, TrainerShelves::trendingIds($this->now));
    }

    public function test_the_home_shows_the_trending_trainers_or_else_the_featured_ones()
    {
        $this->seed(CatalogSeeder::class);
        $this->trainer();

        $this->get(route('home'))->assertOk()->assertInertia(fn ($page) => $page
            ->where('trainers.key', 'featured')
            ->where('trainers.title', 'Trainer in evidenza')
            ->has('trainers.items', 1)
            // "Nuovi su MioPersonal" and "Cosa vuoi allenare?" are gone.
            ->missing('trainerShelves')
            ->missing('popularDisciplines'));

        foreach (range(1, TrainerShelves::MIN_TRAINERS) as $ignored) {
            $this->visit($this->trainer(), 5);
        }

        $this->get(route('home'))->assertOk()->assertInertia(fn ($page) => $page
            ->where('trainers.key', 'trending')
            ->where('trainers.title', 'Trainer in tendenza')
            ->has('trainers.items', TrainerShelves::MIN_TRAINERS));
    }
}
