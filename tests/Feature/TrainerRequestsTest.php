<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Richieste": the bookings waiting for the trainer's answer. */
class TrainerRequestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('trainer.requests'))->assertRedirect(route('login'));
    }

    public function test_a_new_trainer_has_no_requests()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->get(route('trainer.requests'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/requests')
                ->has('requests', 0)
            );
    }

    public function test_only_the_trainers_requests_still_waiting_the_ones_expiring_first_on_top()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $later = Booking::factory()->for($trainer)->create(['expires_at' => now()->addHours(20), 'client_note' => 'Prima volta in palestra']);
        $sooner = Booking::factory()->for($trainer)->create(['expires_at' => now()->addHours(2)]);
        // Expired, already answered, or another trainer's: not here.
        Booking::factory()->for($trainer)->expired()->create();
        Booking::factory()->for($trainer)->confirmed()->create();
        Booking::factory()->for($trainer)->status(BookingStatus::Declined)->create();
        Booking::factory()->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('requests', 2)
                ->where('requests.0.id', $sooner->id)
                ->where('requests.1.id', $later->id)
                ->where('requests.1.note', 'Prima volta in palestra')
                ->where('requests.1.clientName', $later->client->name)
                ->where('requests.1.requestedAt', $later->created_at?->utc()->format('Y-m-d\TH:i:s\Z'))
                ->where('trainerArea.pendingCount', 2)
            );
    }

    public function test_handled_shows_the_trainers_own_answers_of_the_last_30_days_the_latest_on_top()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $declined = Booking::factory()->for($trainer)->status(BookingStatus::Declined)->create(['expires_at' => null]);
        $declined->record('declined', $trainer->user);
        $this->travel(1)->minutes();
        $confirmed = Booking::factory()->for($trainer)->confirmed()->create();
        $confirmed->record('confirmed', $trainer->user);

        // Confirmed automatically (no actor): the trainer did not answer it.
        Booking::factory()->for($trainer)->confirmed()->create()->record('confirmed');
        // Answered more than 30 days ago.
        $old = Booking::factory()->for($trainer)->confirmed()->create();
        $old->record('confirmed', $trainer->user);
        $old->events()->update(['created_at' => now()->subDays(31)]);
        // Confirmed, then cancelled: no longer a confirmed request.
        $cancelled = Booking::factory()->for($trainer)->status(BookingStatus::Cancelled)->create();
        $cancelled->record('confirmed', $trainer->user);
        // Another trainer's answer.
        $other = Booking::factory()->confirmed()->create();
        $other->record('confirmed', $other->trainerProfile->user);

        $this->actingAs($trainer->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('handled', 2)
                ->where('handled.0.id', $confirmed->id)
                ->where('handled.0.answer', 'confirmed')
                ->where('handled.0.clientName', $confirmed->client->name)
                ->where('handled.1.id', $declined->id)
                ->where('handled.1.answer', 'declined')
                ->has('handled.1.answeredAt')
            );
    }

    /** "Pacchetto 10 sedute" and the bar "Seduta 2 di 10", only while it takes a place of the package. */
    public function test_handled_says_which_session_of_the_package_it_is()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $package = ClientPackage::factory()->for($trainer)->create(['sessions_total' => 10]);
        $tomorrow = CarbonImmutable::now('Europe/Rome')->startOfDay()->addDay();
        Booking::factory()->for($trainer)->for($package)->confirmed()->at($tomorrow->setTime(9, 0))->create();
        $second = Booking::factory()->for($trainer)->for($package)->confirmed()->at($tomorrow->setTime(11, 0))->create();
        $second->record('confirmed', $trainer->user);
        $declined = Booking::factory()->for($trainer)->for($package)->status(BookingStatus::Declined)->at($tomorrow->setTime(13, 0))->create(['expires_at' => null]);
        $declined->record('declined', $trainer->user);
        $single = Booking::factory()->for($trainer)->confirmed()->at($tomorrow->setTime(15, 0))->create();
        $single->record('confirmed', $trainer->user);

        $this->actingAs($trainer->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('handled', 3)
                ->where('handled.0.id', $single->id)
                ->where('handled.0.serviceType', 'Seduta singola')
                ->where('handled.0.package', null)
                ->where('handled.1.id', $declined->id)
                ->where('handled.1.serviceType', 'Pacchetto 10 sedute')
                ->where('handled.1.package', null)
                ->where('handled.2.id', $second->id)
                ->where('handled.2.serviceType', 'Pacchetto 10 sedute')
                ->where('handled.2.package', ['position' => 2, 'total' => 10])
            );
    }

    public function test_the_page_knows_whether_the_trainer_confirms_automatically()
    {
        $manual = TrainerProfile::factory()->approved()->create(['auto_confirm' => false]);
        $automatic = TrainerProfile::factory()->approved()->create(['auto_confirm' => true]);

        $this->actingAs($manual->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page->where('autoConfirm', false));

        $this->actingAs($automatic->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page->where('autoConfirm', true));
    }

    public function test_an_answer_moves_the_request_to_handled()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $booking = Booking::factory()->for($trainer)->create();

        $this->actingAs($trainer->user)
            ->post(route('trainer.requests.decline', $booking))
            ->assertSessionHasNoErrors();

        $this->actingAs($trainer->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('requests', 0)
                ->has('handled', 1)
                ->where('handled.0.id', $booking->id)
                ->where('handled.0.answer', 'declined')
                ->where('trainerArea.pendingCount', 0)
            );
    }

    public function test_handled_shows_the_requests_expired_without_an_answer()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $expired = Booking::factory()->for($trainer)->expired()->create();
        $this->artisan('bookings:expire')->assertSuccessful();
        // Another trainer's.
        Booking::factory()->expired()->create()->expire();

        $this->actingAs($trainer->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('handled', 1)
                ->where('handled.0.id', $expired->id)
                ->where('handled.0.answer', 'expired')
                ->has('handled.0.answeredAt')
            );
    }

    /** bookings:expire hasn't run yet (no scheduler in local): the page does it. */
    public function test_opening_the_page_expires_the_requests_not_answered_in_time()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $late = Booking::factory()->for($trainer)->expired()->create();
        $waiting = Booking::factory()->for($trainer)->create();
        // Another trainer's: left to bookings:expire.
        $other = Booking::factory()->expired()->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('requests', 1)
                ->where('requests.0.id', $waiting->id)
                ->has('handled', 1)
                ->where('handled.0.id', $late->id)
                ->where('handled.0.answer', 'expired')
            );

        $this->assertSame(BookingStatus::Expired, $late->refresh()->status);
        $this->assertSame(BookingStatus::Pending, $other->refresh()->status);
    }

    /** Clients go back to their own home. */
    public function test_clients_cannot_open_it()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('trainer.requests'))
            ->assertRedirect(route('client.home'));
    }
}
