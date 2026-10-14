<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Discipline;
use App\Models\User;
use App\Support\CatalogOptions;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Admin · Discipline e città: adding, editing, ordering and hiding. */
class AdminCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
    }

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    public function test_only_admins_can_change_the_catalog()
    {
        $pilates = Discipline::where('slug', 'pilates')->firstOrFail();

        $this->post(route('admin.disciplines.store'), ['name' => 'Nuoto'])
            ->assertRedirect(route('login'));

        foreach ([User::factory()->create(), User::factory()->trainer()->create()] as $user) {
            $this->actingAs($user)
                ->post(route('admin.disciplines.store'), ['name' => 'Nuoto'])
                ->assertForbidden();
            $this->actingAs($user)
                ->patch(route('admin.disciplines.update', $pilates), ['name' => 'X'])
                ->assertForbidden();
        }

        $this->assertDatabaseMissing('disciplines', ['slug' => 'nuoto']);
    }

    public function test_a_new_discipline_goes_at_the_end()
    {
        $this->actingAs($this->admin())
            ->from(route('admin.catalog'))
            ->post(route('admin.disciplines.store'), ['name' => ' Nuoto '])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.catalog'));

        $nuoto = Discipline::where('slug', 'nuoto')->firstOrFail();
        $this->assertSame('Nuoto', $nuoto->name);
        $this->assertSame((int) Discipline::max('sort'), $nuoto->sort);
        $this->assertContains(['value' => 'nuoto', 'label' => 'Nuoto'], CatalogOptions::disciplines());
    }

    public function test_a_discipline_needs_a_new_name()
    {
        $this->actingAs($this->admin())
            ->from(route('admin.catalog'))
            ->post(route('admin.disciplines.store'), ['name' => 'pilates'])
            ->assertSessionHasErrors('name');
    }

    public function test_renaming_keeps_the_slug_and_hiding_removes_it_from_the_site()
    {
        $pilates = Discipline::where('slug', 'pilates')->firstOrFail();

        $this->actingAs($this->admin())
            ->from(route('admin.catalog'))
            ->patch(route('admin.disciplines.update', $pilates), [
                'name' => 'Pilates matwork',
                'is_active' => '0',
            ])
            ->assertSessionHasNoErrors();

        $pilates->refresh();
        $this->assertSame('Pilates matwork', $pilates->name);
        // The URLs with ?disciplina=pilates keep working.
        $this->assertSame('pilates', $pilates->slug);
        $this->assertFalse($pilates->is_active);
        $this->assertNotContains('pilates', array_column(CatalogOptions::disciplines(), 'value'));
    }

    public function test_the_arrows_swap_two_disciplines()
    {
        // Seeded order: functional, pesi-e-bodybuilding, pilates…
        $pilates = Discipline::where('slug', 'pilates')->firstOrFail();

        $this->actingAs($this->admin())
            ->post(route('admin.disciplines.move', $pilates), ['direction' => 'up'])
            ->assertSessionHasNoErrors();

        $this->assertSame(
            ['functional', 'pilates', 'pesi-e-bodybuilding'],
            array_slice(array_column(CatalogOptions::disciplines(), 'value'), 0, 3),
        );

        // The first one can't go further up.
        $functional = Discipline::where('slug', 'functional')->firstOrFail();
        $this->actingAs($this->admin())->post(route('admin.disciplines.move', $functional), ['direction' => 'up']);
        $this->assertSame('functional', CatalogOptions::disciplines()[0]['value']);
    }

    public function test_a_new_city_reads_the_coordinates_copied_from_google_maps()
    {
        $this->actingAs($this->admin())
            ->from(route('admin.catalog'))
            ->post(route('admin.cities.store'), [
                'name' => 'Olbia',
                'province_code' => 'ss',
                'region' => 'Sardegna',
                'coordinates' => ' 40.9233, 9.4974 ',
            ])
            ->assertSessionHasNoErrors();

        $olbia = City::where('slug', 'olbia')->firstOrFail();
        $this->assertSame('SS', $olbia->province_code);
        $this->assertEqualsWithDelta(40.9233, $olbia->lat, 0.00001);
        $this->assertEqualsWithDelta(9.4974, $olbia->lng, 0.00001);
        $this->get(route('trainers.search', 'olbia'))->assertOk();
    }

    public function test_a_city_needs_valid_coordinates_province_and_region()
    {
        $this->actingAs($this->admin())
            ->from(route('admin.catalog'))
            ->post(route('admin.cities.store'), [
                'name' => 'Milano',
                'province_code' => 'Milano',
                'region' => 'Baviera',
                // Paris: outside Italy.
                'coordinates' => '48.8566, 2.3522',
            ])
            ->assertSessionHasErrors(['name', 'province_code', 'region', 'coordinates']);

        $this->actingAs($this->admin())
            ->from(route('admin.catalog'))
            ->post(route('admin.cities.store'), [
                'name' => 'Olbia',
                'province_code' => 'SS',
                'region' => 'Sardegna',
                'coordinates' => 'vicino al mare',
            ])
            ->assertSessionHasErrors('coordinates');

        $this->assertDatabaseMissing('cities', ['slug' => 'olbia']);
    }

    public function test_a_hidden_city_disappears_from_the_menus_and_its_search_page()
    {
        $bergamo = City::where('slug', 'bergamo')->firstOrFail();

        $this->actingAs($this->admin())
            ->from(route('admin.catalog'))
            ->patch(route('admin.cities.update', $bergamo), [
                'name' => 'Bergamo',
                'province_code' => 'BG',
                'region' => 'Lombardia',
                'coordinates' => $bergamo->lat.', '.$bergamo->lng,
                'is_active' => '0',
            ])
            ->assertSessionHasNoErrors();

        $this->assertFalse($bergamo->refresh()->is_active);
        $this->assertNotContains('bergamo', array_column(CatalogOptions::cities(), 'value'));
        $this->get(route('trainers.search', 'bergamo'))->assertNotFound();
    }
}
