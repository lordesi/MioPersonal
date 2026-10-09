<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClientFavoritesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('client.favorites'))->assertRedirect(route('login'));
    }

    public function test_favorites_page_lists_the_saved_trainers()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('client.favorites'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/favorites')
                ->has('trainers', 3)
                ->has('trainers.0', fn (Assert $trainer) => $trainer
                    ->where('name', 'Giulia Rossi')
                    ->whereType('priceFromCents', 'integer')
                    ->whereType('nextSlotLabel', 'string')
                    ->etc()
                )
            );
    }
}
