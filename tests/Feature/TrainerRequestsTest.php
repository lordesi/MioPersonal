<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
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
                ->where('trainerArea.pendingCount', 2)
            );
    }

    /** Clients go back to their own home. */
    public function test_clients_cannot_open_it()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('trainer.requests'))
            ->assertRedirect(route('client.home'));
    }
}
