<?php

namespace Tests\Feature;

use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Every page in the menus of an area (side menu, tabs and "Altro") opens
 * for its role: the same lists as trainer-nav.tsx, gym-nav.tsx and
 * client-nav.tsx.
 */
class AreaNavigationTest extends TestCase
{
    use RefreshDatabase;

    /** The pages of every visitor: the four searches and the pages about MioPersonal. */
    private const PUBLIC_PAGES = [
        'home', 'trainers.search', 'gyms.search', 'courses.search', 'events.search',
        'news', 'how-it-works', 'contact.show',
    ];

    private const TRAINER_PAGES = [
        'trainer.today', 'trainer.requests', 'trainer.calendar', 'trainer.clients',
        'trainer.availability', 'trainer.services', 'trainer.events', 'trainer.gyms',
        'trainer.profile.edit', 'trainer.reviews', 'trainer.share', 'trainer.settings',
    ];

    private const GYM_PAGES = [
        'gym.dashboard', 'gym.courses', 'gym.events', 'gym.trainers',
        'gym.profile.edit', 'gym.photos', 'gym.amenities',
        'gym.plans', 'gym.promotions', 'gym.settings',
    ];

    private const CLIENT_PAGES = [
        'client.home', 'client.favorites', 'client.profile', 'account.settings',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
    }

    public function test_guests_open_the_public_pages(): void
    {
        foreach (self::PUBLIC_PAGES as $route) {
            $this->get(route($route))->assertOk();
        }
    }

    public function test_a_trainer_opens_every_page_of_the_menu(): void
    {
        $this->actingAs(TrainerProfile::factory()->approved()->create()->user);

        foreach ([...self::TRAINER_PAGES, ...self::PUBLIC_PAGES] as $route) {
            $this->get(route($route))->assertOk();
        }
    }

    public function test_a_gym_opens_every_page_of_the_menu(): void
    {
        $this->actingAs(GymProfile::factory()->approved()->create()->user);

        foreach ([...self::GYM_PAGES, ...self::PUBLIC_PAGES] as $route) {
            $this->get(route($route))->assertOk();
        }
    }

    public function test_a_client_opens_every_page_of_the_menu(): void
    {
        $this->actingAs(User::factory()->create());

        foreach ([...self::CLIENT_PAGES, ...self::PUBLIC_PAGES] as $route) {
            $this->get(route($route))->assertOk();
        }
    }

    /** Each area sends the other roles away. */
    public function test_the_areas_are_only_for_their_role(): void
    {
        $this->actingAs(User::factory()->create());

        foreach (['trainer.today', 'gym.dashboard'] as $route) {
            $this->get(route($route))->assertRedirect();
        }
    }
}
