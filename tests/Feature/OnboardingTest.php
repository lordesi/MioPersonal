<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_trainer_registration_page_renders()
    {
        $this->get(route('trainer.register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('onboarding/trainer-registration')
                ->where('submitted', false)
            );
    }

    public function test_trainers_can_create_their_account()
    {
        $response = $this->post(route('trainer.register.store'), [
            'first_name' => 'Giulia',
            'last_name' => 'Rossi',
            'email' => 'giulia@example.com',
            'password' => 'password',
            'terms' => '1',
        ]);

        $this->assertAuthenticated();
        $this->assertSame('Giulia Rossi', User::first()?->name);
        $this->assertSame(UserRole::Trainer, User::first()?->role);
        $response->assertRedirect(route('trainer.register', absolute: false));

        $this->get(route('trainer.register'))
            ->assertInertia(fn (Assert $page) => $page->where('submitted', true));
    }

    public function test_a_client_sees_their_account_in_the_trainer_registration()
    {
        $client = User::factory()->create(['name' => 'Luca Moretti']);

        $this->actingAs($client)
            ->get(route('trainer.register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('account.name', 'Luca Moretti')
                ->where('account.email', $client->email)
            );
    }

    public function test_a_client_becomes_a_trainer_with_the_same_account()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.store'), ['terms' => '1'])
            ->assertRedirect(route('trainer.register', absolute: false));

        $this->assertSame(UserRole::Trainer, $client->refresh()->role);
        $this->assertSame(1, User::count());

        $this->get(route('trainer.register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('submitted', true));
    }

    public function test_a_client_has_to_accept_the_trainer_terms()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->post(route('trainer.register.store'), [])
            ->assertSessionHasErrors('terms');

        $this->assertSame(UserRole::Client, $client->refresh()->role);
    }

    public function test_trainers_and_admins_are_sent_to_their_area()
    {
        $trainer = User::factory()->trainer()->create();
        $admin = User::factory()->admin()->create();

        $this->actingAs($trainer)->get(route('trainer.register'))->assertRedirect(route('trainer.today'));
        $this->actingAs($trainer)->post(route('trainer.register.store'), ['terms' => '1'])
            ->assertRedirect(route('trainer.today'));
        $this->actingAs($admin)->get(route('trainer.register'))->assertRedirect(route('admin.overview'));

        $this->assertSame(UserRole::Admin, $admin->refresh()->role);
    }

    public function test_trainer_registration_validates_the_account()
    {
        $this->post(route('trainer.register.store'), [
            'first_name' => '',
            'email' => 'not-an-email',
        ])->assertSessionHasErrors(['first_name', 'last_name', 'email', 'password', 'terms']);

        $this->assertGuest();
    }

    public function test_complete_profile_page_needs_login()
    {
        $this->get(route('client.complete-profile'))->assertRedirect(route('login'));

        $this->actingAs(User::factory()->create())
            ->get(route('client.complete-profile'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('onboarding/complete-profile'));
    }

    public function test_dashboard_sends_clients_to_their_bookings()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertRedirect(route('client.bookings'));
    }
}
