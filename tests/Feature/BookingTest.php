<?php

namespace Tests\Feature;

use App\Actions\Bookings\CreateBooking;
use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\City;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** "Prenota questo slot" from the profile, and "Annulla" from "Le mie prenotazioni". */
class BookingTest extends TestCase
{
    use RefreshDatabase;

    /** Monday 19 October 2026, 18:00 in Rome (summer time, UTC+2). */
    private const SLOT = '2026-10-19T16:00:00Z';

    protected function setUp(): void
    {
        parent::setUp();

        // Monday morning: the evening slots are free.
        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));
    }

    private function trainer(array $attributes = []): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->bookable()
            ->inCity(City::factory()->create(['name' => 'Milano']))
            ->create($attributes);
    }

    /** @return array<string, mixed> */
    private function request(TrainerProfile $trainer, array $data = []): array
    {
        return [
            'service_id' => $trainer->services()->value('id'),
            'start' => self::SLOT,
            'minutes' => 60,
            ...$data,
        ];
    }

    public function test_a_client_books_a_free_slot()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create();

        $response = $this->actingAs($client)->post(route('trainers.book', $trainer->slug), $this->request($trainer, ['minutes' => 120]));

        $booking = Booking::sole();
        $response->assertRedirect(route('client.bookings.sent', $booking));

        $this->assertSame($client->id, $booking->client_id);
        $this->assertSame(BookingStatus::Pending, $booking->status);
        $this->assertSame(self::SLOT, $booking->starts_at->utc()->format('Y-m-d\TH:i:s\Z'));
        $this->assertSame(120, (int) $booking->starts_at->diffInMinutes($booking->ends_at));
        // 40 € per hour × 2 hours, in cents.
        $this->assertSame(8000, $booking->price_cents);
        $this->assertSame('Seduta singola', $booking->service_name);
        $this->assertSame('Studio · Milano', $booking->place_label);
        // The trainer answers within confirm_hours (24 by default).
        $this->assertTrue($booking->expires_at->equalTo(now()->addHours(24)));
        $this->assertSame(['requested'], $booking->events()->pluck('type')->all());

        // The slot is taken now.
        $this->assertFalse(TrainerSlots::isFree($trainer->refresh(), CarbonImmutable::parse(self::SLOT), 60));
    }

    public function test_clients_can_book_before_verifying_the_email()
    {
        $trainer = $this->trainer();

        $this->actingAs(User::factory()->unverified()->create())
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer))
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Booking::count());
    }

    public function test_the_same_slot_can_be_booked_only_once()
    {
        $trainer = $this->trainer();

        $this->actingAs(User::factory()->create())->post(route('trainers.book', $trainer->slug), $this->request($trainer));

        $this->actingAs(User::factory()->create())
            ->from(route('trainers.show', $trainer->slug))
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer))
            ->assertRedirect(route('trainers.show', $trainer->slug))
            ->assertSessionHasErrors(['start' => CreateBooking::SLOT_TAKEN]);

        $this->assertSame(1, Booking::count());
    }

    public function test_only_free_slots_and_offered_durations_can_be_booked()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create();

        // 10:00 is outside the working hours (18–21).
        $this->actingAs($client)
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer, ['start' => '2026-10-19T08:00:00Z']))
            ->assertSessionHasErrors('start');

        // The factory offers 1 and 2 hours: 45 minutes is not one of them.
        $this->actingAs($client)
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer, ['minutes' => 45]))
            ->assertSessionHasErrors('minutes');

        // Another trainer's service.
        $this->actingAs($client)
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer, ['service_id' => $this->trainer()->services()->value('id')]))
            ->assertSessionHasErrors('service_id');

        $this->assertSame(0, Booking::count());
    }

    public function test_a_trainer_with_automatic_confirmation_is_booked_at_once()
    {
        $trainer = $this->trainer(['auto_confirm' => true]);

        $this->actingAs(User::factory()->create())->post(route('trainers.book', $trainer->slug), $this->request($trainer));

        $booking = Booking::sole();
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertNull($booking->expires_at);
        $this->assertSame(['requested', 'confirmed'], $booking->events()->orderBy('id')->pluck('type')->all());
    }

    public function test_a_trainer_not_accepting_new_clients_can_only_be_booked_again()
    {
        $trainer = $this->trainer(['accepts_new_clients' => false]);
        $known = User::factory()->create();
        Booking::factory()->for($trainer)->for($known, 'client')->confirmed()
            ->at(CarbonImmutable::parse('2026-10-12 18:00', 'Europe/Rome'))->create();

        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer))
            ->assertSessionHasErrors('start');

        $this->actingAs($known)
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer))
            ->assertSessionHasNoErrors();
    }

    public function test_guests_go_through_the_login_and_come_back_to_their_slot()
    {
        $trainer = $this->trainer();
        $choice = ['servizio' => 1, 'durata' => 60, 'inizio' => self::SLOT];

        $this->post(route('trainers.book', $trainer->slug), $this->request($trainer))->assertRedirect(route('login'));
        $this->get(route('trainers.book.start', ['slug' => $trainer->slug, ...$choice]))->assertRedirect(route('login'));

        // After the login: back to the profile, with the slot still chosen.
        $this->actingAs(User::factory()->create())
            ->get(route('trainers.book.start', ['slug' => $trainer->slug, ...$choice]))
            ->assertRedirect(route('trainers.show', ['slug' => $trainer->slug, ...$choice]));

        $this->assertSame(0, Booking::count());
    }

    public function test_trainers_cannot_book()
    {
        $trainer = $this->trainer();

        $this->actingAs(User::factory()->trainer()->create())
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer))
            ->assertRedirect(route('trainer.today'));

        $this->assertSame(0, Booking::count());
    }

    public function test_a_profile_not_approved_cannot_be_booked()
    {
        $trainer = TrainerProfile::factory()->bookable()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer))
            ->assertNotFound();
    }

    public function test_a_client_cancels_a_booking_and_the_slot_is_free_again()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create();
        $this->actingAs($client)->post(route('trainers.book', $trainer->slug), $this->request($trainer));
        $booking = Booking::sole();

        $this->actingAs($client)
            ->patch(route('client.bookings.cancel', $booking))
            ->assertSessionHasNoErrors();

        $booking->refresh();
        $this->assertSame(BookingStatus::Cancelled, $booking->status);
        $this->assertSame(BookingActor::Client, $booking->cancelled_by);
        $this->assertTrue(TrainerSlots::isFree($trainer->refresh(), CarbonImmutable::parse(self::SLOT), 60));
    }

    public function test_only_your_own_future_bookings_can_be_cancelled()
    {
        $someoneElses = Booking::factory()->create();
        $past = Booking::factory()->confirmed()->at(CarbonImmutable::parse('2026-10-18 18:00', 'Europe/Rome'))->create();

        $this->actingAs(User::factory()->create())
            ->patch(route('client.bookings.cancel', $someoneElses))
            ->assertNotFound();

        $this->actingAs($past->client)
            ->patch(route('client.bookings.cancel', $past))
            ->assertSessionHasErrors('booking');

        $this->assertSame(BookingStatus::Pending, $someoneElses->refresh()->status);
        $this->assertSame(BookingStatus::Confirmed, $past->refresh()->status);
    }

    public function test_requests_not_answered_in_time_expire()
    {
        $late = Booking::factory()->expired()->create();
        $waiting = Booking::factory()->create();

        $this->artisan('bookings:expire')->assertSuccessful();

        $this->assertSame(BookingStatus::Expired, $late->refresh()->status);
        $this->assertSame(['expired'], $late->events()->pluck('type')->all());
        $this->assertSame(BookingStatus::Pending, $waiting->refresh()->status);
    }
}
