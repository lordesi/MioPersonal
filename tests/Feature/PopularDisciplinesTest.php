<?php

namespace Tests\Feature;

use App\Support\CatalogOptions;
use App\Support\PopularDisciplines;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PopularDisciplinesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
    }

    /** @param  list<string>  $disciplines */
    private function search(array $disciplines, int $times = 1, string $kind = 'trainer', int $daysAgo = 1): void
    {
        foreach (range(1, $times) as $ignored) {
            DB::table('search_logs')->insert([
                'city_id' => null,
                'disciplines' => json_encode($disciplines),
                'goals' => '[]',
                'filters' => '[]',
                'results' => 3,
                'role' => 'guest',
                'kind' => $kind,
                'created_at' => now()->subDays($daysAgo),
            ]);
        }
    }

    public function test_with_few_searches_the_team_order_stays()
    {
        $catalog = CatalogOptions::disciplines();
        $this->search([$catalog[3]['value']], PopularDisciplines::MIN_SEARCHES - 1);

        $this->assertSame($catalog, PopularDisciplines::order($catalog));
    }

    public function test_the_most_searched_come_first_then_the_team_order()
    {
        $catalog = CatalogOptions::disciplines();
        [$first, $second, $third, $fourth] = array_column($catalog, 'value');

        $this->search([$fourth], 15);
        $this->search([$third, $fourth], 6);
        // Not counted: gyms' searches, older than 30 days, no discipline.
        $this->search([$second], 50, kind: 'gym');
        $this->search([$second], 50, daysAgo: PopularDisciplines::DAYS + 1);
        $this->search([], 50);

        $order = array_column(PopularDisciplines::order($catalog), 'value');

        $this->assertSame([$fourth, $third, $first, $second], array_slice($order, 0, 4));
        $this->assertCount(count($catalog), $order);
    }

    public function test_the_home_sends_them_apart_from_the_search_options()
    {
        $catalog = CatalogOptions::disciplines();
        $last = end($catalog)['value'];
        $this->search([$last], PopularDisciplines::MIN_SEARCHES);

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('popularDisciplines.0.value', $last)
                ->where('disciplines.0.value', $catalog[0]['value'])
            );
    }
}
