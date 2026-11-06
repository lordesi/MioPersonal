<?php

namespace Tests\Feature;

use App\Http\Controllers\SitemapController;
use App\Models\TrainerProfile;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoTrainerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    /** @return list<string> */
    private function locations(): array
    {
        $response = $this->get(route('sitemap'))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

        $xml = simplexml_load_string($response->getContent());
        $this->assertNotFalse($xml);

        return array_map(fn ($url) => (string) $url->loc, iterator_to_array($xml->url, false));
    }

    public function test_without_trainers_only_the_home_is_listed()
    {
        $this->seed(CatalogSeeder::class);

        $this->assertSame([route('home')], $this->locations());
    }

    public function test_lists_cities_disciplines_and_published_profiles()
    {
        $this->seed([CatalogSeeder::class, DemoTrainerSeeder::class]);

        $locations = $this->locations();

        $this->assertContains(route('trainers.search'), $locations);
        $this->assertContains(route('trainers.search', ['disciplina' => 'yoga']), $locations);
        $this->assertContains(route('trainers.search', 'milano'), $locations);
        // Giulia Rossi (Milano, also Monza) does pilates.
        $this->assertContains(route('trainers.search', ['monza', 'disciplina' => 'pilates']), $locations);
        $this->assertContains(route('trainers.show', 'marco-bianchi'), $locations);

        // Nobody does boxe in Milano.
        $this->assertNotContains(route('trainers.search', ['milano', 'disciplina' => 'boxe']), $locations);
        // Only the online-only trainer shows up there.
        $this->assertNotContains(route('trainers.search', 'agrigento'), $locations);
        // Waiting for the team.
        $this->assertNotContains(route('trainers.show', 'marco-ferri'), $locations);
        $this->assertSame($locations, array_values(array_unique($locations)));
    }

    public function test_paused_profiles_are_left_out_after_the_cache()
    {
        $this->seed([CatalogSeeder::class, DemoTrainerSeeder::class]);

        TrainerProfile::where('slug', 'marco-bianchi')->update(['paused_at' => now()]);
        Cache::forget(SitemapController::CACHE_KEY);

        $this->assertNotContains(route('trainers.show', 'marco-bianchi'), $this->locations());
    }
}
