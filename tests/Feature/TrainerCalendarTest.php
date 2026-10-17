<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Calendario" of the trainer area: a week or a month of real bookings. */
class TrainerCalendarTest extends TestCase
{
    use RefreshDatabase;

    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();

        // A Thursday: the week goes from Monday 12 to Sunday 18 October.
        $this->now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($this->now);
    }

    public function test_the_week_shows_confirmed_and_waiting_sessions_with_the_client()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $confirmed = Booking::factory()->for($trainer)->confirmed()->at($this->now->setTime(18, 0))->create();
        $waiting = Booking::factory()->for($trainer)->at($this->now->addDays(2)->setTime(10, 0))->create();
        // Not in the calendar: expired, cancelled, next week, another trainer.
        Booking::factory()->for($trainer)->expired()->at($this->now->addDay()->setTime(10, 0))->create();
        Booking::factory()->for($trainer)->confirmed()->status(BookingStatus::Cancelled)->at($this->now->addDay()->setTime(12, 0))->create();
        Booking::factory()->for($trainer)->confirmed()->at($this->now->addDays(4)->setTime(10, 0))->create();
        Booking::factory()->confirmed()->at($this->now->setTime(19, 0))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.calendar'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('view', 'week')
                ->where('focus', '2026-10-15')
                ->has('events', 2)
                ->where('events.0.id', $confirmed->id)
                ->where('events.0.clientName', $confirmed->client->name)
                ->where('events.0.start', '2026-10-15T16:00:00Z')
                ->where('events.0.kind', 'confirmed')
                ->where('events.1.id', $waiting->id)
                ->where('events.1.kind', 'pending')
            );
    }

    public function test_the_month_shows_only_its_own_sessions()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $november = Booking::factory()->for($trainer)->confirmed()->at(CarbonImmutable::parse('2026-11-30 18:00', 'Europe/Rome'))->create();
        Booking::factory()->for($trainer)->confirmed()->at(CarbonImmutable::parse('2026-12-01 10:00', 'Europe/Rome'))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.calendar', ['vista' => 'mese', 'giorno' => '2026-11-01']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('view', 'month')
                ->where('focus', '2026-11-01')
                ->has('events', 1)
                ->where('events.0.id', $november->id)
            );
    }

    /** The limits follow today: 12 months before and after the current month. */
    public function test_the_arrows_reach_twelve_months_around_today()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $this->actingAs($trainer->user);

        $this->get(route('trainer.calendar'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('minDate', '2025-10-01')
                ->where('maxDate', '2027-10-31')
            );

        $this->get(route('trainer.calendar', ['vista' => 'mese', 'giorno' => '2030-01-01']))
            ->assertInertia(fn (Assert $page) => $page->where('focus', '2027-10-31'));

        $this->get(route('trainer.calendar', ['giorno' => '2020-05-10']))
            ->assertInertia(fn (Assert $page) => $page->where('focus', '2025-10-01'));
    }

    public function test_a_wrong_day_shows_today()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $this->actingAs($trainer->user);

        foreach (['domani', '2026-02-31', '2026-1-5'] as $day) {
            $this->get(route('trainer.calendar', ['giorno' => $day]))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->where('focus', '2026-10-15'));
        }
    }
}
