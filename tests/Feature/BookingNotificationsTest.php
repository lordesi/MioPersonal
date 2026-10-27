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

/** "Nuova richiesta di prenotazione" to the trainer, "Prenotazione confermata" to the client. */
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

    public function test_the_trainer_gets_the_request_to_answer()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create(['first_name' => 'Luca', 'last_name' => 'Moretti']);

        $this->book($trainer, $client);

        Notification::assertSentTo($trainer->user, BookingRequested::class, function (BookingRequested $notification) use ($trainer) {
            $mail = $notification->toMail($trainer->user);

            $this->assertSame('Nuova richiesta di prenotazione', $mail->subject);
            $this->assertContains('Luca Moretti ha chiesto una seduta con te.', $mail->introLines);
            // Saved in UTC, written in Rome time.
            $this->assertContains('Quando: lunedì 19 ottobre alle 18:00', $mail->introLines);
            $this->assertContains('Dove: Studio · Milano', $mail->introLines);
            // 24 hours to answer (confirm_hours).
            $this->assertContains('Rispondi entro martedì 20 ottobre alle 08:00: dopo, la richiesta scade e lo slot torna libero.', $mail->introLines);
            $this->assertSame(route('trainer.requests'), $mail->actionUrl);

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
            $mail = $notification->toMail($trainer->user);

            $this->assertSame('Nuova prenotazione confermata', $mail->subject);
            $this->assertSame(route('trainer.today'), $mail->actionUrl);

            return true;
        });
        Notification::assertSentTo($client, BookingConfirmed::class);
    }

    public function test_the_client_gets_the_confirmation_from_the_trainer()
    {
        $booking = Booking::factory()->create();
        /** @var User $client */
        $client = $booking->client;

        $this->actingAs($booking->trainerProfile->user)
            ->post(route('trainer.requests.accept', $booking))
            ->assertSessionHasNoErrors();

        Notification::assertSentTo($client, BookingConfirmed::class, function (BookingConfirmed $notification) use ($booking, $client) {
            $mail = $notification->toMail($client);

            $this->assertSame('Prenotazione confermata', $mail->subject);
            $this->assertContains("{$booking->trainerProfile->user->name} ha confermato la tua seduta.", $mail->introLines);
            $this->assertSame(route('client.home'), $mail->actionUrl);

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
