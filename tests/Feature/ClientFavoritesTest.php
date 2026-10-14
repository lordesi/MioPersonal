<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClientFavoritesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->get(route('client.favorites'))->assertRedirect(route('login'));
        $this->post(route('client.favorites.store', $trainer->slug))->assertRedirect(route('login'));
    }

    public function test_a_new_account_has_no_favorites()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('client.favorites'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/favorites')
                ->has('trainers', 0)
                ->where('auth.favoritesCount', 0)
            );
    }

    /** The heart is saved in the database: it is still there after a reload. */
    public function test_a_saved_trainer_stays_until_removed()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($client)->post(route('client.favorites.store', $trainer->slug))->assertSessionHasNoErrors();
        // Saving twice changes nothing.
        $this->actingAs($client)->post(route('client.favorites.store', $trainer->slug));

        $this->actingAs($client)
            ->get(route('client.favorites'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainers', 1)
                ->where('trainers.0.slug', $trainer->slug)
                ->where('trainers.0.name', $trainer->user->name)
                ->where('auth.favoritesCount', 1)
            );

        $this->actingAs($client)->delete(route('client.favorites.destroy', $trainer->slug));

        $this->assertSame(0, $client->favoriteTrainers()->count());
    }

    public function test_the_heart_is_full_in_the_search_and_on_the_profile()
    {
        $client = User::factory()->create();
        $saved = TrainerProfile::factory()->approved()->create();
        TrainerProfile::factory()->approved()->create();
        $client->favoriteTrainers()->attach($saved, ['created_at' => now()]);

        $this->actingAs($client)
            ->get(route('trainers.search'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainers', fn ($trainers) => collect($trainers)->where('favorite', true)->pluck('slug')->all() === [$saved->slug])
            );

        $this->actingAs($client)
            ->get(route('trainers.show', $saved->slug))
            ->assertInertia(fn (Assert $page) => $page->where('trainer.favorite', true));
    }

    public function test_only_approved_profiles_can_be_saved()
    {
        $trainer = TrainerProfile::factory()->status(TrainerProfileStatus::Review)->create();

        $this->actingAs(User::factory()->create())
            ->post(route('client.favorites.store', $trainer->slug))
            ->assertNotFound();
    }
}
