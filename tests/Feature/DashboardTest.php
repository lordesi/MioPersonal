<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_clients_are_sent_to_their_bookings()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('client.bookings'));
    }

    public function test_trainers_are_sent_to_their_area()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('dashboard'))
            ->assertRedirect(route('trainer.today'));
    }

    public function test_admins_are_sent_to_the_admin_panel()
    {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('dashboard'))
            ->assertRedirect(route('admin.overview'));
    }
}
