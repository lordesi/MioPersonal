<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Discipline;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Cities (provincial capitals) and disciplines loaded by CatalogSeeder. */
class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_seeder_loads_every_provincial_capital_with_coordinates()
    {
        $this->seed(CatalogSeeder::class);

        $this->assertSame(109, City::count());
        $this->assertSame(0, City::whereNull('lat')->orWhereNull('lng')->count());

        // All inside Italy.
        $this->assertSame(0, City::where('lat', '<', 35.4)->orWhere('lat', '>', 47.2)->count());
        $this->assertSame(0, City::where('lng', '<', 6.5)->orWhere('lng', '>', 18.6)->count());
    }

    public function test_city_slugs_are_readable_and_unique()
    {
        $this->seed(CatalogSeeder::class);

        $slugs = City::pluck('slug');

        $this->assertSame($slugs->count(), $slugs->unique()->count());
        $this->assertContains('forli', $slugs);
        $this->assertContains('l-aquila', $slugs);
        $this->assertContains('reggio-nell-emilia', $slugs);
    }

    public function test_running_the_seeder_again_does_not_duplicate_anything()
    {
        $this->seed(CatalogSeeder::class);
        $this->seed(CatalogSeeder::class);

        $this->assertSame(109, City::count());
        $this->assertSame(10, Discipline::count());
    }

    public function test_the_admin_catalog_lists_cities_by_region()
    {
        $this->seed(CatalogSeeder::class);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.catalog'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/catalog')
                ->has('disciplines', 10)
                ->has('citiesByRegion.Lombardia', 12)
                ->has('citiesByRegion.Sardegna', 5)
            );
    }
}
