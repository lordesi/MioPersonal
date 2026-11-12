<?php

namespace Tests\Feature;

use App\Models\GymProfile;
use App\Models\User;
use App\Support\GymShelves;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Palestre in tendenza" on the home, or "in evidenza" when too few gyms. */
class GymShelvesTest extends TestCase
{
    use RefreshDatabase;

    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        $this->now = CarbonImmutable::parse('2026-11-20 12:00', 'Europe/Rome');
        $this->travelTo($this->now);
    }

    /** A published gym with a cover, as on the home. */
    private function gym(array $attributes = []): GymProfile
    {
        $gym = GymProfile::factory()->approved()->create($attributes);
        $gym->photos()->create(['path' => "gyms/{$gym->id}/cover.jpg", 'is_cover' => true]);

        return $gym;
    }

    private function visit(GymProfile $gym, int $views, ?CarbonImmutable $day = null): void
    {
        DB::table('gym_profile_views')->insert([
            'gym_profile_id' => $gym->id,
            'day' => ($day ?? $this->now)->toDateString(),
            'views' => $views,
        ]);
    }

    private function save(GymProfile $gym, int $times, ?CarbonImmutable $when = null): void
    {
        foreach (range(1, $times) as $ignored) {
            User::factory()->create()->favoriteGyms()->attach($gym, ['created_at' => $when ?? $this->now]);
        }
    }

    public function test_trending_ranks_by_visits_and_hearts_of_the_last_days()
    {
        $quiet = $this->gym();
        $visited = $this->gym();
        $saved = $this->gym();
        $old = $this->gym();

        $this->visit($quiet, 1);
        $this->visit($visited, 8);
        $this->save($saved, 2);
        $this->visit($old, 500, $this->now->subDays(40));
        $this->save($old, 5, $this->now->subDays(40));

        $this->assertSame([$saved->id, $visited->id, $quiet->id], GymShelves::trendingIds($this->now));
    }

    public function test_gyms_without_a_cover_or_hidden_never_show()
    {
        $noCover = GymProfile::factory()->approved()->create();
        $hidden = $this->gym(['visible_in_search' => false]);
        $this->visit($noCover, 50);
        $this->visit($hidden, 50);

        $this->assertSame([], GymShelves::trendingIds($this->now));
    }

    public function test_the_home_shows_the_trending_gyms_or_else_the_featured_ones()
    {
        $gyms = [$this->gym(), $this->gym(), $this->gym()];
        $this->visit($gyms[0], 5);
        $this->visit($gyms[1], 3);

        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->where('gyms.key', 'featured')
            ->where('gyms.title', 'Palestre in evidenza')
            ->has('gyms.items', 3));

        $this->visit($gyms[2], 9);

        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->where('gyms.key', 'trending')
            ->where('gyms.title', 'Palestre in tendenza')
            ->where('gyms.items.0.slug', $gyms[2]->slug)
            ->where('gyms.items.1.slug', $gyms[0]->slug)
            ->has('gyms.items', GymShelves::MIN_GYMS));
    }
}
