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

class TrainerDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('trainer.today'))->assertRedirect(route('login'));
    }

    /** No sample data: a new trainer sees an empty dashboard until real bookings exist. */
    public function test_a_new_trainer_sees_an_empty_dashboard()
    {
        $user = User::factory()->trainer()->create(['name' => 'Giulia Rossi']);

        $this->actingAs($user)
            ->get(route('trainer.today'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/today')
                ->where('firstName', 'Giulia')
                ->where('next', null)
                ->has('agenda', 0)
                ->has('requests', 0)
                ->has('packages', 0)
                ->has('past', 0)
                ->where('stats', ['pending' => 0, 'weekSessions' => 0, 'weekHours' => 0, 'weekClients' => 0])
                ->where('trainerArea.pendingCount', 0)
            );
    }

    /** "Agenda": confirmed and waiting sessions from today to the 7th day. */
    public function test_the_agenda_lists_the_next_seven_days()
    {
        $now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($now);
        $trainer = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create();
        $today = Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($now->setTime(7, 0))->create();
        $tomorrow = Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($now->addDay()->setTime(10, 0), 90)->create();
        $request = Booking::factory()->for($trainer)->at($now->addDays(2)->setTime(10, 0))->create();
        // After the 7th day, cancelled, or another trainer's: not in the agenda.
        Booking::factory()->for($trainer)->confirmed()->at($now->addDays(7)->setTime(10, 0))->create();
        Booking::factory()->for($trainer)->confirmed()->status(BookingStatus::Cancelled)->at($now->addDays(3)->setTime(10, 0))->create();
        Booking::factory()->confirmed()->at($now->addDays(2)->setTime(12, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('agenda', 3)
                ->where('agenda.0.id', $today->id)
                ->where('agenda.1.id', $tomorrow->id)
                ->where('agenda.1.clientName', $client->name)
                ->where('agenda.1.kind', 'confirmed')
                ->where('agenda.2.id', $request->id)
                ->where('agenda.2.kind', 'pending')
                // Only the confirmed ones count: 1 hour + 1 hour and a half, one client.
                ->where('stats.weekSessions', 2)
                ->where('stats.weekHours', 2.5)
                ->where('stats.weekClients', 1)
                ->where('stats.pending', 1)
            );
    }

    /** "Prossima seduta": the first confirmed one not over yet, even far away. */
    public function test_next_is_the_first_confirmed_session_not_over()
    {
        $now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($now);
        $trainer = TrainerProfile::factory()->approved()->create();
        // Over this morning, and a request: not the next session.
        Booking::factory()->for($trainer)->confirmed()->at($now->setTime(7, 0))->create();
        Booking::factory()->for($trainer)->at($now->addDay()->setTime(10, 0))->create();
        $next = Booking::factory()->for($trainer)->confirmed()->at($now->addDays(40)->setTime(18, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('next.id', $next->id)
                ->where('next.serviceName', 'Seduta singola')
            );
    }

    /** "Ultimi 7 giorni": over before today and still in time for "Saltata", the most recent first. */
    public function test_past_lists_the_sessions_of_the_last_seven_days()
    {
        $now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($now);
        $trainer = TrainerProfile::factory()->approved()->create();
        $sixDaysAgo = Booking::factory()->for($trainer)->confirmed()->at($now->subDays(6)->setTime(10, 0))->create();
        $yesterday = Booking::factory()->for($trainer)->confirmed()->at($now->subDay()->setTime(18, 0))->create(['no_show_at' => now()]);
        // Too old for "Saltata": only in "Sedute passate".
        Booking::factory()->for($trainer)->confirmed()->at($now->subDays(8)->setTime(10, 0))->create();
        // Today's are in the agenda; cancelled ones are not sessions.
        Booking::factory()->for($trainer)->confirmed()->at($now->setTime(7, 0))->create();
        Booking::factory()->for($trainer)->status(BookingStatus::Cancelled)->at($now->subDays(2)->setTime(10, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('past', 2)
                ->where('past.0.id', $yesterday->id)
                ->where('past.0.noShow', true)
                ->where('past.0.canChangeNoShow', true)
                ->where('past.1.id', $sixDaysAgo->id)
                ->where('past.1.noShow', false)
            );
    }
}
