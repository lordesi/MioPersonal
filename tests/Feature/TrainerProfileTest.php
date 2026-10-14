<?php

namespace Tests\Feature;

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
        $this->get(route('trainers.show', 'giulia-rossi'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/profile')
                ->has('trainer', fn (Assert $trainer) => $trainer
                    ->where('name', 'Giulia Rossi')
                    ->where('city', ['slug' => 'milano', 'name' => 'Milano'])
                    ->whereType('cities', 'array')
                    ->has('services.0', fn (Assert $service) => $service
                        ->whereType('priceCents', 'integer')
                        ->whereType('perHour', 'boolean')
                        ->etc()
                    )
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
                $this->assertSame([60, 90, 120], $page->toArray()['props']['trainer']['sessionMinutes']);
                $this->assertContains($slot['maxMinutes'], [60, 90, 120]);
            });
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
