<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Nascosto finché non è approvato": only approved profiles show up in the site. */
class TrainerProfileVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
    }

    private function profile(TrainerProfileStatus $status): TrainerProfile
    {
        return TrainerProfile::factory()
            ->status($status)
            ->inCity(City::where('slug', 'milano')->firstOrFail())
            ->withDisciplines(['pilates'])
            ->create();
    }

    public function test_profiles_not_approved_never_show_up_in_search_and_home()
    {
        foreach ([TrainerProfileStatus::Review, TrainerProfileStatus::Changes, TrainerProfileStatus::Rejected] as $status) {
            $this->profile($status);
        }

        $this->get(route('trainers.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page->where('total', 0));
        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->has('featuredTrainers', 0));
    }

    public function test_an_approved_profile_shows_up_unless_hidden_by_the_trainer()
    {
        $profile = $this->profile(TrainerProfileStatus::Approved);

        $this->get(route('trainers.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page->where('total', 1));

        // "Visibile nella ricerca" off: out of the search, the link still works.
        $profile->update(['visible_in_search' => false]);

        $this->get(route('trainers.search', 'milano'))
            ->assertInertia(fn (Assert $page) => $page->where('total', 0));
        $this->get(route('trainers.show', $profile->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('preview', false));
    }

    public function test_a_profile_waiting_for_the_team_is_a_preview_for_its_trainer_and_the_admins()
    {
        $profile = $this->profile(TrainerProfileStatus::Review);

        $this->get(route('trainers.show', $profile->slug))->assertNotFound();
        $this->actingAs(User::factory()->create())->get(route('trainers.show', $profile->slug))->assertNotFound();

        foreach ([$profile->user, User::factory()->admin()->create()] as $user) {
            $this->actingAs($user)
                ->get(route('trainers.show', $profile->slug))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('preview', true)
                    ->where('trainer.verified', false)
                );
        }
    }
}
