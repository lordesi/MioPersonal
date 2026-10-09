<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TrainerDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('trainer.today'))->assertRedirect(route('login'));
    }

    public function test_dashboard_renders_with_its_data()
    {
        $user = User::factory()->trainer()->create(['name' => 'Giulia Rossi']);

        $this->actingAs($user)
            ->get(route('trainer.today'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/today')
                ->where('firstName', 'Giulia')
                ->has('today', 4)
                ->has('requests', 3)
                ->has('stats', fn (Assert $stats) => $stats
                    ->whereType('sessionsThisWeek', 'integer')
                    ->whereType('sessionsLastWeek', 'integer')
                    ->whereType('profileViews', 'integer')
                    ->whereType('profileBookings', 'integer')
                )
                ->has('todos')
            );
    }

    public function test_session_and_request_times_are_utc_iso_strings()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.today'))
            ->assertInertia(function (Assert $page) {
                $props = $page->toArray()['props'];
                $utcIso = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/';

                $this->assertMatchesRegularExpression($utcIso, $props['today'][0]['start']);
                $this->assertMatchesRegularExpression($utcIso, $props['requests'][0]['start']);
                $this->assertMatchesRegularExpression($utcIso, $props['requests'][0]['expiresAt']);
            });
    }
}
