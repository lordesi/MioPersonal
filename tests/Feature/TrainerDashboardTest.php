<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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
        $this->travelTo(CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome'));
        $user = User::factory()->trainer()->create(['name' => 'Giulia Rossi']);

        $this->actingAs($user)
            ->get(route('trainer.today'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/today')
                ->where('firstName', 'Giulia')
                ->where('today', '2026-10-15')
                ->where('day', '2026-10-15')
                ->where('next', null)
                ->has('requests', 0)
                // Monday to Sunday of the chosen day.
                ->has('week', 7)
                ->where('week.0', ['date' => '2026-10-12', 'count' => 0])
                ->has('daySessions', 0)
                ->has('packages', 0)
                ->where('stats.period', '7')
                ->where('stats.views', 0)
                ->where('stats.sessions', 0)
                ->where('trainerArea.pendingCount', 0)
                ->where('trainerArea.unreadChats', 0)
            );
    }

    /** The week strip counts the sessions of each day; the chosen day lists them, waiting ones too. */
    public function test_the_week_and_the_sessions_of_the_chosen_day()
    {
        $now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($now);
        $trainer = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create(['phone' => '+39 333 123 4567']);
        $early = Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($now->setTime(7, 0))->create();
        $later = Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($now->setTime(18, 0), 90)->create();
        $request = Booking::factory()->for($trainer)->at($now->addDays(2)->setTime(10, 0))->create();
        // Cancelled, next week or another trainer's: not counted.
        Booking::factory()->for($trainer)->confirmed()->status(BookingStatus::Cancelled)->at($now->addDays(3)->setTime(10, 0))->create();
        Booking::factory()->for($trainer)->confirmed()->at($now->addDays(7)->setTime(10, 0))->create();
        Booking::factory()->confirmed()->at($now->setTime(12, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('week.3', ['date' => '2026-10-15', 'count' => 2])
                ->where('week.5', ['date' => '2026-10-17', 'count' => 1])
                ->where('week.6', ['date' => '2026-10-18', 'count' => 0])
                ->has('daySessions', 2)
                ->where('daySessions.0.id', $early->id)
                // Over at 8: "Effettuata" or "Saltata" from Home.
                ->where('daySessions.0.over', true)
                ->where('daySessions.0.canChangeNoShow', true)
                ->where('daySessions.0.phone', '+39 333 123 4567')
                ->where('daySessions.1.id', $later->id)
                ->where('daySessions.1.over', false)
                ->where('daySessions.1.kind', 'confirmed')
                // Every request waiting, with the price.
                ->has('requests', 1)
                ->where('requests.0.id', $request->id)
                ->where('requests.0.priceCents', $request->price_cents)
            );

        $this->actingAs($trainer->user)
            ->get(route('trainer.today', ['giorno' => '2026-10-17']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('day', '2026-10-17')
                ->has('daySessions', 1)
                ->where('daySessions.0.id', $request->id)
                ->where('daySessions.0.kind', 'pending')
            );
    }

    /** A day that is not a date, or too far away, shows today. */
    public function test_a_wrong_day_shows_today()
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome'));
        $trainer = TrainerProfile::factory()->approved()->create();

        foreach (['domani', '2026-02-30', '2030-01-01'] as $day) {
            $this->actingAs($trainer->user)
                ->get(route('trainer.today', ['giorno' => $day]))
                ->assertInertia(fn (Assert $page) => $page->where('day', '2026-10-15'));
        }
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

    /** A past day: "Effettuata" or "Saltata" for 7 days, and which session of the package it was. */
    public function test_a_past_day_shows_the_sessions_over_with_their_package()
    {
        $now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($now);
        $trainer = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create();
        $package = ClientPackage::factory()->for($trainer)->for($client, 'client')->create(['sessions_total' => 5]);
        Booking::factory()->for($trainer)->for($client, 'client')->for($package)->confirmed()->at($now->subDays(3)->setTime(10, 0))->create();
        $second = Booking::factory()->for($trainer)->for($client, 'client')->for($package)->confirmed()->at($now->subDays(2)->setTime(10, 0))->create(['no_show_at' => now()]);
        $old = Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($now->subDays(9)->setTime(10, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today', ['giorno' => '2026-10-13']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('daySessions', 1)
                ->where('daySessions.0.id', $second->id)
                ->where('daySessions.0.over', true)
                ->where('daySessions.0.noShow', true)
                ->where('daySessions.0.canChangeNoShow', true)
                ->where('daySessions.0.package', ['position' => 2, 'total' => 5])
            );

        // After 7 days the session stays as it is.
        $this->actingAs($trainer->user)
            ->get(route('trainer.today', ['giorno' => '2026-10-06']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('daySessions.0.id', $old->id)
                ->where('daySessions.0.canChangeNoShow', false)
                ->where('daySessions.0.package', null)
            );
    }

    /** "Statistiche": the visits and the sessions of the period, with the period before. */
    public function test_the_numbers_of_a_period_and_of_the_one_before()
    {
        $now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($now);
        $trainer = TrainerProfile::factory()->approved()->create();
        DB::table('trainer_profile_views')->insert([
            ['trainer_profile_id' => $trainer->id, 'day' => '2026-10-15', 'views' => 5],
            ['trainer_profile_id' => $trainer->id, 'day' => '2026-10-10', 'views' => 7],
            // The 7 days before: 2026-10-02 to 2026-10-08.
            ['trainer_profile_id' => $trainer->id, 'day' => '2026-10-05', 'views' => 4],
        ]);
        Booking::factory()->for($trainer)->confirmed()->at($now->subDays(2)->setTime(10, 0))->create();
        Booking::factory()->for($trainer)->confirmed()->at($now->setTime(18, 0), 90)->create();
        Booking::factory()->for($trainer)->confirmed()->at($now->subDays(10)->setTime(10, 0))->create();
        // Waiting: not a session yet.
        Booking::factory()->for($trainer)->at($now->setTime(20, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.period', '7')
                ->where('stats.from', '2026-10-09')
                ->where('stats.to', '2026-10-15')
                ->where('stats.views', 12)
                ->where('stats.viewsBefore', 4)
                ->where('stats.sessions', 2)
                ->where('stats.sessionsBefore', 1)
                ->where('stats.hours', 2.5)
            );

        $this->actingAs($trainer->user)
            ->get(route('trainer.today', ['periodo' => 'oggi']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.period', 'oggi')
                ->where('stats.views', 5)
                ->where('stats.sessions', 1)
            );

        // Two dates; the end can't be after today.
        $this->actingAs($trainer->user)
            ->get(route('trainer.today', ['periodo' => 'intervallo', 'dal' => '2026-10-01', 'al' => '2026-12-31']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.period', 'intervallo')
                ->where('stats.from', '2026-10-01')
                ->where('stats.to', '2026-10-15')
                ->where('stats.views', 16)
                ->where('stats.sessions', 3)
            );
    }
}
