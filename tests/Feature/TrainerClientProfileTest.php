<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The profile of a client, seen by a trainer the client booked with. */
class TrainerClientProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $client = User::factory()->create();

        $this->get(route('trainer.clients.show', $client))->assertRedirect(route('login'));
    }

    /** We don't tell other trainers who is on MioPersonal. */
    public function test_a_trainer_without_bookings_from_the_client_gets_a_404()
    {
        $booking = Booking::factory()->confirmed()->create();
        $otherTrainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($otherTrainer->user)
            ->get(route('trainer.clients.show', $booking->client_id))
            ->assertNotFound();
    }

    public function test_the_contacts_are_not_sent_before_a_confirmation()
    {
        $booking = Booking::factory()->create();

        $this->actingAs($booking->trainerProfile->user)
            ->get(route('trainer.clients.show', $booking->client_id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/client-profile')
                ->where('client.name', $booking->client->name)
                ->where('client.sessions', 0)
                ->where('client.nextSession', null)
                ->where('client.contacts', null)
            );
    }

    public function test_the_contacts_are_sent_after_a_confirmation()
    {
        $booking = Booking::factory()->confirmed()->create();
        $client = $booking->client;

        $this->actingAs($booking->trainerProfile->user)
            ->get(route('trainer.clients.show', $client))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('client.sessions', 1)
                ->where('client.nextSession', $booking->starts_at->utc()->format('Y-m-d\TH:i:s\Z'))
                ->where('client.contacts', [
                    'email' => $client->email,
                    'phone' => $client->phone,
                ])
            );
    }

    public function test_clients_cannot_open_the_page()
    {
        $booking = Booking::factory()->confirmed()->create();

        $this->actingAs($booking->client)
            ->get(route('trainer.clients.show', $booking->client_id))
            ->assertRedirect(route($booking->client->role->homeRoute()));
    }

    public function test_the_dashboard_links_to_the_client()
    {
        $booking = Booking::factory()->create();

        $this->actingAs($booking->trainerProfile->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('requests.0.clientId', $booking->client_id)
            );
    }
}
