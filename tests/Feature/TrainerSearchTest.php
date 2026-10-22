<?php

namespace Tests\Feature;

use App\Models\TrainerProfile;
use App\Models\User;
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
                ->where('filters.disciplina', [])
                ->where('filters.obiettivo', [])
                // Only when nothing matches.
                ->where('suggestions', null)
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
                ->where('filters.disciplina', ['pilates'])
                ->where('total', 3)
                ->where('trainers.0.name', 'Giulia Rossi')
            );

        $this->get(route('trainers.search', ['disciplina' => 'pesi-e-bodybuilding']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 3));
    }

    public function test_more_disciplines_find_the_trainers_who_do_all_of_them()
    {
        // Pilates: Giulia, Sara and Elena. Pilates and Yoga together: only Sara and Elena.
        $this->get(route('trainers.search', ['disciplina' => 'yoga,pilates']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.disciplina', ['yoga', 'pilates'])
                ->where('total', 2)
                ->where('trainers', fn ($trainers) => collect($trainers)->pluck('name')->sort()->values()->all() === ['Elena Ricci', 'Sara Colombo'])
            );
    }

    public function test_the_goal_filter_finds_the_trainers_with_all_the_goals()
    {
        // Massa muscolare: Marco, Luca, Andrea and Francesca.
        $this->get(route('trainers.search', ['obiettivo' => 'muscle']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.obiettivo', ['muscle'])
                ->where('total', 4)
            );

        // Massa muscolare and Preparazione atletica: Luca and Francesca. An unknown goal is ignored.
        $this->get(route('trainers.search', ['obiettivo' => 'muscle,athletic,volare']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.obiettivo', ['muscle', 'athletic'])
                ->where('total', 2)
            );
    }

    public function test_nobody_with_both_disciplines_suggests_who_does_one_of_them()
    {
        // In Milano nobody does Crossfit and Calisthenics: Andrea does Calisthenics
        // (Luca does Crossfit, but in Torino).
        $this->get(route('trainers.search', ['city' => 'milano', 'disciplina' => 'crossfit,calisthenics']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 0)
                ->where('suggestions.step', 'some')
                ->has('suggestions.trainers', 1)
                ->where('suggestions.trainers.0.name', 'Andrea Conti')
            );
    }

    public function test_suggestions_put_first_who_has_more_of_the_chosen_goals()
    {
        // Nobody has all three. Luca and Francesca have two of them (Luca has more reviews).
        $this->get(route('trainers.search', ['obiettivo' => 'muscle,posture,athletic']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 0)
                ->where('suggestions.step', 'some')
                ->where('suggestions.trainers.0.name', 'Luca Ferrari')
                ->where('suggestions.trainers.1.name', 'Francesca Marino')
            );
    }

    public function test_suggestions_leave_out_the_minor_filters()
    {
        // Nobody of Pilates costs more than 100 €: the 3 of Pilates, at any price.
        $this->get(route('trainers.search', ['disciplina' => 'pilates', 'prezzo' => 'oltre-100']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 0)
                ->where('suggestions.step', 'fewer-filters')
                ->has('suggestions.trainers', 3)
            );
    }

    public function test_suggestions_end_with_the_trainers_of_the_city()
    {
        // Nobody does Boxe in Roma: Chiara, Francesca and Sara (online).
        $this->get(route('trainers.search', ['city' => 'roma', 'disciplina' => 'boxe']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('total', 0)
                ->where('suggestions.step', 'city')
                ->has('suggestions.trainers', 3)
            );
    }

    public function test_mode_price_and_home_filters()
    {
        $this->get(route('trainers.search', ['modalita' => 'online']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 5));

        // Sara (30 €) and Davide (35 €).
        $this->get(route('trainers.search', ['prezzo' => 'fino-35']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 2));

        // Chiara (38 €), Elena and Andrea (40 €), Giulia and Luca (45 €), Marco (50 €):
        // Davide's 35 € is already "Fino a 35 €".
        $this->get(route('trainers.search', ['prezzo' => '35-50']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 6));

        // Francesca (55 €): 50 € is already "35–50 €".
        $this->get(route('trainers.search', ['prezzo' => '50-75']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 1));

        // No maximum: nobody of the demo trainers costs more than 100 €.
        $this->get(route('trainers.search', ['prezzo' => 'oltre-100']))
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

    public function test_the_rating_filter_compares_the_average()
    {
        // 4.5 or more: Giulia, Marco, Sara, Luca, Davide, Chiara, Andrea. Not the new ones.
        $this->get(route('trainers.search', ['valutazione' => '4-5']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 7));

        // Every demo average is 4.6 or more: Andrea goes to exactly 4.0 and Chiara
        // to exactly 3.0, so each level gets one more trainer (the limit counts).
        TrainerProfile::query()->where('slug', 'andrea-conti')->update(['rating_sum' => 4 * 14, 'rating_count' => 14]);
        TrainerProfile::query()->where('slug', 'chiara-galli')->update(['rating_sum' => 3 * 27, 'rating_count' => 27]);

        $this->get(route('trainers.search', ['valutazione' => '4-5']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 5));

        $this->get(route('trainers.search', ['valutazione' => '4']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.valutazione', '4')
                ->where('total', 6)
            );

        $this->get(route('trainers.search', ['valutazione' => '3']))
            ->assertInertia(fn (Assert $page) => $page->where('total', 7));
    }

    public function test_the_favorites_filter_shows_only_the_saved_trainers()
    {
        $client = User::factory()->create();
        $saved = TrainerProfile::query()->published()->orderBy('id')->limit(2)->get();
        $client->favoriteTrainers()->attach($saved->pluck('id'), ['created_at' => now()]);

        $this->actingAs($client)
            ->get(route('trainers.search', ['preferiti' => '1']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.preferiti', '1')
                ->where('total', 2)
                ->where('trainers', fn ($trainers) => collect($trainers)->pluck('slug')->sort()->values()->all() === $saved->pluck('slug')->sort()->values()->all())
                ->where('auth.favoritesCount', 2)
            );
    }

    public function test_guests_have_no_favorites_to_show()
    {
        $this->get(route('trainers.search', ['preferiti' => '1']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('total', 0));
    }

    public function test_no_results_when_nothing_matches()
    {
        $this->get(route('trainers.search', ['disciplina' => 'boxe', 'modalita' => 'online']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('trainers', 0)
                ->where('total', 0)
                // Every online trainer of Italy instead.
                ->where('suggestions.step', 'city')
                ->has('suggestions.trainers', 5)
            );
    }

    public function test_unknown_filter_values_are_ignored()
    {
        $this->get(route('trainers.search', ['disciplina' => 'nuoto', 'zona' => 'brera', 'pagina' => 99]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.disciplina', [])
                ->missing('filters.zona')
                ->where('total', 9)
                ->where('pagination.currentPage', 1)
            );
    }
}
