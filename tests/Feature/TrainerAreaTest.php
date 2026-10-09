<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainerAreaTest extends TestCase
{
    use RefreshDatabase;

    private const UTC_ISO = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/';

    /** @var array<string, string> route name => Inertia component */
    private const PAGES = [
        'trainer.today' => 'trainer/today',
        'trainer.calendar' => 'trainer/calendar',
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
        $this->actingAs(User::factory()->trainer()->create());

        foreach (self::PAGES as $route => $component) {
            $this->get(route($route))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component($component)
                    ->whereType('trainerArea.pendingCount', 'integer')
                    ->whereType('trainerArea.publicProfileHref', 'string')
                );
        }
    }

    public function test_calendar_has_events_syncs_and_month_counts()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.calendar'))
            ->assertInertia(function (Assert $page) {
                $props = $page->toArray()['props'];

                $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $props['weekStart']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['events'][0]['start']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['events'][0]['end']);
                $this->assertContains($props['events'][0]['kind'], ['confirmed', 'pending', 'busy']);
                $this->assertCount(2, $props['syncs']);
                $this->assertIsInt(array_values($props['sessionCounts'])[0]);
            });
    }

    public function test_clients_have_sessions_and_packages()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('clients', 6)
                ->has('clients.0', fn (Assert $client) => $client
                    ->whereType('sessions', 'integer')
                    ->whereType('package.left', 'integer')
                    ->whereType('package.total', 'integer')
                    ->etc()
                )
            );
    }

    public function test_availability_has_seven_days_and_rules()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.availability'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('weekdays', 7)
                ->whereType('autoConfirm', 'boolean')
                ->whereType('rules.noticeHours', 'integer')
                ->has('holidays.0', fn (Assert $holiday) => $holiday
                    ->whereType('from', 'string')
                    ->whereType('to', 'string')
                    ->etc()
                )
            );
    }

    public function test_settings_have_account_contacts_and_upcoming_sessions()
    {
        $user = User::factory()->trainer()->create(['name' => 'Giulia Rossi']);

        $this->actingAs($user)
            ->get(route('trainer.settings'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('account.firstName', 'Giulia')
                ->where('account.lastName', 'Rossi')
                ->where('contacts.email', $user->email)
                ->whereType('contacts.arrivalNotes', 'string')
                ->whereType('upcoming.sessions', 'integer')
                ->whereType('upcoming.requests', 'integer')
            );
    }

    public function test_reviews_have_summary_and_list()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.reviews'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.count', 23)
                ->has('reviews.0', fn (Assert $review) => $review
                    ->whereType('rating', 'integer')
                    ->where('reply', null)
                    ->etc()
                )
            );
    }
}
