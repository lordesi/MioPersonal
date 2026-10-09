<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeTest extends TestCase
{
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
                    ->whereType('name', 'string')
                    ->whereType('href', 'string')
                    ->whereType('zone', 'string')
                    ->whereType('disciplines', 'array')
                    ->whereType('rating', 'double|integer|null')
                    ->whereType('reviewCount', 'integer')
                    ->whereType('priceFromCents', 'integer')
                    ->whereType('nextSlotLabel', 'string')
                    ->has('online')
                )
            );
    }
}
