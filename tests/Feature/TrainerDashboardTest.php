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
                ->has('today', 0)
                ->has('requests', 0)
                ->where('stats', ['sessionsThisWeek' => 0])
                ->has('upcoming', 0)
                ->has('past', 0)
                ->missing('todos')
                ->where('trainerArea.pendingCount', 0)
            );
    }

    /** "Prossime prenotazioni": the confirmed sessions from tomorrow on, not only this week. */
    public function test_upcoming_lists_every_confirmed_session_after_today()
    {
        $now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($now);
        $trainer = TrainerProfile::factory()->approved()->create();
        $later = Booking::factory()->for($trainer)->confirmed()->at($now->addDays(40)->setTime(18, 0))->create();
        $tomorrow = Booking::factory()->for($trainer)->confirmed()->at($now->addDay()->setTime(10, 0))->create();
        // Today's sessions are in "Oggi"; requests and cancelled bookings are not sessions.
        Booking::factory()->for($trainer)->confirmed()->at($now->setTime(18, 0))->create();
        Booking::factory()->for($trainer)->at($now->addDays(2)->setTime(10, 0))->create();
        Booking::factory()->for($trainer)->confirmed()->status(BookingStatus::Cancelled)->at($now->addDays(3)->setTime(10, 0))->create();
        // Another trainer's session.
        Booking::factory()->confirmed()->at($now->addDays(2)->setTime(12, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('today', 1)
                ->has('upcoming', 2)
                ->where('upcoming.0.id', $tomorrow->id)
                ->where('upcoming.0.clientName', $tomorrow->client->name)
                ->where('upcoming.1.id', $later->id)
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
        // Today's are in "Oggi"; cancelled ones are not sessions.
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
