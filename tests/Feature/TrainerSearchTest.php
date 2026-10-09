<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainerSearchTest extends TestCase
{
    public function test_search_page_shows_every_trainer_without_filters()
    {
        $this->get(route('trainers.search'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/search')
                ->has('trainers', 9)
                ->where('total', 9)
                ->where('pagination', ['currentPage' => 1, 'lastPage' => 1])
                ->where('filters.disciplina', null)
                ->has('trainers.0', fn (Assert $trainer) => $trainer
                    ->whereType('name', 'string')
                    ->whereType('priceFromCents', 'integer')
                    ->whereType('nextSlotLabel', 'string')
                    ->etc()
                )
                ->has('disciplines.0', fn (Assert $option) => $option
                    ->whereType('value', 'string')
                    ->whereType('label', 'string')
                )
            );
    }

    public function test_filters_use_the_values_of_the_home_search_form()
    {
        $this->get(route('trainers.search', ['disciplina' => 'pilates']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.disciplina', 'pilates')
                ->where('total', 3)
                ->where('trainers.0.name', 'Giulia Rossi')
            );

        $this->get(route('trainers.search', ['zona' => 'citta-studi']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 1)
                ->where('trainers.0.name', 'Giulia Rossi')
            );
    }

    public function test_mode_price_and_home_filters()
    {
        $this->get(route('trainers.search', ['modalita' => 'online']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 5));

        $this->get(route('trainers.search', ['prezzo' => 'fino-35']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 2));

        $this->get(route('trainers.search', ['domicilio' => '1']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 5));
    }

    public function test_sort_by_price_puts_the_cheapest_first()
    {
        $this->get(route('trainers.search', ['ordina' => 'prezzo']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainers.0.name', 'Sara Colombo')
                ->where('trainers.0.priceFromCents', 3000)
            );
    }

    public function test_no_results_when_nothing_matches()
    {
        $this->get(route('trainers.search', ['disciplina' => 'boxe', 'modalita' => 'online']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainers', 0)
                ->where('total', 0)
            );
    }

    public function test_unknown_filter_values_are_ignored()
    {
        $this->get(route('trainers.search', ['disciplina' => 'nuoto', 'pagina' => 99]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.disciplina', null)
                ->where('total', 9)
                ->where('pagination.currentPage', 1)
            );
    }
}
