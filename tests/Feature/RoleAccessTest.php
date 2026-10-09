<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Each area opens only for its role; anyone else is sent to their own area. */
class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private const CLIENT_PAGES = [
        'client.bookings',
        'client.favorites',
        'account.settings',
        'client.complete-profile',
    ];

    /** @var list<string> */
    private const TRAINER_PAGES = [
        'trainer.today',
        'trainer.calendar',
        'trainer.clients',
        'trainer.availability',
        'trainer.reviews',
        'trainer.settings',
    ];

    public function test_clients_open_their_pages_but_not_the_trainer_area()
    {
        $this->actingAs(User::factory()->create());

        foreach (self::CLIENT_PAGES as $route) {
            $this->get(route($route))->assertOk();
        }

        foreach (self::TRAINER_PAGES as $route) {
            $this->get(route($route))->assertRedirect(route('client.bookings'));
        }
    }

    public function test_trainers_open_their_area_but_not_the_client_pages()
    {
        $this->actingAs(User::factory()->trainer()->create());

        foreach (self::TRAINER_PAGES as $route) {
            $this->get(route($route))->assertOk();
        }

        foreach (self::CLIENT_PAGES as $route) {
            $this->get(route($route))->assertRedirect(route('trainer.today'));
        }

        $this->get(route('client.bookings.sent', 1))->assertRedirect(route('trainer.today'));
    }

    public function test_admins_are_sent_to_the_admin_panel()
    {
        $this->actingAs(User::factory()->admin()->create());

        foreach ([...self::CLIENT_PAGES, ...self::TRAINER_PAGES] as $route) {
            $this->get(route($route))->assertRedirect(route('admin.overview'));
        }
    }

    public function test_trainers_save_their_account_from_the_settings_page()
    {
        $trainer = User::factory()->trainer()->create();

        $this->actingAs($trainer)
            ->from(route('trainer.settings'))
            ->patch(route('account.personal.update'), [
                'first_name' => 'Giulia',
                'last_name' => 'Rossi',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('trainer.settings'));

        $this->assertSame('Giulia Rossi', $trainer->refresh()->name);
    }
}
