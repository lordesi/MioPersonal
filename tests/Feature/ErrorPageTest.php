<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class ErrorPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_page_of_another_area_shows_our_403_page()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->get(route('admin.overview'))
            ->assertForbidden()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/error')
                ->where('status', 403)
            );
    }

    public function test_a_server_error_shows_our_500_page_without_debug()
    {
        config(['app.debug' => false]);
        Route::get('/prova-errore', fn () => throw new RuntimeException('Boom'));

        $this->get('/prova-errore')
            ->assertInternalServerError()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/error')
                ->where('status', 500)
            );
    }

    public function test_with_debug_on_a_server_error_keeps_laravel_page()
    {
        config(['app.debug' => true]);
        Route::get('/prova-errore', fn () => throw new RuntimeException('Boom'));

        // Laravel's debug page, with the message of the exception.
        $this->get('/prova-errore')
            ->assertInternalServerError()
            ->assertSee('Boom');
    }

    public function test_json_requests_still_get_a_json_error()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->getJson(route('admin.overview'))
            ->assertForbidden()
            ->assertJsonStructure(['message']);
    }
}
