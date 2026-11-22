<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureSessionCurrent;
use App\Models\User;
use App\Support\EndSessions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Sessions ended from another device, whatever the session driver (Redis in production). */
class EnsureSessionCurrentTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_session_without_a_version_works_while_nothing_was_revoked()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('client.home'));

        $this->assertAuthenticatedAs($user);
    }

    public function test_the_login_writes_the_current_version_in_the_session()
    {
        $user = User::factory()->create();
        $user->forceFill(['session_version' => 3])->save();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertSessionHas(EnsureSessionCurrent::KEY, 3);

        $this->get(route('dashboard'))->assertRedirect(route('client.home'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_every_session_ends_once_they_are_revoked()
    {
        $user = User::factory()->create();

        EndSessions::all($user);

        $this->assertSame(1, $user->fresh()->session_version);
        $this->assertOtherDeviceLoggedOut($user);
    }

    /** An account made with Google has no password: Laravel's AuthenticateSession would skip it. */
    public function test_an_account_without_a_password_is_logged_out_too()
    {
        $user = User::factory()->create(['password' => null]);

        EndSessions::all($user);

        $this->assertOtherDeviceLoggedOut($user);
    }

    public function test_a_logged_out_session_answers_401_to_json_requests()
    {
        $user = User::factory()->create();
        $user->forceFill(['session_version' => 1])->save();

        $this->actingAs($user)
            ->withSession([EnsureSessionCurrent::KEY => 0])
            ->getJson(route('notifications.index'))
            ->assertUnauthorized();
    }
}
