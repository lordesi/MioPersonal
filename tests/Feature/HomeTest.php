<?php

namespace Tests\Feature;

use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoTrainerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeTest extends TestCase
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

    public function test_home_renders_the_public_home_page()
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('public/home'));
    }

    public function test_home_receives_featured_trainers_in_the_card_format()
    {
        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('featuredTrainers', 3)
                ->has('featuredTrainers.0', fn (Assert $trainer) => $trainer
                    ->whereType('slug', 'string')
                    ->whereType('name', 'string')
                    ->whereType('href', 'string')
                    ->whereType('city', 'string')
                    ->whereType('disciplines', 'array')
                    ->whereType('rating', 'double|integer|null')
                    ->whereType('reviewCount', 'integer')
                    ->whereType('priceFromCents', 'integer')
                    ->whereType('nextSlotLabel', 'string')
                    ->has('online')
                    ->whereType('photoUrl', 'string|null')
                )
                ->has('disciplines', 10)
                ->has('cities', 109)
            );
    }
}
