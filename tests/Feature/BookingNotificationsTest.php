<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\City;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRequested;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/** "Nuova richiesta di prenotazione" to the trainer, "Prenotazione confermata" to the client: the bell and the push, no email. */
class BookingNotificationsTest extends TestCase
{
    use RefreshDatabase;

    /** Monday 19 October 2026, 18:00 in Rome (summer time, UTC+2). */
    private const SLOT = '2026-10-19T16:00:00Z';

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));
    }

    private function trainer(array $attributes = []): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->bookable()
            ->inCity(City::factory()->create(['name' => 'Milano']))
            ->create($attributes);
    }

    private function book(TrainerProfile $trainer, User $client): void
    {
        $this->actingAs($client)->post(route('trainers.book', $trainer->slug), [
            'service_id' => $trainer->services()->where('minutes', 60)->value('id'),
            'start' => self::SLOT,
            'minutes' => 60,
        ])->assertSessionHasNoErrors();
    }

    public function test_the_trainer_gets_the_request_in_the_bell_not_by_email()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create(['first_name' => 'Luca', 'last_name' => 'Moretti']);

        $this->book($trainer, $client);

        Notification::assertSentTo($trainer->user, BookingRequested::class, function (BookingRequested $notification) use ($trainer) {
            // The bell and the push: an email for every request would use the daily limit of the mail provider.
            $this->assertSame(['database'], $notification->via($trainer->user));

            // Saved in UTC, written in Rome time; the same text of the push (first name and initial only).
            $this->assertSame([
                'title' => 'Nuova richiesta da confermare',
                'body' => 'Luca M. · lun 19 ott alle 18:00',
                'url' => parse_url(route('trainer.requests'), PHP_URL_PATH),
            ], $notification->toArray($trainer->user));

            return true;
        });
        // Not confirmed yet: nothing to the client.
        Notification::assertNotSentTo($client, BookingConfirmed::class);
    }

    public function test_with_automatic_confirmation_both_get_the_confirmed_booking()
    {
        $trainer = $this->trainer(['auto_confirm' => true]);
        $client = User::factory()->create();

        $this->book($trainer, $client);

        Notification::assertSentTo($trainer->user, BookingRequested::class, function (BookingRequested $notification) use ($trainer) {
            $data = $notification->toArray($trainer->user);

            $this->assertSame('Nuova prenotazione', $data['title']);
            $this->assertSame(parse_url(route('trainer.today'), PHP_URL_PATH), $data['url']);

            return true;
        });
        Notification::assertSentTo($client, BookingConfirmed::class);
    }

    public function test_the_client_gets_the_confirmation_from_the_trainer_in_the_bell()
    {
        $booking = Booking::factory()->create();
        /** @var User $client */
        $client = $booking->client;

        $this->actingAs($booking->trainerProfile->user)
            ->post(route('trainer.requests.accept', $booking))
            ->assertSessionHasNoErrors();

        Notification::assertSentTo($client, BookingConfirmed::class, function (BookingConfirmed $notification) use ($booking, $client) {
            $this->assertSame(['database'], $notification->via($client));

            // The factory's booking: tomorrow at 10:00 in Rome.
            $this->assertSame([
                'title' => 'Seduta confermata',
                'body' => "Con {$booking->trainerProfile->user->name} · mar 20 ott alle 10:00",
                'url' => parse_url(route('client.bookings'), PHP_URL_PATH),
            ], $notification->toArray($client));

            return true;
        });
    }

    public function test_no_confirmation_when_the_request_is_declined_or_expires()
    {
        $declined = Booking::factory()->create();
        $this->actingAs($declined->trainerProfile->user)
            ->post(route('trainer.requests.decline', $declined))
            ->assertSessionHasNoErrors();

        $expired = Booking::factory()->create();
        $expired->expire();

        Notification::assertNothingSent();
    }
}
