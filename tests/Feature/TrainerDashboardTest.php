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

    /** No sample data: a new trainer sees an empty dashboard until real bookings exist. */
    public function test_a_new_trainer_sees_an_empty_dashboard()
    {
        $user = User::factory()->trainer()->create(['name' => 'Giulia Rossi']);

        $this->actingAs($user)
            ->get(route('trainer.today'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/today')
                ->where('firstName', 'Giulia')
                ->has('today', 0)
                ->has('requests', 0)
                ->where('stats', ['sessionsThisWeek' => 0])
                ->has('todos', 0)
                ->where('trainerArea.pendingCount', 0)
            );
    }
}
