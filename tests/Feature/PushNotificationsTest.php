<?php

namespace Tests\Feature;

use App\Enums\PushCategory;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRequested;
use Illuminate\Foundation\Testing\RefreshDatabase;
use NotificationChannels\WebPush\WebPushChannel;
use Tests\TestCase;

/** "Attiva le notifiche": the devices, and the booking notifications that use them. */
class PushNotificationsTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/device-1';

    /** @return array<string, mixed> */
    private function device(string $endpoint = self::ENDPOINT): array
    {
        return [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'BPublicKey', 'auth' => 'AuthToken'],
            'content_encoding' => 'aes128gcm',
        ];
    }

    public function test_a_device_is_saved_and_removed()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson(route('account.push.store'), $this->device())->assertNoContent();
        $this->assertTrue($user->hasPushDevices());

        $this->actingAs($user)->deleteJson(route('account.push.destroy'), ['endpoint' => self::ENDPOINT])->assertNoContent();
        $this->assertFalse($user->hasPushDevices());
    }

    public function test_the_apple_service_is_accepted()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('account.push.store'), $this->device('https://web.push.apple.com/QGuQyavXutnMfmo'))
            ->assertNoContent();
    }

    public function test_only_the_push_services_of_the_browsers()
    {
        $user = User::factory()->create();

        foreach (['https://127.0.0.1/hook', 'https://fcm.googleapis.com.evil.it/x', 'http://fcm.googleapis.com/fcm/send/1'] as $endpoint) {
            $this->actingAs($user)
                ->postJson(route('account.push.store'), $this->device($endpoint))
                ->assertJsonValidationErrors('endpoint');
        }

        $this->assertFalse($user->hasPushDevices());
    }

    public function test_guests_cannot_save_a_device()
    {
        $this->postJson(route('account.push.store'), $this->device())->assertUnauthorized();
    }

    public function test_the_device_follows_who_is_logged_in()
    {
        $first = User::factory()->create();
        $second = User::factory()->create();

        $this->actingAs($first)->postJson(route('account.push.store'), $this->device())->assertNoContent();
        $this->actingAs($second)->postJson(route('account.push.store'), $this->device())->assertNoContent();

        $this->assertFalse($first->hasPushDevices());
        $this->assertTrue($second->hasPushDevices());
    }

    public function test_booking_notifications_add_the_push_only_with_a_device()
    {
        $booking = Booking::factory()->confirmed()->create();
        /** @var User $client */
        $client = $booking->client;

        // The bell inside the site always, no email.
        $this->assertSame(['database'], (new BookingConfirmed($booking))->via($client));

        $client->updatePushSubscription(self::ENDPOINT, 'key', 'token', 'aes128gcm');

        $this->assertSame(['database', WebPushChannel::class], (new BookingConfirmed($booking))->via($client->fresh()));
    }

    public function test_the_push_of_a_new_request_has_no_full_name_nor_note()
    {
        $client = User::factory()->create(['first_name' => 'Luca', 'last_name' => 'Moretti']);
        $booking = Booking::factory()->for($client, 'client')->create(['client_note' => 'Nota privata']);

        $push = (new BookingRequested($booking))->toWebPush($booking->trainerProfile->user)->toArray();

        $this->assertSame('Nuova richiesta da confermare', $push['title']);
        $this->assertStringStartsWith('Luca M. · ', $push['body']);
        $this->assertStringNotContainsString('Nota privata', json_encode($push, JSON_THROW_ON_ERROR));
        $this->assertSame(route('trainer.requests'), $push['data']['url']);
    }

    public function test_the_reminders_switch_is_saved()
    {
        $user = User::factory()->create();
        $this->assertTrue($user->wantsReminders());

        $this->actingAs($user)
            ->patch(route('account.notifications.update'), ['reminders' => false])
            ->assertSessionHasNoErrors();

        $this->assertFalse($user->fresh()->wantsReminders());
    }

    public function test_a_kind_turned_off_stops_only_the_push()
    {
        $booking = Booking::factory()->confirmed()->create();
        /** @var User $client */
        $client = $booking->client;
        $client->updatePushSubscription(self::ENDPOINT, 'key', 'token', 'aes128gcm');
        $this->assertTrue($client->wantsPush(PushCategory::Bookings));

        $this->actingAs($client)
            ->patch(route('account.notifications.update'), ['push' => ['bookings' => false]])
            ->assertSessionHasNoErrors();

        $client = $client->fresh();
        $this->assertFalse($client->wantsPush(PushCategory::Bookings));
        $this->assertTrue($client->wantsReminders());
        // The bell inside the site stays.
        $this->assertSame(['database'], (new BookingConfirmed($booking))->via($client));
    }

    public function test_only_the_kinds_of_the_role_can_be_saved()
    {
        $client = User::factory()->create();

        $this->actingAs($client)
            ->patch(route('account.notifications.update'), ['push' => ['requests' => false]])
            ->assertSessionHasErrors('push');

        $this->assertTrue($client->fresh()->wantsPush(PushCategory::Requests));
    }

    public function test_a_gym_chooses_its_push_notifications()
    {
        $gym = User::factory()->gym()->create();

        $this->actingAs($gym)
            ->patch(route('account.notifications.update'), ['push' => ['gym_links' => false]])
            ->assertSessionHasNoErrors();

        $this->assertFalse($gym->fresh()->wantsPush(PushCategory::GymLinks));
        $this->assertTrue($gym->fresh()->wantsPush(PushCategory::Events));
    }

    public function test_the_app_icon_opens_the_users_area()
    {
        $this->get(route('pwa.start'))->assertRedirect(route('home'));

        $user = User::factory()->create();
        $this->actingAs($user)->get(route('pwa.start'))->assertRedirect(route($user->role->homeRoute()));
    }
}
