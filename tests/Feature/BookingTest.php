<?php

namespace Tests\Feature;

use App\Actions\Bookings\CreateBooking;
use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Enums\PlaceType;
use App\Models\Booking;
use App\Models\City;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
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

    /**
     * The row of "Seduta singola" with the chosen duration (each duration is a
     * row of its own); for a duration not offered, the 1-hour one.
     *
     * @return array<string, mixed>
     */
    private function request(TrainerProfile $trainer, array $data = []): array
    {
        $minutes = $data['minutes'] ?? 60;

        return [
            'service_id' => $trainer->services()->where('minutes', $minutes)->value('id') ?? $trainer->services()->value('id'),
            'start' => self::SLOT,
            'minutes' => $minutes,
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
        // The price of 2 hours, in cents: its own, not twice the price of 1 hour (40 €).
        $this->assertSame(7500, $booking->price_cents);
        $this->assertSame('Seduta singola', $booking->service_name);
        $this->assertSame('Studio · Milano', $booking->place_label);
        // The trainer answers within confirm_hours (24 by default).
        $this->assertTrue($booking->expires_at->equalTo(now()->addHours(24)));
        $this->assertSame(['requested'], $booking->events()->pluck('type')->all());

        // The slot is taken now.
        $this->assertFalse(TrainerSlots::isFree($trainer->refresh(), CarbonImmutable::parse(self::SLOT), 60));
    }

    public function test_the_place_is_empty_when_the_trainer_has_more_than_one()
    {
        $trainer = $this->trainer();
        $trainer->places()->create(['type' => PlaceType::Home, 'city_id' => $trainer->city_id, 'sort' => 1]);

        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer))
            ->assertSessionHasNoErrors();

        $this->assertSame('', Booking::sole()->place_label);
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

    public function test_a_confirmed_session_can_be_cancelled_only_while_cancelling_is_free()
    {
        // Free cancellation until 24 hours before; it's Monday 08:00.
        $trainer = TrainerProfile::factory()->approved()->create(['free_cancellation_hours' => 24]);
        $client = User::factory()->create();
        $session = fn (string $start) => Booking::factory()->for($client, 'client')->for($trainer)->confirmed()
            ->at(CarbonImmutable::parse($start, 'Europe/Rome'))
            ->create();
        // Tonight: free until yesterday at 18:00.
        $tonight = $session('2026-10-19 18:00');
        // Wednesday: free until Tuesday at 18:00.
        $wednesday = $session('2026-10-21 18:00');

        $this->actingAs($client)
            ->patch(route('client.bookings.cancel', $tonight))
            ->assertSessionHasErrors('booking');

        $this->actingAs($client)
            ->patch(route('client.bookings.cancel', $wednesday))
            ->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Confirmed, $tonight->refresh()->status);
        $this->assertSame(BookingStatus::Cancelled, $wednesday->refresh()->status);
    }

    public function test_a_request_still_waiting_can_be_cancelled_until_it_starts()
    {
        $trainer = TrainerProfile::factory()->approved()->create(['free_cancellation_hours' => 24]);
        $client = User::factory()->create();
        // Tonight, past the free cancellation, but the trainer hasn't answered yet.
        $request = Booking::factory()->for($client, 'client')->for($trainer)
            ->at(CarbonImmutable::parse('2026-10-19 18:00', 'Europe/Rome'))
            ->create();

        $this->actingAs($client)
            ->patch(route('client.bookings.cancel', $request))
            ->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Cancelled, $request->refresh()->status);
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

    public function test_a_slot_whose_request_expired_can_be_booked_before_bookings_expire_runs()
    {
        $trainer = $this->trainer();
        // Same slot, not answered in time, still "pending": bookings:expire hasn't run.
        $late = Booking::factory()->for($trainer)->at(CarbonImmutable::parse(self::SLOT))->expired()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer))
            ->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Expired, $late->refresh()->status);
        $this->assertSame(['expired'], $late->events()->pluck('type')->all());
        $this->assertSame(1, $trainer->bookings()->where('status', BookingStatus::Pending)->count());
    }

    /** The first session of 1 hour (30 €), on top of the services, as SaveTrainerProfile writes it. */
    private function firstSession(TrainerProfile $trainer): Service
    {
        return $trainer->services()->create([
            'name' => Service::FIRST_SESSION_NAME,
            'kind' => 'session',
            'minutes' => 60,
            'price_cents' => 3000,
            'fixed_duration' => true,
            'sort' => 0,
        ]);
    }

    /** A booking of last week with this trainer. */
    private function pastBooking(TrainerProfile $trainer, User $client, BookingStatus $status): Booking
    {
        return Booking::factory()
            ->at(CarbonImmutable::parse('2026-10-12 18:00', 'Europe/Rome'))
            ->status($status)
            ->create(['client_id' => $client->id, 'trainer_profile_id' => $trainer->id]);
    }

    public function test_the_first_session_is_only_for_the_first_booking()
    {
        $trainer = $this->trainer();
        $first = $this->firstSession($trainer);
        $client = User::factory()->create();
        $this->pastBooking($trainer, $client, BookingStatus::Confirmed);

        // The profile doesn't offer it to this client any more…
        $this->actingAs($client)
            ->get(route('trainers.show', $trainer->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.services', fn ($services) => ! collect($services)->contains('name', Service::FIRST_SESSION_NAME))
            );

        // …and it can't be booked.
        $this->actingAs($client)
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer, ['service_id' => $first->id]))
            ->assertSessionHasErrors('service_id');

        $this->assertSame(1, Booking::count());
    }

    public function test_a_new_client_books_the_first_session()
    {
        $trainer = $this->trainer();
        $first = $this->firstSession($trainer);
        $client = User::factory()->create();
        // Cancelled, declined or expired requests don't count.
        $this->pastBooking($trainer, $client, BookingStatus::Cancelled);

        $this->actingAs($client)
            ->get(route('trainers.show', $trainer->slug))
            ->assertInertia(fn (Assert $page) => $page->where('trainer.services.0.name', Service::FIRST_SESSION_NAME));

        $this->actingAs($client)
            ->post(route('trainers.book', $trainer->slug), $this->request($trainer, ['service_id' => $first->id]))
            ->assertSessionHasNoErrors();

        $booking = Booking::where('status', BookingStatus::Pending)->sole();
        $this->assertSame(Service::FIRST_SESSION_NAME, $booking->service_name);
        $this->assertSame(3000, $booking->price_cents);
    }
}
