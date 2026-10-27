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

/** "Sedute passate": the "Vedi tutte" of the last 7 days in "Le tue prenotazioni". */
class TrainerPastSessionsTest extends TestCase
{
    use RefreshDatabase;

    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();

        $this->now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($this->now);
    }

    public function test_lists_every_finished_session_the_most_recent_first()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $old = Booking::factory()->for($trainer)->confirmed()->at($this->now->subDays(30))->create(['no_show_at' => now()]);
        $recent = Booking::factory()->for($trainer)->confirmed()->at($this->now->subDay())->create();
        // Not over yet, cancelled, another trainer's: not here.
        Booking::factory()->for($trainer)->confirmed()->at($this->now->addHour())->create();
        Booking::factory()->for($trainer)->status(BookingStatus::Cancelled)->at($this->now->subDays(2))->create();
        Booking::factory()->confirmed()->at($this->now->subDays(3))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.past-sessions'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/past-sessions')
                ->has('sessions', 2)
                ->where('sessions.0.id', $recent->id)
                ->where('sessions.0.canChangeNoShow', true)
                ->where('sessions.1.id', $old->id)
                ->where('sessions.1.noShow', true)
                // Over 7 days ago: it stays as it is.
                ->where('sessions.1.canChangeNoShow', false)
                ->where('pagination', ['currentPage' => 1, 'lastPage' => 1])
            );
    }

    public function test_twenty_sessions_per_page()
    {
        $trainer = TrainerProfile::factory()->approved()->create();

        foreach (range(1, 21) as $days) {
            Booking::factory()->for($trainer)->confirmed()->at($this->now->subDays($days))->create();
        }

        $this->actingAs($trainer->user)
            ->get(route('trainer.past-sessions', ['pagina' => 2]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('sessions', 1)
                ->where('pagination', ['currentPage' => 2, 'lastPage' => 2])
            );
    }

    public function test_filters_by_outcome_and_counts_every_session()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $missed = Booking::factory()->for($trainer)->confirmed()->at($this->now->subDays(2))->create(['no_show_at' => now()]);
        $done = Booking::factory()->for($trainer)->confirmed()->at($this->now->subDay())->create();
        // On page 2 of "Tutte": still in the numbers.
        foreach (range(3, 22) as $days) {
            Booking::factory()->for($trainer)->confirmed()->at($this->now->subDays($days))->create();
        }

        $counts = ['all' => 22, 'done' => 21, 'missed' => 1];

        $this->actingAs($trainer->user)
            ->get(route('trainer.past-sessions', ['esito' => 'saltate']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filter', 'missed')
                ->where('counts', $counts)
                ->has('sessions', 1)
                ->where('sessions.0.id', $missed->id)
            );

        $this->actingAs($trainer->user)
            ->get(route('trainer.past-sessions', ['esito' => 'effettuate']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filter', 'done')
                ->where('counts', $counts)
                ->has('sessions', 20)
                ->where('sessions.0.id', $done->id)
                ->where('pagination', ['currentPage' => 1, 'lastPage' => 2])
            );

        // Unknown value: "Tutte".
        $this->actingAs($trainer->user)
            ->get(route('trainer.past-sessions', ['esito' => 'boh']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filter', 'all')
                ->where('sessions.0.id', $done->id)
                ->where('sessions.1.id', $missed->id)
            );
    }

    public function test_sums_up_the_sessions_that_can_still_be_changed()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create();
        // Yesterday 10:00–11:30 and 3 days ago (missed), both of the same client.
        $yesterday = Booking::factory()->for($trainer)->for($client, 'client')->confirmed()
            ->at($this->now->subDay()->setTime(10, 0), 90)->create();
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()
            ->at($this->now->subDays(3)->setTime(10, 0))->create(['no_show_at' => now()]);
        // Over 7 days ago, not over yet, cancelled: not counted.
        Booking::factory()->for($trainer)->confirmed()->at($this->now->subDays(8))->create();
        Booking::factory()->for($trainer)->confirmed()->at($this->now->addHour())->create();
        Booking::factory()->for($trainer)->status(BookingStatus::Cancelled)->at($this->now->subDays(2))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.past-sessions'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('lastWeek', [
                    'sessions' => 2,
                    'hours' => 2.5,
                    'clients' => 1,
                    'missed' => 1,
                    'first' => '2026-10-12',
                    'last' => '2026-10-14',
                ])
                // "Modificabile fino a": 7 days after the end (11:30 Rome = 09:30 UTC).
                ->where('sessions.0.id', $yesterday->id)
                ->where('sessions.0.noShowUntil', '2026-10-21T09:30:00Z')
            );
    }

    public function test_only_for_trainers()
    {
        $this->get(route('trainer.past-sessions'))->assertRedirect(route('login'));

        $this->actingAs(User::factory()->create())
            ->get(route('trainer.past-sessions'))
            ->assertRedirect();
    }
}
