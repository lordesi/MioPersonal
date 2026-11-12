<?php

namespace Tests\Feature;

use App\Actions\Gym\GymLinks;
use App\Enums\GymAmenity;
use App\Enums\GymLinkSide;
use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The heart on the gyms, the "Palestre" tab of "Preferiti" and the gyms on the home. */
class GymFavoritesTest extends TestCase
{
    use RefreshDatabase;

    private City $milano;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        $this->milano = City::where('slug', 'milano')->firstOrFail();
    }

    private function gym(array $attributes = []): GymProfile
    {
        return GymProfile::factory()->approved()->inCity($this->milano)->create($attributes);
    }

    public function test_a_client_saves_and_removes_a_gym()
    {
        $client = User::factory()->create();
        $gym = $this->gym();

        $this->actingAs($client)->post(route('client.favorites.gyms.store', $gym->slug))->assertRedirect();
        // Saving twice does nothing.
        $this->post(route('client.favorites.gyms.store', $gym->slug))->assertRedirect();
        $this->assertSame([$gym->id], $client->favoriteGyms()->pluck('gym_profiles.id')->all());

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.favoritesCount', 1)
                ->where('auth.favoriteCounts', ['trainers' => 0, 'gyms' => 1])
            );

        $this->delete(route('client.favorites.gyms.destroy', $gym->slug))->assertRedirect();
        $this->delete(route('client.favorites.gyms.destroy', $gym->slug))->assertRedirect();
        $this->assertSame(0, $client->favoriteGyms()->count());
    }

    public function test_only_public_gyms_can_be_saved_and_only_by_clients()
    {
        $inReview = GymProfile::factory()->inCity($this->milano)->create();
        $suspended = $this->gym();
        $suspended->user->forceFill(['suspended_at' => now()])->save();

        $client = User::factory()->create();
        $this->actingAs($client)->post(route('client.favorites.gyms.store', $inReview->slug))->assertNotFound();
        $this->post(route('client.favorites.gyms.store', $suspended->slug))->assertNotFound();
        $this->post(route('client.favorites.gyms.store', 'nessuna'))->assertNotFound();

        $gym = $this->gym();
        $this->actingAs(User::factory()->trainer()->create())
            ->post(route('client.favorites.gyms.store', $gym->slug))
            ->assertRedirect();
        $this->actingAs(User::factory()->gym()->create())
            ->post(route('client.favorites.gyms.store', $gym->slug))
            ->assertRedirect();
        $this->assertDatabaseCount('gym_favorites', 0);

        auth()->logout();
        $this->post(route('client.favorites.gyms.store', $gym->slug))->assertRedirect(route('login'));
    }

    public function test_the_favorites_page_has_a_tab_for_the_gyms()
    {
        $client = User::factory()->create();
        $gym = $this->gym(['name' => 'FitLab']);
        $hidden = $this->gym();
        $client->favoriteGyms()->attach([$gym->id => ['created_at' => now()], $hidden->id => ['created_at' => now()]]);
        // Taken back for review: out of the page and of the count.
        $hidden->forceFill(['status' => TrainerProfileStatus::Review])->save();

        // No trainers saved: the gyms' tab opens.
        $this->actingAs($client)
            ->get(route('client.favorites'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/favorites')
                ->has('trainers', 0)
                ->has('gyms', 1)
                ->where('gyms.0.name', 'FitLab')
                ->where('gyms.0.favorite', true)
                ->where('tab', 'gyms')
                ->where('auth.favoritesCount', 1)
            );

        $trainer = TrainerProfile::factory()->approved()->create();
        $client->favoriteTrainers()->attach($trainer->id, ['created_at' => now()]);

        $this->get(route('client.favorites'))
            ->assertInertia(fn (Assert $page) => $page->where('tab', 'trainers')->where('auth.favoritesCount', 2));
        $this->get(route('client.favorites', ['tipo' => 'palestre']))
            ->assertInertia(fn (Assert $page) => $page->where('tab', 'gyms'));
    }

    public function test_the_heart_is_full_on_the_search_and_on_the_profile()
    {
        $client = User::factory()->create();
        $saved = $this->gym(['name' => 'FitLab']);
        $other = $this->gym(['name' => 'Power House']);
        $client->favoriteGyms()->attach($saved->id, ['created_at' => now()]);

        $this->actingAs($client)
            ->get(route('gyms.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('gyms', fn ($gyms) => collect($gyms)->pluck('favorite', 'name')->sortKeys()->all() === ['FitLab' => true, 'Power House' => false])
            );

        $this->get(route('gyms.search', ['city' => 'milano', 'preferiti' => '1']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 1)
                ->where('gyms.0.name', 'FitLab')
                ->where('filters.preferiti', '1')
            );

        $this->get(route('gyms.show', $saved->slug))
            ->assertInertia(fn (Assert $page) => $page->where('gym.favorite', true));
        $this->get(route('gyms.show', $other->slug))
            ->assertInertia(fn (Assert $page) => $page->where('gym.favorite', false));
    }

    public function test_the_trainers_on_a_gym_profile_have_the_heart()
    {
        $client = User::factory()->create();
        $gym = $this->gym();
        $trainer = TrainerProfile::factory()->approved()->create();
        Notification::fake();
        $links = app(GymLinks::class);
        $links->accept($links->request($trainer, $gym, notify: false), GymLinkSide::Gym);
        $client->favoriteTrainers()->attach($trainer->id, ['created_at' => now()]);

        $this->actingAs($client)
            ->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->has('gym.trainers', 1)
                ->where('gym.trainers.0.favorite', true)
            );
    }

    public function test_similar_gyms_are_in_the_same_city_with_services_in_common()
    {
        $gym = $this->gym(['amenities' => [GymAmenity::Weights->value, GymAmenity::Pool->value, GymAmenity::Sauna->value]]);
        $close = $this->gym(['name' => 'Molto simile', 'amenities' => [GymAmenity::Pool->value, GymAmenity::Sauna->value]]);
        $far = $this->gym(['name' => 'Poco simile', 'amenities' => [GymAmenity::Cardio->value]]);
        GymProfile::factory()->approved()->create(['name' => 'Altra città', 'amenities' => [GymAmenity::Pool->value, GymAmenity::Sauna->value]]);
        GymProfile::factory()->inCity($this->milano)->create(['name' => 'In revisione']);

        $this->get(route('gyms.show', $gym->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->has('similar', 2)
                ->where('similar.0.name', $close->name)
                ->where('similar.1.name', $far->name)
            );

        // Not in a preview.
        $preview = GymProfile::factory()->inCity($this->milano)->create();
        $this->actingAs($preview->user)
            ->get(route('gyms.show', $preview->slug))
            ->assertInertia(fn (Assert $page) => $page->where('preview', true)->has('similar', 0));
    }

    public function test_the_home_shows_published_gyms_with_a_cover_promotions_first()
    {
        $plain = $this->gym(['name' => 'Senza promo']);
        $promo = $this->gym(['name' => 'Con promo']);
        $noCover = $this->gym(['name' => 'Senza copertina']);
        $hidden = $this->gym(['name' => 'Nascosta', 'visible_in_search' => false]);

        foreach ([$plain, $promo, $hidden] as $gym) {
            $gym->photos()->create(['path' => "gyms/{$gym->id}/cover.jpg", 'is_cover' => true]);
        }
        $promo->promotions()->create(['title' => 'Primo mese gratis', 'discount_percent' => 100]);

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('gyms.items', 2)
                ->where('gyms.items.0.name', 'Con promo')
                ->where('gyms.items.1.name', 'Senza promo')
            );
        $this->assertNotNull($noCover);
    }

    public function test_the_home_carousel_shows_at_most_nine_gyms()
    {
        foreach (range(1, 10) as $number) {
            $gym = $this->gym(['name' => "Palestra {$number}"]);
            $gym->photos()->create(['path' => "gyms/{$gym->id}/cover.jpg", 'is_cover' => true]);
        }

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->has('gyms.items', 9));
    }
}
