<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Novità": the trainers and gyms that joined in the last 30 days. */
class NewsTest extends TestCase
{
    use RefreshDatabase;

    private City $milano;

    private City $roma;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        $this->milano = City::where('slug', 'milano')->firstOrFail();
        $this->roma = City::where('slug', 'roma')->firstOrFail();
    }

    private function trainer(City $city, int $daysAgo): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->inCity($city)->create(['approved_at' => now()->subDays($daysAgo)]);
    }

    private function gym(City $city, int $daysAgo): GymProfile
    {
        return GymProfile::factory()->approved()->inCity($city)->create(['approved_at' => now()->subDays($daysAgo)]);
    }

    public function test_the_page_lists_only_the_new_published_profiles_newest_first()
    {
        $older = $this->trainer($this->milano, 10);
        $newer = $this->trainer($this->milano, 2);
        $this->trainer($this->milano, 40);
        TrainerProfile::factory()->status(TrainerProfileStatus::Review)->inCity($this->milano)->create(['approved_at' => now()]);
        TrainerProfile::factory()->approved()->inCity($this->milano)->create(['visible_in_search' => false]);
        $gym = $this->gym($this->roma, 5);
        $this->gym($this->roma, 31);

        $this->get(route('news'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/news')
                ->where('city', null)
                ->where('trainers.0.slug', $newer->slug)
                ->where('trainers.1.slug', $older->slug)
                ->has('trainers', 2)
                ->has('gyms', 1)
                ->where('gyms.0.slug', $gym->slug)
                ->where('seo.index', true)
            );
    }

    public function test_a_city_shows_its_trainers_the_online_only_ones_and_its_gyms()
    {
        $here = $this->trainer($this->milano, 3);
        $this->trainer($this->roma, 3);
        $online = TrainerProfile::factory()->approved()->create();
        $gym = $this->gym($this->milano, 3);
        $this->gym($this->roma, 3);

        $this->get(route('news', $this->milano))
            ->assertInertia(fn (Assert $page) => $page
                ->where('city.slug', 'milano')
                ->has('trainers', 2)
                ->where('trainers', fn ($trainers) => collect($trainers)->pluck('slug')->sort()->values()->all() === collect([$here->slug, $online->slug])->sort()->values()->all())
                ->has('gyms', 1)
                ->where('gyms.0.slug', $gym->slug)
            );

        $this->get('/novita/atlantide')->assertNotFound();
    }

    public function test_the_previews_in_the_home_and_the_searches()
    {
        $this->trainer($this->milano, 1);
        $this->gym($this->milano, 1);

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->has('news.trainers', 1)->has('news.gyms', 1)->where('news.city', null));

        // Each search shows only its own kind, in its city.
        $this->get(route('trainers.search', $this->milano))
            ->assertInertia(fn (Assert $page) => $page->has('news.trainers', 1)->has('news.gyms', 0)->where('news.city.slug', 'milano'));
        $this->get(route('gyms.search', $this->roma))
            ->assertInertia(fn (Assert $page) => $page->has('news.gyms', 0)->has('news.trainers', 0));
        $this->get(route('gyms.search', $this->milano))
            ->assertInertia(fn (Assert $page) => $page->has('news.gyms', 1));
    }

    public function test_the_client_home_shows_the_news_of_the_client_city()
    {
        $this->trainer($this->milano, 1);
        $this->trainer($this->roma, 1);
        $client = User::factory()->create();
        $client->clientPreference()->create(['city_id' => $this->roma->id]);

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page->where('news.city.slug', 'roma')->has('news.trainers', 1));
    }

    public function test_the_sitemap_lists_the_news_page()
    {
        $this->trainer($this->milano, 1);

        $this->get(route('sitemap'))->assertOk()->assertSee(route('news'), false);
    }
}
