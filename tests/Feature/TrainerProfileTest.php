<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainerProfileTest extends TestCase
{
    public function test_trainer_profile_renders_with_its_data()
    {
        $this->get(route('trainers.show', 'giulia-rossi'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/profile')
                ->has('trainer', fn (Assert $trainer) => $trainer
                    ->where('name', 'Giulia Rossi')
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
                $this->assertContains($slot['maxHours'], [1, 2]);
            });
    }

    public function test_unknown_trainer_returns_not_found()
    {
        $this->get(route('trainers.show', 'nessuno'))->assertNotFound();
    }

    public function test_home_cards_link_to_trainer_profiles()
    {
        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('featuredTrainers.0.href', route('trainers.show', 'giulia-rossi', false))
            );
    }
}
