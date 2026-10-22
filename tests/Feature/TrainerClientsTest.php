<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Clienti" of the trainer area: everyone with a confirmed session, once. */
class TrainerClientsTest extends TestCase
{
    use RefreshDatabase;

    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();

        $this->now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($this->now);
    }

    public function test_a_client_with_several_slots_shows_up_once_with_all_of_them()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create(['name' => 'Marco Verdi']);
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($this->now->subDays(3)->setTime(18, 0))->create();
        $next = Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($this->now->addDay()->setTime(10, 0))->create();
        $later = Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($this->now->addDays(8)->setTime(10, 0), 90)->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/clients')
                ->has('clients', 1)
                ->has('clients.0', fn (Assert $row) => $row
                    ->where('id', $client->id)
                    ->where('name', 'Marco Verdi')
                    ->where('sessions', 3)
                    ->where('lastSession', '2026-10-12T16:00:00Z')
                    ->where('nextSession', '2026-10-16T08:00:00Z')
                    ->has('upcoming', 2)
                    ->where('upcoming.0.id', $next->id)
                    ->where('upcoming.1.id', $later->id)
                    ->where('upcoming.1.hours', 1.5)
                    ->etc()
                )
            );
    }

    public function test_only_clients_with_a_confirmed_session_of_this_trainer()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        // Waiting for an answer: in "Oggi", not here yet.
        Booking::factory()->for($trainer)->create();
        Booking::factory()->for($trainer)->expired()->create();
        Booking::factory()->for($trainer)->status(BookingStatus::Declined)->create();
        Booking::factory()->for($trainer)->confirmed()->status(BookingStatus::Cancelled)->create();
        // Another trainer's client.
        Booking::factory()->confirmed()->create();
        // A client who deleted the account.
        Booking::factory()->for($trainer)->confirmed()->create(['client_id' => null]);

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page->has('clients', 0));
    }

    public function test_clients_with_a_next_session_come_first()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $old = Booking::factory()->for($trainer)->confirmed()->at($this->now->subDays(20)->setTime(10, 0))->create();
        $recent = Booking::factory()->for($trainer)->confirmed()->at($this->now->subDays(2)->setTime(10, 0))->create();
        $soon = Booking::factory()->for($trainer)->confirmed()->at($this->now->addDays(2)->setTime(10, 0))->create();
        $tomorrow = Booking::factory()->for($trainer)->confirmed()->at($this->now->addDay()->setTime(10, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('clients', 4)
                ->where('clients.0.id', $tomorrow->client_id)
                ->where('clients.1.id', $soon->client_id)
                ->where('clients.2.id', $recent->client_id)
                ->where('clients.3.id', $old->client_id)
            );
    }

    public function test_the_contacts_of_each_client_are_sent()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create(['email' => 'marco@example.com', 'phone' => '+39 345 000 0000']);
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('clients.0.contacts', [
                    'email' => 'marco@example.com',
                    'phone' => '+39 345 000 0000',
                ])
            );
    }

    /** The links of Panoramica and Calendario open Clienti on that client. */
    public function test_the_client_in_the_url_is_selected()
    {
        $trainer = TrainerProfile::factory()->approved()->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients', ['cliente' => 37]))
            ->assertInertia(fn (Assert $page) => $page->where('selectedId', 37));

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page->where('selectedId', null));
    }

    /** The old "scheda" page is gone. */
    public function test_the_client_profile_page_no_longer_exists()
    {
        $booking = Booking::factory()->for(TrainerProfile::factory()->approved())->confirmed()->create();

        $this->actingAs($booking->trainerProfile->user)
            ->get('/area-trainer/clienti/'.$booking->client_id)
            ->assertNotFound();
    }
}
