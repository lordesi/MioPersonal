<?php

namespace Tests\Feature;

use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainerAreaTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> route name => Inertia component */
    private const PAGES = [
        'trainer.today' => 'trainer/today',
        'trainer.calendar' => 'trainer/calendar',
        'trainer.requests' => 'trainer/requests',
        'trainer.clients' => 'trainer/clients',
        'trainer.availability' => 'trainer/availability',
        'trainer.reviews' => 'trainer/reviews',
        'trainer.settings' => 'trainer/settings',
    ];

    public function test_guests_are_redirected_to_the_login_page()
    {
        foreach (array_keys(self::PAGES) as $route) {
            $this->get(route($route))->assertRedirect(route('login'));
        }
    }

    public function test_every_page_shares_the_trainer_area_data()
    {
        $profile = TrainerProfile::factory()->create();
        $this->actingAs($profile->user);

        foreach (self::PAGES as $route => $component) {
            $this->get(route($route))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component($component)
                    ->whereType('trainerArea.pendingCount', 'integer')
                    ->where('trainerArea.publicProfileHref', route('trainers.show', $profile->slug, false))
                    // The notice "Il tuo profilo è in revisione".
                    ->where('trainerArea.profile', ['status' => 'review', 'message' => null])
                );
        }
    }

    public function test_a_trainer_without_a_profile_is_asked_to_complete_it()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainerArea.publicProfileHref', null)
                ->where('trainerArea.profile.status', 'missing')
            );
    }

    /** No sample appointments and no Google/Apple calendars: a new trainer has an empty calendar. */
    public function test_a_new_trainer_has_an_empty_calendar()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.calendar'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('view', 'week')
                ->where('focus', now('Europe/Rome')->toDateString())
                ->has('events', 0)
                ->missing('syncs')
            );
    }

    public function test_a_new_trainer_has_no_clients()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page->has('clients', 0));
    }

    /** Hours and rules come from the registration: without it there is nothing to change. */
    public function test_availability_needs_the_registration()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.availability'))
            ->assertInertia(fn (Assert $page) => $page->where('availability', null));
    }

    public function test_settings_have_account_contacts_and_visibility()
    {
        $user = User::factory()->trainer()->create(['name' => 'Giulia Rossi']);
        TrainerProfile::factory()->for($user)->create();

        $this->actingAs($user)
            ->get(route('trainer.settings'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('account.firstName', 'Giulia')
                ->where('account.lastName', 'Rossi')
                ->where('contacts.email', $user->email)
                ->whereType('contacts.arrivalNotes', 'string')
                ->whereType('visibility.visibleInSearch', 'boolean')
                // The design no longer counts the sessions that get cancelled.
                ->missing('upcoming')
            );
    }

    public function test_a_new_trainer_has_no_reviews()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.reviews'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary', ['average' => null, 'count' => 0])
                ->has('reviews', 0)
            );
    }
}
