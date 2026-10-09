<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> route name => Inertia component */
    private const PAGES = [
        'admin.overview' => 'admin/overview',
        'admin.verification' => 'admin/verification',
        'admin.messages' => 'admin/messages',
        'admin.bookings' => 'admin/bookings',
        'admin.users' => 'admin/users',
        'admin.reviews' => 'admin/reviews',
        'admin.catalog' => 'admin/catalog',
        'admin.settings' => 'admin/settings',
    ];

    public function test_guests_are_redirected_to_the_login_page()
    {
        foreach (array_keys(self::PAGES) as $route) {
            $this->get(route($route))->assertRedirect(route('login'));
        }
    }

    public function test_clients_and_trainers_cannot_open_the_admin_panel()
    {
        $client = User::factory()->create();
        $trainer = User::factory()->create(['role' => UserRole::Trainer]);

        foreach ([$client, $trainer] as $user) {
            foreach (array_keys(self::PAGES) as $route) {
                $this->actingAs($user)->get(route($route))->assertForbidden();
            }
        }
    }

    public function test_new_users_are_clients()
    {
        $user = User::factory()->create();

        $this->assertSame(UserRole::Client, $user->fresh()->role);
        $this->assertFalse($user->isAdmin());
    }

    public function test_the_role_cannot_be_set_from_a_form()
    {
        $user = new User(['name' => 'Mario', 'email' => 'mario@example.com', 'role' => 'admin']);

        $this->assertSame(UserRole::Client, $user->role);
    }

    public function test_admins_see_every_page_with_the_menu_badges()
    {
        $this->actingAs(User::factory()->admin()->create());

        foreach (self::PAGES as $route => $component) {
            $this->get(route($route))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component($component)
                    ->whereType('adminArea.verificationCount', 'integer')
                    ->whereType('adminArea.unreadMessages', 'integer')
                    ->whereType('adminArea.flaggedReviews', 'integer')
                );
        }
    }

    public function test_the_admin_team_lists_the_real_admins_and_their_two_factor_status()
    {
        $admin = User::factory()->admin()->withTwoFactor()->create(['name' => 'Alessandro']);
        User::factory()->admin()->create(['name' => 'Socio']);
        User::factory()->create(['name' => 'Cliente']);

        $this->actingAs($admin)
            ->get(route('admin.settings'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('team', 2)
                ->where('team.0.name', 'Alessandro')
                ->where('team.0.twoFactorEnabled', true)
                ->where('team.1.name', 'Socio')
                ->where('team.1.twoFactorEnabled', false)
            );
    }

    public function test_the_admin_grant_command_turns_a_user_into_an_admin()
    {
        $user = User::factory()->create(['email' => 'team@example.com']);

        $this->artisan('admin:grant', ['email' => 'team@example.com'])->assertSuccessful();

        $this->assertTrue($user->fresh()->isAdmin());
    }

    public function test_the_admin_grant_command_fails_for_an_unknown_email()
    {
        $this->artisan('admin:grant', ['email' => 'nobody@example.com'])->assertFailed();
    }
}
