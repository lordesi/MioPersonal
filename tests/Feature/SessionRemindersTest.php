<?php

namespace Tests\Feature;

use App\Enums\BookingActor;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\SessionReminder;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use Tests\TestCase;

/** "bookings:remind": the day before and 2 hours before a confirmed session. */
class SessionRemindersTest extends TestCase
{
    use RefreshDatabase;

    /** Monday 19 October 2026, 10:00 in Rome. */
    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->now = CarbonImmutable::parse('2026-10-19 10:00', 'Europe/Rome');
        $this->travelTo($this->now);
    }

    /** Confirmed two days ago, starting `$minutes` from now. */
    private function confirmedSession(int $minutes, array $attributes = []): Booking
    {
        return Booking::factory()
            ->confirmed()
            ->at($this->now->addMinutes($minutes))
            ->create(['confirmed_at' => $this->now->subDays(2), ...$attributes]);
    }

    private function remind(): void
    {
        $this->artisan('bookings:remind')->assertSuccessful();
    }

    public function test_the_day_before_both_client_and_trainer_are_reminded_once()
    {
        // Tomorrow at 9:55: inside the 24 hours.
        $booking = $this->confirmedSession(23 * 60 + 55);

        $this->remind();
        $this->remind();

        Notification::assertSentToTimes($booking->client, SessionReminder::class, 1);
        Notification::assertSentToTimes($booking->trainerProfile->user, SessionReminder::class, 1);
        Notification::assertSentTo($booking->client, SessionReminder::class, fn (SessionReminder $reminder) => $reminder->kind === SessionReminder::DAY_BEFORE);
        $this->assertNotNull($booking->fresh()->reminded_day_before_at);
    }

    public function test_nothing_before_the_24_hours()
    {
        $this->confirmedSession(24 * 60 + 10);

        $this->remind();

        Notification::assertNothingSent();
    }

    public function test_two_hours_before_only_the_client_is_reminded()
    {
        $booking = $this->confirmedSession(90, ['reminded_day_before_at' => $this->now->subDay()]);
        // Push only: without a device the client gets nothing (no email 2 hours before).
        $booking->client?->updatePushSubscription('https://fcm.googleapis.com/fcm/send/abc', 'key', 'token', 'aes128gcm');

        $this->remind();

        Notification::assertSentTo($booking->client, SessionReminder::class, fn (SessionReminder $reminder) => $reminder->kind === SessionReminder::SOON);
        Notification::assertNotSentTo($booking->trainerProfile->user, SessionReminder::class);
    }

    public function test_a_session_confirmed_inside_the_window_gets_no_reminder()
    {
        // Booked this morning for tonight: the confirmation just arrived.
        $booking = $this->confirmedSession(10 * 60, ['confirmed_at' => $this->now->subHour()]);

        $this->remind();

        Notification::assertNothingSent();
        // Handled, so it's not looked at again.
        $this->assertNotNull($booking->fresh()->reminded_day_before_at);
    }

    public function test_requests_and_cancelled_sessions_get_no_reminder()
    {
        Booking::factory()->at($this->now->addHours(20))->create();
        $this->confirmedSession(20 * 60)->cancel(BookingActor::Client);

        $this->remind();

        Notification::assertNothingSent();
    }

    public function test_moving_the_session_brings_the_reminders_back()
    {
        $booking = $this->confirmedSession(20 * 60);
        $this->remind();

        $booking->refresh()->update(['starts_at' => $this->now->addHours(22)]);

        $this->assertNull($booking->fresh()->reminded_day_before_at);
    }

    public function test_the_bell_for_everyone_and_the_push_with_a_device_never_an_email()
    {
        $booking = $this->confirmedSession(20 * 60);
        /** @var User $client */
        $client = $booking->client;
        $trainer = $booking->trainerProfile->user;
        $client->updatePushSubscription('https://fcm.googleapis.com/fcm/send/abc', 'key', 'token', 'aes128gcm');

        $dayBefore = new SessionReminder($booking, SessionReminder::DAY_BEFORE);
        $soon = new SessionReminder($booking, SessionReminder::SOON);

        // The free plan of the mail provider has a daily limit: never an email, the bell for everyone.
        $this->assertSame(['database', WebPushChannel::class], $dayBefore->via($client->fresh()));
        $this->assertSame(['database'], $dayBefore->via($trainer));
        // Two hours before: push or nothing (in the bell it would be read too late).
        $this->assertSame([WebPushChannel::class], $soon->via($client->fresh()));
        $this->assertSame([], $soon->via($trainer));
    }

    public function test_nothing_to_who_turned_the_reminders_off()
    {
        $booking = $this->confirmedSession(20 * 60);
        /** @var User $client */
        $client = $booking->client;
        $client->forceFill(['notification_settings' => ['reminders' => false]])->save();

        $this->assertSame([], (new SessionReminder($booking, SessionReminder::DAY_BEFORE))->via($client->fresh()));
    }

    public function test_the_reminder_texts()
    {
        $booking = $this->confirmedSession(23 * 60, ['place_label' => 'Studio · Milano']);
        /** @var User $client */
        $client = $booking->client;
        $trainer = $booking->trainerProfile->user;
        $reminder = new SessionReminder($booking, SessionReminder::DAY_BEFORE);

        $this->assertSame([
            'title' => "Domani ti alleni con {$trainer->name}",
            'body' => 'Alle 09:00 · Studio · Milano',
            'url' => parse_url(route('client.bookings'), PHP_URL_PATH),
        ], $reminder->toArray($client));

        $push = $reminder->toWebPush($trainer)->toArray();
        $this->assertSame("Domani: seduta con {$client->publicName()}", $push['title']);
        $this->assertSame('Alle 09:00 · Seduta singola', $push['body']);
        $this->assertSame(route('trainer.today'), $push['data']['url']);
    }
}
