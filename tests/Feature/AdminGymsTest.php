<?php

namespace Tests\Feature;

use App\Actions\Gym\GymLinks;
use App\Enums\GymLinkSide;
use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The gyms in the admin panel: "Utenti › Palestre", the overview and the catalog. */
class AdminGymsTest extends TestCase
{
    use RefreshDatabase;

    private City $milano;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        Notification::fake();
        $this->milano = City::where('slug', 'milano')->firstOrFail();
        $this->admin = User::factory()->admin()->create();
    }

    /** FitLab in Milano, with one trainer who works there. */
    private function gymWithTrainer(): array
    {
        $gym = GymProfile::factory()->approved()->inCity($this->milano)->create(['name' => 'FitLab']);
        $trainer = TrainerProfile::factory()->approved()->bookable()->create();
        $links = app(GymLinks::class);
        $links->accept($links->request($trainer, $gym, notify: false), GymLinkSide::Gym);

        return [$gym, $trainer->fresh()];
    }

    public function test_the_users_page_lists_the_gyms()
    {
        [$gym] = $this->gymWithTrainer();
        // Still in the sign-up: no profile yet. The newest comes first.
        $this->travel(1)->minutes();
        $newGym = User::factory()->gym()->create(['first_name' => 'Luca', 'last_name' => 'Bianchi']);

        $this->actingAs($this->admin)
            ->get(route('admin.users'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users')
                ->has('gyms', 2)
                ->has('clients', 0)
                ->where('gyms.0.id', $newGym->id)
                ->where('gyms.0.name', 'Luca Bianchi')
                ->where('gyms.0.profileStatus', 'review')
                ->where('gyms.0.profileHref', null)
                ->where('gyms.1.name', 'FitLab')
                ->where('gyms.1.contact', $gym->user->name)
                ->where('gyms.1.city', 'Milano')
                ->where('gyms.1.profileStatus', 'approved')
                ->where('gyms.1.trainerCount', 1)
                ->where('gyms.1.profileHref', route('gyms.show', $gym->slug, false))
                ->where('gyms.1.suspended', false)
            );
    }

    public function test_the_search_finds_a_gym_by_its_name()
    {
        $this->gymWithTrainer();
        GymProfile::factory()->approved()->create(['name' => 'Power House']);

        $this->actingAs($this->admin)
            ->get(route('admin.users', ['cerca' => 'fitl']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('gyms', 1)
                ->where('gyms.0.name', 'FitLab')
                // The name of a gym doesn't find trainers or clients.
                ->has('trainers', 0)
            );
    }

    public function test_a_suspended_gym_disappears_from_the_search_and_from_its_trainers()
    {
        [$gym, $trainer] = $this->gymWithTrainer();

        $this->assertTrue(TrainerProfile::query()->basedIn($this->milano->id)->whereKey($trainer->id)->exists());
        $this->get(route('trainers.show', $trainer->slug))
            ->assertInertia(fn (Assert $page) => $page->has('trainer.gyms', 1));

        $this->actingAs($this->admin)->post(route('admin.users.suspend', $gym->user))->assertRedirect();
        auth()->logout();

        $this->get(route('gyms.show', $gym->slug))->assertNotFound();
        $this->get(route('gyms.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page->where('total', 0));
        $this->get(route('trainers.show', $trainer->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('trainer.gyms', 0));
        // Its trainers no longer count as "in Milano" through it.
        $this->assertFalse(TrainerProfile::query()->basedIn($this->milano->id)->whereKey($trainer->id)->exists());

        $this->actingAs($this->admin)->delete(route('admin.users.reactivate', $gym->user))->assertRedirect();
        auth()->logout();

        $this->get(route('gyms.show', $gym->slug))->assertOk();
        $this->assertTrue(TrainerProfile::query()->basedIn($this->milano->id)->whereKey($trainer->id)->exists());
    }

    public function test_the_overview_has_the_gyms_to_verify_and_the_active_ones()
    {
        GymProfile::factory()->approved()->create();
        GymProfile::factory()->create(['status_changed_at' => now()->subDays(3)]);
        GymProfile::factory()->create(['status_changed_at' => now()->subDay()]);
        GymProfile::factory()->status(TrainerProfileStatus::Rejected)->create();

        $this->actingAs($this->admin)
            ->get(route('admin.overview'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('todo.gymVerificationCount', 2)
                ->where('todo.oldestGymWaitDays', 3)
                ->where('stats.activeGyms', 1)
            );
    }

    public function test_the_catalog_counts_the_approved_gyms_of_each_city()
    {
        GymProfile::factory()->approved()->inCity($this->milano)->count(2)->create();
        GymProfile::factory()->inCity($this->milano)->create();

        $this->actingAs($this->admin)
            ->get(route('admin.catalog'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('citiesByRegion.Lombardia', fn ($cities) => collect($cities)->firstWhere('slug', 'milano')['gymCount'] === 2
                    && collect($cities)->firstWhere('slug', 'bergamo')['gymCount'] === 0)
            );
    }
}
