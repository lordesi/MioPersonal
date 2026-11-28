<?php

namespace Tests\Feature;

use App\Models\GymProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The colour behind the page before it is drawn (resources/views/app.blade.php):
 * never a white screen on the dark site.
 */
class PageBackgroundTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_dark_site_starts_dark()
    {
        $this->get(route('home'))
            ->assertOk()
            // The body too: Safari on iOS 26 tints the top bar with its colour.
            ->assertSee('html, body {', false)
            ->assertSee('background-color: #000000;', false)
            ->assertSee('<meta name="theme-color" content="#000000">', false);

        // The areas have no SSR: dark before the JavaScript arrives.
        $this->actingAs(User::factory()->create())->get(route('client.home'))
            ->assertOk()
            ->assertSee('background-color: #000000;', false);
    }

    public function test_the_gym_area_is_still_light()
    {
        $this->seed(CatalogSeeder::class);
        $gym = GymProfile::factory()->approved()->create();

        $this->actingAs($gym->user)->get(route('gym.dashboard'))
            ->assertOk()
            ->assertSee('background-color: #ffffff;', false)
            ->assertSee('<meta name="theme-color" content="#ffffff">', false);
    }

    public function test_the_app_on_the_home_screen_opens_dark()
    {
        $manifest = json_decode((string) file_get_contents(public_path('manifest.webmanifest')), true);

        $this->assertSame('#000000', $manifest['background_color']);
        $this->assertSame('#000000', $manifest['theme_color']);
    }
}
