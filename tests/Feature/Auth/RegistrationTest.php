<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $this->assertSame('+393330000000', $user->phone);
        $this->assertNotNull($user->terms_accepted_at);
        // No "novità via email" checkbox any more.
        $this->assertNull($user->marketing_opt_in_at);
    }

    public function test_prefix_and_phone_are_saved_together()
    {
        $this->post(route('register.store'), $this->validData([
            'last_name' => 'De Simone',
            'phone_prefix' => '+41',
            'phone' => '333 000 0000',
        ]))->assertSessionHasNoErrors();

        $user = User::firstOrFail();
        $this->assertSame('De Simone', $user->last_name);
        // Saved without spaces.
        $this->assertSame('+413330000000', $user->phone);
    }

    public function test_the_phone_is_required()
    {
        $this->post(route('register.store'), $this->validData([
            'phone_prefix' => '+39',
            'phone' => '',
        ]))->assertSessionHasErrors('phone');

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
            'phone with the prefix inside' => ['phone', '+39 333 000 0000', 'phone'],
            'prefix without +' => ['phone_prefix', '39', 'phone_prefix'],
            'prefix too long' => ['phone_prefix', '+12345', 'phone_prefix'],
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

    public function test_a_phone_needs_a_prefix()
    {
        $this->post(route('register.store'), $this->validData([
            'phone_prefix' => '',
            'phone' => '333 000 0000',
        ]))->assertSessionHasErrors('phone_prefix');

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
            'phone_prefix' => '+39',
            'phone' => '333 000 0000',
            'password' => 'Password1',
            'terms' => '1',
            ...$overrides,
        ];
    }
}
