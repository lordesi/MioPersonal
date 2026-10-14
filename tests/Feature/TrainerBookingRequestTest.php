<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Conferma" and "Rifiuta" of the requests in the trainer's "Oggi". */
class TrainerBookingRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_dashboard_lists_the_requests_to_answer()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        Booking::factory()->for($trainer)->create();
        // Expired: no longer waiting for an answer.
        Booking::factory()->for($trainer)->expired()->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('requests', 1)
                ->where('trainerArea.pendingCount', 1)
            );
    }

    public function test_the_trainer_confirms_a_request()
    {
        $booking = Booking::factory()->create();

        $this->actingAs($booking->trainerProfile->user)
            ->post(route('trainer.requests.accept', $booking))
            ->assertSessionHasNoErrors();

        $booking->refresh();
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertNotNull($booking->confirmed_at);
        $this->assertSame(['confirmed'], $booking->events()->pluck('type')->all());
    }

    public function test_the_trainer_declines_a_request()
    {
        $booking = Booking::factory()->create();

        $this->actingAs($booking->trainerProfile->user)
            ->post(route('trainer.requests.decline', $booking))
            ->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Declined, $booking->refresh()->status);
    }

    public function test_only_your_own_requests_still_waiting()
    {
        $booking = Booking::factory()->create();
        $expired = Booking::factory()->expired()->create();

        $this->actingAs(TrainerProfile::factory()->approved()->create()->user)
            ->post(route('trainer.requests.accept', $booking))
            ->assertNotFound();

        $this->actingAs($expired->trainerProfile->user)
            ->post(route('trainer.requests.accept', $expired))
            ->assertSessionHasErrors('booking');

        $this->assertSame(BookingStatus::Pending, $booking->refresh()->status);
        $this->assertSame(BookingStatus::Pending, $expired->refresh()->status);
    }
}
