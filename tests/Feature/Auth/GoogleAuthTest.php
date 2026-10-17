<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_an_email_not_verified_by_google_is_not_linked()
    {
        User::factory()->create(['email' => 'giulia@example.com']);
        $this->fakeGoogle(verified: false);

        $this->get(route('google.callback'))->assertRedirect(route('login'));

        $this->assertGuest();
    }

    public function test_two_factor_is_still_asked()
    {
        $user = User::factory()->withTwoFactor()->create();
        $user->forceFill(['google_id' => 'google-123'])->save();
        $this->fakeGoogle();

        $this->get(route('google.callback'))
            ->assertRedirect(route('two-factor.login'))
            ->assertSessionHas('login.id', $user->id);

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
            'phone' => '333 000 0000',
            'terms' => '1',
        ])->assertRedirect(route('client.complete-profile', absolute: false));

        $user = User::where('email', 'giulia@example.com')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertSame(UserRole::Client, $user->role);
        $this->assertSame('google-123', $user->google_id);
        $this->assertNull($user->password);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertSame('+393330000000', $user->phone);
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
