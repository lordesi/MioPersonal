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
                    ->whereType('adminArea.flaggedReviews', 'integer')
                    // "Messaggi" is in lavorazione: no badge.
                    ->missing('adminArea.unreadMessages')
                );
        }
    }

    public function test_settings_and_messages_have_no_content_for_now()
    {
        $this->actingAs(User::factory()->admin()->create());

        $this->get(route('admin.settings'))
            ->assertInertia(fn (Assert $page) => $page
                ->missing('team')
                ->missing('activity')
                ->missing('defaults')
            );

        $this->get(route('admin.messages'))
            ->assertInertia(fn (Assert $page) => $page
                ->missing('messages')
                ->where('contactEmail', config('mail.contact_address'))
            );
    }

    public function test_active_trainers_are_the_ones_active_in_the_last_24_hours()
    {
        User::factory()->trainer()->create(['last_active_at' => now()->subHours(2)]);
        User::factory()->trainer()->create(['last_active_at' => now()->subHours(23)]);
        User::factory()->trainer()->create(['last_active_at' => now()->subHours(25)]);
        User::factory()->trainer()->create(['last_active_at' => null]);
        // A client is not a trainer, even if active.
        User::factory()->create(['last_active_at' => now()]);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.overview'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.activeTrainers', 2)
                ->where('todo.reportedCount', 0)
                ->missing('todo.unreadMessages')
                ->missing('bookingsPerDay')
                ->missing('activity')
            );
    }

    public function test_activity_is_saved_at_most_every_few_minutes()
    {
        $this->freezeSecond();
        $user = User::factory()->create(['last_active_at' => null]);

        $this->actingAs($user)->get(route('account.settings'));
        $this->assertTrue($user->refresh()->last_active_at?->equalTo(now()));

        // Two minutes later: not written again.
        $this->travel(2)->minutes();
        $this->get(route('account.settings'));
        $this->assertTrue($user->refresh()->last_active_at?->equalTo(now()->subMinutes(2)));

        // After five minutes: written again.
        $this->travel(4)->minutes();
        $this->get(route('account.settings'));
        $this->assertTrue($user->refresh()->last_active_at?->equalTo(now()));
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
