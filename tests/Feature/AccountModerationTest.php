<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Sospendi" and "Cancella dati" of Admin · Utenti, and "Elimina account" of
 * the settings: blocked right away, deleted 30 days later (users:purge-deleted).
 */
class AccountModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_admin_suspends_and_reactivates_a_user(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->create();

        $this->actingAs($admin)->post(route('admin.users.suspend', $client))->assertRedirect();
        $this->assertNotNull($client->fresh()->suspended_at);

        $this->actingAs($admin)->delete(route('admin.users.reactivate', $client))->assertRedirect();
        $this->assertNull($client->fresh()->suspended_at);
    }

    public function test_the_admin_deletes_a_trainer_profile_and_the_account_stays_as_a_client(): void
    {
        $admin = User::factory()->admin()->create();
        $profile = TrainerProfile::factory()->approved()->bookable()->create();
        $trainer = $profile->user;

        $this->actingAs($admin)->delete(route('admin.users.trainer-profile', $trainer))->assertRedirect();

        $this->assertModelMissing($profile);
        $this->assertSame(UserRole::Client, $trainer->fresh()->role);
        // Nothing left to delete.
        $this->actingAs($admin)->delete(route('admin.users.trainer-profile', $trainer))->assertNotFound();
    }

    public function test_only_the_team_deletes_a_trainer_profile_and_never_an_admin_one(): void
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $otherAdmin = User::factory()->admin()->create();
        $adminProfile = TrainerProfile::factory()->for($otherAdmin)->approved()->create();

        $this->actingAs(User::factory()->create())->delete(route('admin.users.trainer-profile', $profile->user))->assertForbidden();
        $this->actingAs(User::factory()->admin()->create())->delete(route('admin.users.trainer-profile', $otherAdmin))->assertForbidden();

        $this->assertModelExists($profile);
        $this->assertModelExists($adminProfile);
    }

    public function test_the_command_deletes_the_trainer_profile_of_an_admin(): void
    {
        $admin = User::factory()->admin()->create(['email' => 'team@example.com']);
        $profile = TrainerProfile::factory()->for($admin)->approved()->create();

        $this->artisan('trainer:delete-profile', ['email' => 'team@example.com'])
            ->expectsConfirmation("Delete the trainer profile of {$admin->name} with its services, hours, photos, bookings and reviews? It can't be undone.", 'yes')
            ->assertSuccessful();

        $this->assertModelMissing($profile);
        $this->assertTrue($admin->fresh()->isAdmin());

        $this->artisan('trainer:delete-profile', ['email' => 'team@example.com'])->assertFailed();
    }

    public function test_a_suspended_user_cannot_log_in(): void
    {
        $client = User::factory()->create(['suspended_at' => now()]);

        $this->post(route('login.store'), ['email' => $client->email, 'password' => 'password'])
            ->assertSessionHasErrors(['email' => 'Il tuo account è sospeso. Per informazioni scrivi a '.config('mail.contact_address').'.']);

        $this->assertGuest();
    }

    public function test_a_suspended_user_with_an_open_session_is_logged_out(): void
    {
        $client = User::factory()->create();
        $this->actingAs($client)->get(route('account.settings'))->assertOk();

        $client->forceFill(['suspended_at' => now()])->save();

        $this->actingAs($client)->get(route('account.settings'))
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_a_suspended_trainer_is_out_of_the_search_and_the_profile(): void
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->create();
        $this->get(route('trainers.show', $profile->slug))->assertOk();

        $profile->user->forceFill(['suspended_at' => now()])->save();

        $this->assertFalse(TrainerProfile::query()->published()->whereKey($profile->id)->exists());
        $this->get(route('trainers.show', $profile->slug))->assertNotFound();
        // The team still sees it.
        $this->actingAs(User::factory()->admin()->create())->get(route('trainers.show', $profile->slug))->assertOk();
    }

    public function test_the_team_cannot_suspend_or_delete_an_admin_and_others_cannot_at_all(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->admin()->create();
        $client = User::factory()->create();

        $this->actingAs($admin)->post(route('admin.users.suspend', $other))->assertForbidden();
        $this->actingAs($admin)->post(route('admin.users.deletion.schedule', $other))->assertForbidden();
        $this->actingAs($client)->post(route('admin.users.suspend', $admin))->assertForbidden();

        $this->assertNull($other->fresh()->suspended_at);
        $this->assertNull($admin->fresh()->suspended_at);
    }

    public function test_the_team_deletes_the_data_30_days_later(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->create();
        $booking = Booking::factory()->confirmed()->create(['client_id' => $client->id]);

        $this->actingAs($admin)->post(route('admin.users.deletion.schedule', $client))->assertRedirect();

        $client->refresh();
        $this->assertTrue($client->isBlocked());
        // The future session is cancelled at once.
        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);

        // The user can't take it back: they can't even log in.
        Auth::logout();
        $this->post(route('login.store'), ['email' => $client->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->travel(29)->days();
        $this->artisan('users:purge-deleted')->assertSuccessful();
        $this->assertNotNull($client->fresh());

        $this->travel(2)->days();
        $this->artisan('users:purge-deleted')->assertSuccessful();
        $this->assertNull($client->fresh());
        // The booking stays for the trainer, without the client.
        $this->assertNull($booking->fresh()->client_id);
    }

    public function test_the_team_can_take_a_deletion_back(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->create();

        $this->actingAs($admin)->post(route('admin.users.deletion.schedule', $client));
        $this->actingAs($admin)->delete(route('admin.users.deletion.cancel', $client))->assertRedirect();

        $this->assertNull($client->fresh()->deletion_scheduled_at);
        $this->assertFalse($client->fresh()->isBlocked());
    }

    public function test_a_trainer_deleted_by_the_team_cancels_the_sessions_of_the_clients(): void
    {
        $admin = User::factory()->admin()->create();
        $profile = TrainerProfile::factory()->approved()->bookable()->create();
        $booking = Booking::factory()->confirmed()->create(['trainer_profile_id' => $profile->id]);

        $this->actingAs($admin)->post(route('admin.users.deletion.schedule', $profile->user));

        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
        $this->assertFalse(TrainerProfile::query()->published()->whereKey($profile->id)->exists());
    }

    public function test_the_user_deletes_the_account_and_takes_it_back_by_logging_in(): void
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->delete(route('profile.destroy'), ['password' => 'password', 'confirmation' => 'ELIMINA'])
            ->assertRedirect(route('home'));
        $this->assertGuest();
        $this->assertTrue($client->fresh()->hasPendingSelfDeletion());

        // Logging in works, but every page sends to "Account in eliminazione".
        $this->post(route('login.store'), ['email' => $client->email, 'password' => 'password']);
        $this->assertAuthenticatedAs($client);

        $this->get(route('account.settings'))->assertRedirect(route('account.deletion'));
        $this->get(route('account.deletion'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('auth/account-deletion')
            ->where('deletionDate', now('Europe/Rome')->addDays(30)->toDateString()));

        $this->delete(route('account.deletion.cancel'))->assertRedirect('/');
        $this->assertNull($client->fresh()->deletion_scheduled_at);
        $this->get(route('account.settings'))->assertOk();
    }

    public function test_the_account_of_the_user_is_deleted_after_30_days(): void
    {
        $client = User::factory()->create();

        $this->actingAs($client)->delete(route('profile.destroy'), ['password' => 'password', 'confirmation' => 'ELIMINA']);

        $this->travel(31)->days();
        $this->artisan('users:purge-deleted')->assertSuccessful();

        $this->assertNull($client->fresh());
    }
}
