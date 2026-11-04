<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\City;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRequested;
use App\Support\BookingMailData;
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
            $html = (string) $mail->render();

            // Saved in UTC, written in Rome time.
            $this->assertSame('Nuova richiesta: Luca Moretti, lun 19 ott alle 18:00', $mail->subject);
            $this->assertStringContainsString('Luca Moretti vuole allenarsi con te', $html);
            $this->assertStringContainsString('18:00–19:00', $html);
            $this->assertStringContainsString('Luca Moretti · Studio · Milano', $html);
            $this->assertStringContainsString('Luca Moretti · nuovo cliente', $html);
            // 24 hours to answer (confirm_hours).
            $this->assertStringContainsString('mar 20 ott alle 08:00', $html);
            $this->assertStringContainsString(route('trainer.requests'), $html);

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
            $html = (string) $mail->render();

            $this->assertStringStartsWith('Nuova prenotazione: ', $mail->subject);
            $this->assertStringContainsString('Con la conferma automatica è già confermata', $html);
            $this->assertStringContainsString(route('trainer.today'), $html);

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
            $html = (string) $mail->render();

            // The factory's booking: tomorrow at 10:00 in Rome.
            $this->assertSame('Seduta confermata: mar 20 ott, 10:00', $mail->subject);
            $this->assertStringContainsString('La tua seduta è confermata', $html);
            $this->assertStringContainsString(e("con {$booking->trainerProfile->user->name} · Online"), $html);
            $this->assertStringContainsString('Cancellazione gratuita fino a', $html);
            $this->assertStringContainsString(route('client.home'), $html);

            return true;
        });
    }

    public function test_the_confirmation_shows_only_the_contacts_the_trainer_chose()
    {
        $booking = Booking::factory()->create();
        $trainer = $booking->trainerProfile;
        $trainer->update(['show_phone' => true, 'show_email' => false, 'arrival_notes' => 'Citofono Rossi, secondo piano.']);
        /** @var User $client */
        $client = $booking->client;

        $html = (string) (new BookingConfirmed($booking->fresh()))->toMail($client)->render();

        // "+393331234567" is written "+39 333 123 4567".
        $this->assertStringContainsString((string) BookingMailData::phone($trainer->user->phone), $html);
        $this->assertStringContainsString(' ', (string) BookingMailData::phone($trainer->user->phone));
        $this->assertStringNotContainsString($trainer->user->email, $html);
        $this->assertStringContainsString('Citofono Rossi, secondo piano.', $html);
    }

    public function test_a_returning_client_is_not_a_new_client()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create(['first_name' => 'Luca', 'last_name' => 'Moretti']);
        Booking::factory()->confirmed()->for($client, 'client')->for($trainer)->create();
        $request = Booking::factory()->for($client, 'client')->for($trainer)->create();

        $html = (string) (new BookingRequested($request))->toMail($trainer->user)->render();

        $this->assertStringContainsString('Luca Moretti vuole allenarsi con te', $html);
        $this->assertStringNotContainsString('nuovo cliente', $html);
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
