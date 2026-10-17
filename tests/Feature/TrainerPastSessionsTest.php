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

    public function test_only_for_trainers()
    {
        $this->get(route('trainer.past-sessions'))->assertRedirect(route('login'));

        $this->actingAs(User::factory()->create())
            ->get(route('trainer.past-sessions'))
            ->assertRedirect();
    }
}
