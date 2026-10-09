<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('account.settings'))->assertRedirect(route('login'));
    }

    public function test_page_splits_the_name_at_the_first_space()
    {
        $user = User::factory()->create(['name' => 'Lorenzo De Simone']);

        $this->actingAs($user)
            ->get(route('account.settings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/settings')
                ->where('account.firstName', 'Lorenzo')
                ->where('account.lastName', 'De Simone')
                ->where('account.email', $user->email)
                ->has('account.providers', 2)
                ->has('account.devices', 2)
            );
    }

    public function test_personal_data_joins_name_and_surname()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->patch(route('account.personal.update'), [
                'first_name' => ' Luca ',
                'last_name' => 'Moretti',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('account.settings'));

        $this->assertSame('Luca Moretti', $user->refresh()->name);
    }

    public function test_personal_data_requires_name_and_surname()
    {
        $this->actingAs(User::factory()->create())
            ->from(route('account.settings'))
            ->patch(route('account.personal.update'), ['first_name' => '', 'last_name' => ''])
            ->assertSessionHasErrors(['first_name', 'last_name']);
    }

    public function test_a_new_email_has_to_be_verified_again()
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->patch(route('account.email.update'), ['email' => 'nuovo@esempio.it'])
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('nuovo@esempio.it', $user->email);
        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_the_same_email_stays_verified()
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->patch(route('account.email.update'), ['email' => $user->email])
            ->assertSessionHasNoErrors();

        $this->assertNotNull($user->refresh()->email_verified_at);
        Notification::assertNothingSent();
    }

    public function test_email_must_not_belong_to_another_user()
    {
        $other = User::factory()->create();

        $this->actingAs(User::factory()->create())
            ->from(route('account.settings'))
            ->patch(route('account.email.update'), ['email' => $other->email])
            ->assertSessionHasErrors('email');
    }

    public function test_password_changes_with_the_current_one()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->put(route('account.password.update'), [
                'current_password' => 'password',
                'password' => 'una-nuova-password',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('account.settings'));

        $this->assertTrue(Hash::check('una-nuova-password', $user->refresh()->password));
    }

    public function test_password_does_not_change_with_a_wrong_current_one()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->put(route('account.password.update'), [
                'current_password' => 'sbagliata',
                'password' => 'una-nuova-password',
            ])
            ->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('password', $user->refresh()->password));
    }
}
