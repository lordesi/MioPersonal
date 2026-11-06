<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "Elimina account" of "Impostazioni account" (route `profile.destroy`), the
 * only route left of the starter kit settings: its English pages are gone.
 */
class DeleteAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_delete_their_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete(route('profile.destroy'), [
                'password' => 'password',
                'confirmation' => 'ELIMINA',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('home'));

        $this->assertGuest();
        // Deleted for good 30 days later (AccountModerationTest).
        $this->assertTrue($user->fresh()->hasPendingSelfDeletion());
    }

    public function test_correct_password_must_be_provided_to_delete_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from(route('account.settings'))
            ->delete(route('profile.destroy'), [
                'password' => 'wrong-password',
                'confirmation' => 'ELIMINA',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect(route('account.settings'));

        $this->assertNotNull($user->fresh());
    }

    public function test_the_english_settings_pages_of_the_starter_kit_are_gone()
    {
        $user = User::factory()->create();

        foreach (['/settings', '/settings/profile', '/settings/security', '/two-factor-challenge', '/.well-known/passkey-endpoints'] as $url) {
            $this->actingAs($user)->get($url)->assertNotFound();
        }
    }
}
