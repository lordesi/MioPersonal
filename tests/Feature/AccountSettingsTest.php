<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('account.settings'))->assertRedirect(route('login'));
    }

    public function test_page_shows_the_account()
    {
        $user = User::factory()->create(['first_name' => 'Lorenzo', 'last_name' => 'De Simone', 'phone' => '+393330000000']);

        $this->actingAs($user)
            ->get(route('account.settings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/settings')
                ->where('account.firstName', 'Lorenzo')
                ->where('account.lastName', 'De Simone')
                ->where('account.phone', '+393330000000')
                ->where('account.email', $user->email)
                ->where('account.hasPassword', true)
                ->where('account.passwordChangedAt', null)
                ->has('account.providers', 1)
                // Removed from the page: devices and notifications.
                ->missing('account.devices')
                ->missing('account.notifications')
            );
    }

    public function test_name_is_still_first_and_last_name_together()
    {
        $user = User::factory()->create(['name' => 'Lorenzo De Simone']);

        $this->assertSame('Lorenzo', $user->first_name);
        $this->assertSame('De Simone', $user->last_name);
        $this->assertSame('Lorenzo De Simone', $user->refresh()->name);
        $this->assertSame('Lorenzo De Simone', $user->toArray()['name']);
    }

    public function test_personal_data_saves_name_surname_and_phone()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->patch(route('account.personal.update'), [
                'first_name' => ' Luca ',
                'last_name' => 'Moretti',
                'phone' => '333 000 0000',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('account.settings'));

        $user->refresh();
        $this->assertSame('Luca', $user->first_name);
        $this->assertSame('Moretti', $user->last_name);
        $this->assertSame('+393330000000', $user->phone);
    }

    public function test_the_phone_can_not_be_removed()
    {
        $user = User::factory()->create(['phone' => '+393330000000']);

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->patch(route('account.personal.update'), ['first_name' => 'Luca', 'last_name' => 'Moretti', 'phone' => ''])
            ->assertSessionHasErrors('phone');

        $this->assertSame('+393330000000', $user->refresh()->phone);
    }

    public function test_the_phone_must_have_10_digits()
    {
        $user = User::factory()->create(['phone' => '+393330000000']);

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->patch(route('account.personal.update'), ['first_name' => 'Luca', 'last_name' => 'Moretti', 'phone' => '333 000 00000'])
            ->assertSessionHasErrors('phone');

        $this->assertSame('+393330000000', $user->refresh()->phone);
    }

    public function test_personal_data_requires_name_surname_and_phone()
    {
        $this->actingAs(User::factory()->create())
            ->from(route('account.settings'))
            ->patch(route('account.personal.update'), ['first_name' => '', 'last_name' => '', 'phone' => ''])
            ->assertSessionHasErrors(['first_name', 'last_name', 'phone']);
    }

    public function test_email_and_notifications_can_not_be_changed_anymore()
    {
        $this->actingAs(User::factory()->create())
            ->patch('/impostazioni/email', ['email' => 'nuovo@esempio.it'])
            ->assertNotFound();

        $this->patch('/impostazioni/notifiche', ['news' => true])->assertNotFound();
    }

    public function test_password_changes_with_the_current_one()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->put(route('account.password.update'), [
                'current_password' => 'password',
                'password' => 'Una-nuova-password1',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('account.settings'));

        $user->refresh();
        $this->assertTrue(Hash::check('Una-nuova-password1', $user->password));
        $this->assertNotNull($user->password_changed_at);
    }

    public function test_password_does_not_change_with_a_wrong_current_one()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->put(route('account.password.update'), [
                'current_password' => 'sbagliata',
                'password' => 'Una-nuova-password1',
            ])
            ->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('password', $user->refresh()->password));
    }

    public function test_password_needs_the_current_one()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.settings'))
            ->put(route('account.password.update'), ['password' => 'Una-nuova-password1'])
            ->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('password', $user->refresh()->password));
    }

    public function test_who_signed_up_with_google_sets_a_password_without_a_current_one()
    {
        $user = User::factory()->create(['password' => null]);

        $this->actingAs($user)
            ->get(route('account.settings'))
            ->assertInertia(fn (Assert $page) => $page->where('account.hasPassword', false));

        $this->from(route('account.settings'))
            ->put(route('account.password.update'), ['password' => 'Una-nuova-password1'])
            ->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('Una-nuova-password1', $user->refresh()->password));
    }

    /** "Elimina account" lists the trainers of the bookings that would be cancelled. */
    public function test_page_lists_the_trainers_of_the_future_bookings()
    {
        $client = User::factory()->create(['google_id' => '123']);
        $future = Booking::factory()->for($client, 'client')->confirmed()->create();
        Booking::factory()->for($client, 'client')->confirmed()
            ->at(CarbonImmutable::now()->subWeek())->create();

        $this->actingAs($client)
            ->get(route('account.settings'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pendingBookingTrainers', [$future->trainerProfile->user->name])
                ->where('account.providers.0', ['name' => 'Google', 'connected' => true])
            );
    }

    public function test_deleting_the_account_cancels_the_future_bookings_and_keeps_the_past_ones()
    {
        $client = User::factory()->create();
        $future = Booking::factory()->for($client, 'client')->create();
        $past = Booking::factory()->for($client, 'client')->confirmed()
            ->at(CarbonImmutable::now()->subWeek())->create();

        $this->actingAs($client)
            ->delete(route('profile.destroy'), ['password' => 'password'])
            ->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Cancelled, $future->refresh()->status);
        // The trainer keeps the past session, without the client.
        $this->assertSame(BookingStatus::Confirmed, $past->refresh()->status);
        $this->assertNull($past->client_id);
    }
}
