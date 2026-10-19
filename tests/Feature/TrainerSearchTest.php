<?php

namespace Tests\Feature;

use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoTrainerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainerSearchTest extends TestCase
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

    public function test_search_page_shows_every_trainer_of_italy_without_a_city()
    {
        $this->get(route('trainers.search'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/search')
                ->where('city', null)
                ->has('trainers', 9)
                ->where('total', 9)
                ->where('pagination', ['currentPage' => 1, 'lastPage' => 1])
                ->where('filters.disciplina', null)
                ->has('trainers.0', fn (Assert $trainer) => $trainer
                    ->whereType('name', 'string')
                    ->whereType('city', 'string')
                    ->whereType('priceFromCents', 'integer')
                    ->whereType('nextSlotLabel', 'string')
                    ->etc()
                )
                ->has('disciplines', 10)
                ->has('cities', 109)
                ->where('cities.0', ['value' => 'agrigento', 'label' => 'Agrigento', 'region' => 'Sicilia'])
            );
    }

    public function test_a_city_shows_its_trainers_and_the_online_only_ones()
    {
        $this->get(route('trainers.search', 'milano'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('city', ['slug' => 'milano', 'name' => 'Milano'])
                // Giulia, Marco, Andrea (Milano), Elena (Monza, also goes to Milano), Sara (online).
                ->where('total', 5)
                // In person first, the most reviewed first.
                ->where('trainers.0.name', 'Marco Bianchi')
                // Sara Colombo trains only online: she shows up in every city, after the local ones.
                ->where('trainers.4.name', 'Sara Colombo')
            );

        $this->get(route('trainers.search', 'roma'))
            ->assertInertia(fn (Assert $page) => $page->where('total', 3));
    }

    public function test_online_sessions_ignore_the_city()
    {
        $this->get(route('trainers.search', ['city' => 'roma', 'modalita' => 'online']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 5));
    }

    public function test_an_unknown_city_is_not_found()
    {
        $this->get(route('trainers.search', 'atlantide'))->assertNotFound();
    }

    public function test_the_discipline_filter_uses_the_catalog_slugs()
    {
        $this->get(route('trainers.search', ['disciplina' => 'pilates']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.disciplina', 'pilates')
                ->where('total', 3)
                ->where('trainers.0.name', 'Giulia Rossi')
            );

        $this->get(route('trainers.search', ['disciplina' => 'pesi-e-bodybuilding']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 3));
    }

    public function test_mode_price_and_home_filters()
    {
        $this->get(route('trainers.search', ['modalita' => 'online']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 5));

        // Sara (30 €) and Davide (35 €).
        $this->get(route('trainers.search', ['prezzo' => 'fino-35']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 2));

        // Giulia and Luca (45 €), Marco (50 €), Francesca (55 €).
        $this->get(route('trainers.search', ['prezzo' => '45-60']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 4));

        // No maximum: nobody of the demo trainers costs more than 60 €.
        $this->get(route('trainers.search', ['prezzo' => 'oltre-60']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('total', 0));

        $this->get(route('trainers.search', ['domicilio' => '1']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 5));
    }

    /**
     * Wednesday 14 October 2026, 10:00 in Rome. The first free slots are set by
     * hand, so the test doesn't depend on the day it runs.
     */
    private function freezeFirstFreeSlots(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-14 10:00', 'Europe/Rome'));

        TrainerProfile::query()->update(['next_free_slot_at' => null]);

        $slots = [
            'giulia-rossi' => '2026-10-14 18:00', // today
            'chiara-galli' => '2026-10-16 23:30', // last evening of the 3 days (21:30 UTC)
            'andrea-conti' => '2026-10-17 00:30', // just after the 3 days, still in the week
            'elena-ricci' => '2026-10-20 09:00', // last day of the week
            'sara-colombo' => '2026-10-21 09:00', // after the week
        ];

        foreach ($slots as $slug => $time) {
            TrainerProfile::query()->where('slug', $slug)->update([
                'next_free_slot_at' => CarbonImmutable::parse($time, 'Europe/Rome')->utc(),
            ]);
        }
    }

    public function test_the_availability_filter_counts_whole_days_in_rome()
    {
        $this->freezeFirstFreeSlots();

        $this->get(route('trainers.search', ['disponibilita' => 'oggi']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.disponibilita', 'oggi')
                ->where('total', 1)
                ->where('trainers.0.name', 'Giulia Rossi')
            );

        // Giulia and Chiara.
        $this->get(route('trainers.search', ['disponibilita' => '3-giorni']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 2));

        // Giulia, Chiara, Andrea and Elena.
        $this->get(route('trainers.search', ['disponibilita' => 'settimana']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 4));
    }

    public function test_the_home_search_bar_combines_city_discipline_availability_and_mode()
    {
        $this->freezeFirstFreeSlots();

        // What the home sends: Cosa = Pilates, Dove = Milano, Quando, In presenza.
        // Giulia (Milano) and Elena (Monza, also Milano); Sara is online only.
        $this->get(route('trainers.search', [
            'city' => 'milano',
            'disciplina' => 'pilates',
            'disponibilita' => 'settimana',
            'modalita' => 'presenza',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('city', ['slug' => 'milano', 'name' => 'Milano'])
                ->where('total', 2)
            );

        $this->get(route('trainers.search', [
            'city' => 'milano',
            'disciplina' => 'pilates',
            'disponibilita' => 'oggi',
            'modalita' => 'presenza',
        ]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 1)
                ->where('trainers.0.name', 'Giulia Rossi')
            );
    }

    public function test_sort_by_price_puts_the_cheapest_first()
    {
        $this->get(route('trainers.search', ['ordina' => 'prezzo']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainers.0.name', 'Sara Colombo')
                ->where('trainers.0.priceFromCents', 3000)
                ->where('trainers.8.name', 'Francesca Marino')
                ->where('trainers.8.priceFromCents', 5500)
            );
    }

    public function test_the_top_rating_filter_compares_the_average()
    {
        // 4.5 or more: Giulia, Marco, Sara, Luca, Davide, Chiara, Andrea. Not the new ones.
        $this->get(route('trainers.search', ['valutazione' => '4-5']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 7));
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
        $this->get(route('trainers.search', ['disciplina' => 'nuoto', 'zona' => 'brera', 'pagina' => 99]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.disciplina', null)
                ->missing('filters.zona')
                ->where('total', 9)
                ->where('pagination.currentPage', 1)
            );
    }
}
