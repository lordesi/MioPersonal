<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class RegistrationCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_new_email_is_fine()
    {
        $this->check('email', 'nuovo@example.com')
            ->assertOk()
            ->assertExactJson(['error' => null, 'taken' => false]);
    }

    public function test_an_email_with_an_account_is_taken()
    {
        User::factory()->create(['email' => 'luca@example.com']);

        // Same account with capitals and spaces, as in the sign-up.
        $this->check('email', ' Luca@Example.com ')
            ->assertOk()
            ->assertJson(['error' => 'Esiste già un account con questa email.', 'taken' => true]);
    }

    public function test_a_wrong_email_gets_the_sign_up_error()
    {
        $this->check('email', 'luca@example')
            ->assertOk()
            ->assertJson(['taken' => false])
            ->assertJsonPath('error', 'Inserisci un’email valida, es. nome@esempio.it.');
    }

    public function test_a_real_new_phone_is_fine()
    {
        $this->check('phone', '3475218846')
            ->assertOk()
            ->assertExactJson(['error' => null, 'taken' => false]);
    }

    public function test_a_fake_phone_gets_an_error()
    {
        $this->check('phone', '9999999999')
            ->assertOk()
            ->assertJson(['error' => 'Inserisci un numero di cellulare reale, es. 347 521 8846.', 'taken' => false]);
    }

    public function test_a_phone_with_an_account_is_taken()
    {
        User::factory()->create(['phone' => '+393475218846']);

        $this->check('phone', '347 521 8846')
            ->assertOk()
            ->assertJson(['error' => 'Esiste già un account con questo numero.', 'taken' => true]);
    }

    public function test_only_email_and_phone_can_be_checked()
    {
        $this->postJson(route('register.check'), ['field' => 'password', 'value' => 'x'])
            ->assertUnprocessable();
    }

    public function test_logged_in_users_are_sent_away()
    {
        $this->actingAs(User::factory()->create());

        $this->check('email', 'nuovo@example.com')->assertRedirect();
    }

    public function test_the_checks_are_limited()
    {
        for ($i = 0; $i < 20; $i++) {
            $this->check('email', "persona{$i}@example.com")->assertOk();
        }

        $this->check('email', 'ancora@example.com')->assertTooManyRequests();
    }

    private function check(string $field, string $value): TestResponse
    {
        return $this->postJson(route('register.check'), ['field' => $field, 'value' => $value]);
    }
}
