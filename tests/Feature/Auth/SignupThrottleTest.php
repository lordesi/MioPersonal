<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/** A bot must not create accounts, or send reset links, to thousands of addresses. */
class SignupThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_one_address_can_sign_up_at_most_10_times_an_hour()
    {
        for ($i = 0; $i < 10; $i++) {
            $this->post(route('register.store'), ['email' => "bot{$i}@example.com"])
                ->assertStatus(302);
        }

        $this->post(route('register.store'), ['email' => 'bot10@example.com'])
            ->assertTooManyRequests();
        $this->post(route('trainer.register.store'))->assertTooManyRequests();

        // Another address is not affected.
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->post(route('register.store'), ['email' => 'giulia@example.com'])
            ->assertStatus(302);
    }

    public function test_reset_links_are_limited_to_5_an_hour()
    {
        Notification::fake();
        $users = User::factory()->count(6)->create();

        foreach ($users->take(5) as $user) {
            $this->post(route('password.email'), ['email' => $user->email])->assertStatus(302);
        }

        $this->post(route('password.email'), ['email' => $users->last()->email])
            ->assertTooManyRequests();
    }

    public function test_the_pages_themselves_are_not_limited()
    {
        for ($i = 0; $i < 12; $i++) {
            $this->get(route('register'))->assertOk();
        }
    }
}
