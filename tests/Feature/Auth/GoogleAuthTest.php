<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Tests\TestCase;

/** "Continua con Google": Google itself is faked, no real request is made. */
class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.google.client_id' => 'test-client-id',
            'services.google.client_secret' => 'test-secret',
        ]);
    }

    public function test_the_button_is_shown_only_with_the_keys()
    {
        $this->get(route('login'))
            ->assertInertia(fn (Assert $page) => $page->where('googleEnabled', true));

        config(['services.google.client_id' => null]);

        $this->get(route('login'))
            ->assertInertia(fn (Assert $page) => $page->where('googleEnabled', false));
        $this->get(route('google.redirect'))->assertNotFound();
    }

    public function test_the_user_is_sent_to_google()
    {
        $this->get(route('google.redirect'))
            ->assertRedirectContains('accounts.google.com');
    }

    public function test_a_linked_account_logs_in()
    {
        $user = User::factory()->create();
        $user->forceFill(['google_id' => 'google-123'])->save();
        $this->fakeGoogle(email: 'altra@example.com');

        $this->get(route('google.callback'))
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
    }

    public function test_an_account_with_the_same_email_is_linked()
    {
        $user = User::factory()->unverified()->create(['email' => 'giulia@example.com']);
        $this->fakeGoogle(email: 'Giulia@Example.com');

        $this->get(route('google.callback'))
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
        $user->refresh();
        $this->assertSame('google-123', $user->google_id);
        $this->assertNotNull($user->email_verified_at);
    }

    /** Someone signed up with Giulia's email (never verified): their password must stop working. */
    public function test_linking_an_unverified_account_drops_the_password_and_its_sessions()
    {
        $user = User::factory()->unverified()->create(['email' => 'giulia@example.com', 'remember_token' => 'attacker-token']);
        DB::table('sessions')->insert([
            'id' => 'attacker-session', 'user_id' => $user->id, 'ip_address' => '10.0.0.1',
            'user_agent' => 'test', 'payload' => '', 'last_activity' => now()->timestamp,
        ]);
        $this->fakeGoogle();

        $this->get(route('google.callback'))
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($user);
        $user->refresh();
        $this->assertNull($user->password);
        $this->assertNotSame('attacker-token', $user->remember_token);
        $this->assertFalse(DB::table('sessions')->where('id', 'attacker-session')->exists());
    }

    public function test_linking_a_verified_account_keeps_the_password()
    {
        $user = User::factory()->create(['email' => 'giulia@example.com']);
        $this->fakeGoogle();

        $this->get(route('google.callback'));

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->password);
    }

    public function test_an_account_linked_to_another_google_account_is_not_taken_over()
    {
        $user = User::factory()->create(['email' => 'giulia@example.com']);
        $user->forceFill(['google_id' => 'google-other'])->save();
        $this->fakeGoogle();

        $this->get(route('google.callback'))->assertRedirect(route('login'));

        $this->assertGuest();
        $this->assertSame('google-other', $user->fresh()->google_id);
    }

    public function test_an_email_not_verified_by_google_is_not_linked()
    {
        User::factory()->create(['email' => 'giulia@example.com']);
        $this->fakeGoogle(verified: false);

        $this->get(route('google.callback'))->assertRedirect(route('login'));

        $this->assertGuest();
    }

    public function test_a_new_user_completes_the_sign_up()
    {
        $this->fakeGoogle();

        $this->get(route('google.callback'))->assertRedirect(route('google.register'));
        $this->assertGuest();

        $this->get(route('google.register'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/google-sign-up')
                ->where('email', 'giulia@example.com')
                ->where('firstName', 'Giulia')
                ->where('lastName', 'Rossi'));

        $this->post(route('google.register.store'), [
            'first_name' => 'Giulia',
            'last_name' => 'Rossi',
            'phone' => '347 521 8846',
            'terms' => '1',
        ])->assertRedirect(route('client.complete-profile', absolute: false));

        $user = User::where('email', 'giulia@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertSame(UserRole::Client, $user->role);
        $this->assertSame('google-123', $user->google_id);
        $this->assertNull($user->password);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertSame('+393475218846', $user->phone);
    }

    public function test_a_new_user_goes_back_to_the_page_that_asked_to_sign_up()
    {
        $this->fakeGoogle();
        // E.g. "Prenota" on the profile of the trainer who invited the client.
        $this->withSession(['url.intended' => url('/trainer/giulia-rossi/prenota')]);
        $this->get(route('google.callback'));

        $this->post(route('google.register.store'), [
            'first_name' => 'Giulia',
            'last_name' => 'Rossi',
            'phone' => '347 521 8846',
            'terms' => '1',
        ])->assertRedirect(url('/trainer/giulia-rossi/prenota'));
    }

    public function test_the_terms_must_be_accepted()
    {
        $this->fakeGoogle();
        $this->get(route('google.callback'));

        $this->post(route('google.register.store'), [
            'first_name' => 'Giulia',
            'last_name' => 'Rossi',
        ])->assertSessionHasErrors('terms');

        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_the_sign_up_page_needs_google_first()
    {
        $this->get(route('google.register'))->assertRedirect(route('register'));
        $this->post(route('google.register.store'), ['terms' => '1'])->assertRedirect(route('register'));
    }

    public function test_a_user_without_password_can_not_log_in_with_a_password()
    {
        $user = User::factory()->create(['password' => null]);

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'Password1',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_a_logged_in_user_links_google_from_the_settings()
    {
        $user = User::factory()->create();
        $this->fakeGoogle(email: 'altra@example.com');

        $this->actingAs($user)
            ->get(route('account.google.link'))
            ->assertRedirect()
            ->assertSessionHas('google_link', true);

        $this->get(route('google.callback'))
            ->assertRedirect(route('account.settings'));

        $this->assertSame('google-123', $user->refresh()->google_id);
        $this->assertFalse(session()->has('google_link'));
    }

    public function test_a_trainer_goes_back_to_the_trainer_settings()
    {
        $user = User::factory()->trainer()->create();
        $this->fakeGoogle();

        $this->actingAs($user)->get(route('account.google.link'));

        $this->get(route('google.callback'))
            ->assertRedirect(route('trainer.settings'));
    }

    public function test_a_google_account_of_someone_else_is_not_linked()
    {
        User::factory()->create()->forceFill(['google_id' => 'google-123'])->save();
        $user = User::factory()->create();
        $this->fakeGoogle();

        $this->actingAs($user)->get(route('account.google.link'));
        $this->get(route('google.callback'))->assertRedirect(route('account.settings'));

        $this->assertNull($user->refresh()->google_id);
    }

    public function test_a_logged_in_user_without_link_is_not_changed()
    {
        $user = User::factory()->create();
        $this->fakeGoogle();

        $this->actingAs($user)
            ->get(route('google.callback'))
            ->assertRedirect(route('dashboard'));

        $this->assertNull($user->refresh()->google_id);
    }

    public function test_google_is_unlinked_only_with_a_password()
    {
        $withoutPassword = User::factory()->create(['password' => null]);
        $withoutPassword->forceFill(['google_id' => 'google-1'])->save();

        $this->actingAs($withoutPassword)->delete(route('account.google.unlink'));
        $this->assertSame('google-1', $withoutPassword->refresh()->google_id);

        $withPassword = User::factory()->create();
        $withPassword->forceFill(['google_id' => 'google-2'])->save();

        $this->actingAs($withPassword)->delete(route('account.google.unlink'));
        $this->assertNull($withPassword->refresh()->google_id);
    }

    public function test_link_is_not_available_without_the_keys()
    {
        config(['services.google.client_id' => null]);

        $this->actingAs(User::factory()->create())
            ->get(route('account.google.link'))
            ->assertNotFound();
    }

    private function fakeGoogle(string $email = 'giulia@example.com', bool $verified = true): void
    {
        $user = (new GoogleUser)
            ->setRaw([
                'sub' => 'google-123',
                'email' => $email,
                'email_verified' => $verified,
                'given_name' => 'Giulia',
                'family_name' => 'Rossi',
            ])
            ->map([
                'id' => 'google-123',
                'name' => 'Giulia Rossi',
                'email' => $email,
            ]);

        Socialite::fake('google', $user);
    }
}
