<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Fortify\Features;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), $this->validData());

        $this->assertAuthenticated();
        $response->assertRedirect(route('client.complete-profile', absolute: false));

        $user = User::firstOrFail();
        $this->assertSame('Luca', $user->first_name);
        $this->assertSame('Moretti', $user->last_name);
        $this->assertSame('Luca Moretti', $user->name);
        $this->assertSame('+393475218846', $user->phone);
        $this->assertNotNull($user->terms_accepted_at);
        // No "novità via email" checkbox any more.
        $this->assertNull($user->marketing_opt_in_at);
    }

    public function test_new_users_get_the_email_to_verify_their_address()
    {
        Notification::fake();

        $this->post(route('register.store'), $this->validData())->assertSessionHasNoErrors();

        Notification::assertSentTo(User::firstOrFail(), VerifyEmail::class);
    }

    public function test_the_prefix_is_always_plus_39()
    {
        // The "Prefisso" box can't be changed: a prefix sent anyway is ignored.
        $this->post(route('register.store'), $this->validData([
            'last_name' => 'De Simone',
            'phone_prefix' => '+41',
            'phone' => '347 521 8846',
        ]))->assertSessionHasNoErrors();

        $user = User::firstOrFail();
        $this->assertSame('De Simone', $user->last_name);
        // Saved without spaces.
        $this->assertSame('+393475218846', $user->phone);
    }

    public function test_the_phone_is_required()
    {
        $this->post(route('register.store'), $this->validData([
            'phone' => '',
        ]))->assertSessionHasErrors('phone');

        $this->assertGuest();
    }

    public function test_a_phone_with_an_account_is_rejected()
    {
        User::factory()->create(['phone' => '+393475218846']);

        $this->post(route('register.store'), $this->validData([
            'phone' => '347 521 8846',
        ]))->assertSessionHasErrors(['phone' => 'Esiste già un account con questo numero.']);

        $this->assertGuest();
    }

    public function test_the_email_is_saved_in_lowercase()
    {
        $this->post(route('register.store'), $this->validData([
            'email' => ' Luca.Moretti@Example.com ',
        ]))->assertSessionHasNoErrors();

        $this->assertSame('luca.moretti@example.com', User::firstOrFail()->email);
    }

    /**
     * @return array<string, array{string, string, string}>
     */
    public static function wrongValues(): array
    {
        return [
            'email without a dot in the domain' => ['email', 'luca@example', 'email'],
            'email without @' => ['email', 'luca.example.com', 'email'],
            'phone with letters' => ['phone', 'chiamami', 'phone'],
            'phone too short' => ['phone', '12345', 'phone'],
            'phone with 9 digits' => ['phone', '333 000 000', 'phone'],
            'phone with 11 digits' => ['phone', '333 000 00000', 'phone'],
            'phone with the prefix inside' => ['phone', '+39 333 000 0000', 'phone'],
            'phone that is not a mobile' => ['phone', '999 999 9999', 'phone'],
            'phone with the same digit' => ['phone', '333 333 3333', 'phone'],
            'password too short' => ['password', 'Pass1', 'password'],
            'password without a capital letter' => ['password', 'password1', 'password'],
            'password without a lowercase letter' => ['password', 'PASSWORD1', 'password'],
            'password without a number' => ['password', 'Passwordd', 'password'],
        ];
    }

    #[DataProvider('wrongValues')]
    public function test_wrong_values_are_rejected(string $field, string $value, string $error)
    {
        $this->post(route('register.store'), $this->validData([
            $field => $value,
        ]))->assertSessionHasErrors($error);

        $this->assertGuest();
    }

    public function test_terms_must_be_accepted()
    {
        $this->post(route('register.store'), $this->validData(['terms' => null]))
            ->assertSessionHasErrors('terms');

        $this->assertGuest();
    }

    /**
     * @param  array<string, string|null>  $overrides
     * @return array<string, string|null>
     */
    private function validData(array $overrides = []): array
    {
        return [
            'first_name' => 'Luca',
            'last_name' => 'Moretti',
            'email' => 'test@example.com',
            'phone' => '347 521 8846',
            'password' => 'Password1',
            'terms' => '1',
            ...$overrides,
        ];
    }
}
