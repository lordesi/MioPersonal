<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoTrainerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainerProfileTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Disciplines and cities come from the catalog, the 9 approved trainers and
     * the 5 waiting for the team from the demo seeder (rolled back after each test).
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([CatalogSeeder::class, DemoTrainerSeeder::class]);
    }

    public function test_trainer_profile_renders_with_its_data()
    {
        $milano = City::where('slug', 'milano')->firstOrFail();

        $this->get(route('trainers.show', 'giulia-rossi'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/profile')
                ->has('trainer', fn (Assert $trainer) => $trainer
                    ->where('name', 'Giulia Rossi')
                    ->where('city', ['slug' => 'milano', 'name' => 'Milano'])
                    ->whereType('cities', 'array')
                    // The map is centered on the city, not on the trainer's address.
                    ->where('areaCenter', fn ($center) => $center->all() === ['lat' => $milano->lat, 'lng' => $milano->lng])
                    // The first session on top, then "Seduta singola" with a price for each duration, and its online prices.
                    ->where('services.0.name', 'Prima seduta')
                    ->where('services.1.name', 'Seduta singola')
                    ->where('services.1.durationLabel', 'da 1 ora a 2 ore')
                    ->where('services.1.priceCents', 4500)
                    ->where('services.1.options', fn ($options) => $options->pluck('priceCents', 'minutes')->all() === [60 => 4500, 90 => 6000, 120 => 8000])
                    ->where('services.2.name', 'Seduta singola (online)')
                    ->where('services.3.durationLabel', '10 × 1 ora')
                    ->has('availability', 21)
                    ->etc()
                )
            );
    }

    public function test_availability_start_times_are_utc_iso_strings()
    {
        $this->get(route('trainers.show', 'giulia-rossi'))
            ->assertInertia(function (Assert $page) {
                $days = $page->toArray()['props']['trainer']['availability'];
                $slot = collect($days)->pluck('slots')->flatten(1)->first();

                $this->assertNotNull($slot);
                $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $slot['start']);
                // The demo trainers offer 1 hour, 1 hour and a half and 2 hours.
                $this->assertContains($slot['maxMinutes'], [60, 90, 120]);
            });
    }

    public function test_an_online_only_trainer_has_similar_trainers_who_train_online()
    {
        $sara = TrainerProfile::where('slug', 'sara-colombo')->firstOrFail();
        $this->assertNull($sara->city_id);

        $this->get(route('trainers.show', 'sara-colombo'))
            ->assertInertia(function (Assert $page) use ($sara) {
                $similar = $page->toArray()['props']['trainer']['similarTrainers'];

                $this->assertNotEmpty($similar);

                foreach ($similar as $item) {
                    $other = TrainerProfile::where('slug', basename($item['href']))->firstOrFail();

                    $this->assertTrue($other->trains_online);
                    $this->assertNotEmpty(array_intersect($other->disciplines->modelKeys(), $sara->disciplines->modelKeys()));
                }
            });
    }

    public function test_profile_shows_the_latest_reviews_and_how_many_for_each_star()
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $review = fn (int $stars, int $daysAgo) => Review::factory()->for($profile)->rating($stars)->create(['created_at' => now()->subDays($daysAgo)]);

        $newest = $review(5, 1);
        $second = $review(4, 2);
        $third = $review(5, 3);
        $oldest = $review(3, 10);
        // Hidden by the team: neither in the list nor in the bars.
        Review::factory()->for($profile)->rating(1)->hidden()->create();

        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.reviews', fn ($reviews) => $reviews->pluck('id')->all() === [$newest->id, $second->id, $third->id])
                ->where('trainer.ratingDistribution', [
                    ['stars' => 5, 'count' => 2],
                    ['stars' => 4, 'count' => 1],
                    ['stars' => 3, 'count' => 1],
                    ['stars' => 2, 'count' => 0],
                    ['stars' => 1, 'count' => 0],
                ])
                // All of them only when "Mostra tutte le recensioni" asks.
                ->missing('allReviews')
                ->reloadOnly('allReviews', fn (Assert $reload) => $reload
                    ->where('allReviews', fn ($reviews) => $reviews->pluck('id')->all() === [$newest->id, $second->id, $third->id, $oldest->id])
                )
            );
    }

    public function test_reviews_show_a_short_name_or_stay_anonymous()
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create(['first_name' => 'Anna', 'last_name' => 'Bianchi']);
        Review::factory()->for($profile)->create(['client_id' => $client->id, 'created_at' => now()->subDay()]);
        // The client deleted the account.
        Review::factory()->for($profile)->create(['client_id' => null, 'created_at' => now()->subDays(2)]);

        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.reviews.0.authorName', 'Anna B.')
                ->where('trainer.reviews.1.authorName', 'Utente anonimo')
            );
    }

    public function test_the_average_counts_only_the_reviews_not_hidden()
    {
        $profile = TrainerProfile::factory()->approved()->create();
        Review::factory()->for($profile)->rating(5)->create();
        Review::factory()->for($profile)->rating(4)->create();
        Review::factory()->for($profile)->rating(1)->hidden()->create();

        $profile->refreshRating();

        $this->assertSame(2, $profile->rating_count);
        $this->assertSame(9, $profile->rating_sum);
        $this->assertSame(4.5, $profile->rating());
    }

    public function test_demo_trainers_have_reviews_with_the_average_of_the_design()
    {
        $giulia = TrainerProfile::where('slug', 'giulia-rossi')->firstOrFail();

        $this->assertSame(23, $giulia->reviews()->count());
        $this->assertSame(4.9, $giulia->rating());
    }

    public function test_unknown_trainer_returns_not_found()
    {
        $this->get(route('trainers.show', 'nessuno'))->assertNotFound();
    }

    public function test_home_cards_link_to_trainer_profiles()
    {
        // Sara Colombo has the best average (5.0).
        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('featuredTrainers.0.href', route('trainers.show', 'sara-colombo', false))
            );
    }
}
