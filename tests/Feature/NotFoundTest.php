<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotFoundTest extends TestCase
{
    use RefreshDatabase;

    public function test_unknown_addresses_show_our_404_page()
    {
        $this->get('/pagina-che-non-esiste')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page->component('public/not-found'));
    }

    public function test_the_404_page_knows_who_is_logged_in()
    {
        $user = User::factory()->create();

        // The header shows the account menu, not "Accedi".
        $this->actingAs($user)
            ->get('/pagina-che-non-esiste')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/not-found')
                ->where('auth.user.id', $user->id)
            );
    }

    public function test_json_requests_still_get_a_json_404()
    {
        $this->getJson('/pagina-che-non-esiste')
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }
}
