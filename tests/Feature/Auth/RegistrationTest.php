<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
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
        $response = $this->post(route('register.store'), [
            'first_name' => 'Luca',
            'last_name' => 'Moretti',
            'email' => 'test@example.com',
            'password' => 'password',
            'terms' => '1',
        ]);

        $this->assertAuthenticated();
        $this->assertSame('Luca Moretti', User::first()?->name);
        $response->assertRedirect(route('client.complete-profile', absolute: false));
    }

    public function test_terms_must_be_accepted()
    {
        $this->post(route('register.store'), [
            'first_name' => 'Luca',
            'last_name' => 'Moretti',
            'email' => 'test@example.com',
            'password' => 'password',
        ])->assertSessionHasErrors('terms');

        $this->assertGuest();
    }
}
