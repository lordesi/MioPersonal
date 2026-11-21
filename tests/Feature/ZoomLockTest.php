<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Zooming the page (resources/views/app.blade.php, resources/js/lib/zoom-lock.ts):
 * the public pages can be zoomed as every site, the private areas cannot.
 */
class ZoomLockTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_public_pages_can_be_zoomed()
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertSee('<meta name="viewport" content="width=device-width, initial-scale=1">', false)
            ->assertDontSee('zoom-locked', false);
    }

    public function test_the_private_areas_cannot_be_zoomed()
    {
        $this->actingAs(User::factory()->create())->get(route('client.home'))
            ->assertOk()
            ->assertSee('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">', false)
            ->assertSee('class="zoom-locked"', false);
    }
}
