<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Giorni e settimane diverse" of "Disponibilità": a day, a week or the
 * holidays with their own hours (or closed) instead of the weekly ones.
 */
class TrainerDayOverrideTest extends TestCase
{
    use RefreshDatabase;

    private TrainerProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();

        // Monday 9 November 2026, 8:00 in Rome.
        $this->travelTo(CarbonImmutable::parse('2026-11-09 08:00', 'Europe/Rome'));

        $this->profile = TrainerProfile::factory()->approved()->create(['notice_hours' => 2]);

        // Every day 18:00–20:00.
        foreach (range(1, 7) as $weekday) {
            $this->profile->workingHours()->create(['weekday' => $weekday, 'starts_at' => '18:00', 'ends_at' => '20:00']);
        }

        $this->profile->refresh()->load('workingHours');
    }

    /** @return array<int, list<int>> 7 days with the same hours */
    private function week(array $hours): array
    {
        return array_fill(0, 7, $hours);
    }

    /** @return array<string, list<string>> date => start times in Rome */
    private function slots(int $days = 14): array
    {
        $result = [];

        foreach (TrainerSlots::days($this->profile->fresh()->load('workingHours'), $days) as $day) {
            $result[$day['date']] = array_map(
                fn (array $slot) => CarbonImmutable::parse($slot['start'])->setTimezone('Europe/Rome')->format('H:i'),
                $day['slots'],
            );
        }

        return $result;
    }

    public function test_a_closed_day_has_no_slots_and_can_not_be_booked()
    {
        $this->actingAs($this->profile->user)
            ->post(route('trainer.availability.overrides.store'), ['from' => '2026-11-11', 'to' => '2026-11-11', 'closed' => true, 'note' => 'Gara'])
            ->assertSessionHasNoErrors();

        $slots = $this->slots();
        $this->assertSame([], $slots['2026-11-11']);
        $this->assertSame(['18:00', '19:00'], $slots['2026-11-12']);
        $this->assertTrue(collect(TrainerSlots::days($this->profile->fresh(), 3))->firstWhere('date', '2026-11-11')['closed']);
        $this->assertFalse(TrainerSlots::isFree($this->profile->fresh(), CarbonImmutable::parse('2026-11-11 18:00', 'Europe/Rome'), 60));
    }

    public function test_a_week_takes_the_hours_of_each_weekday()
    {
        // Mornings Monday–Friday, closed at the weekend.
        $hours = [[8, 9], [8, 9], [8, 9], [8, 9], [8, 9], [], []];

        $this->actingAs($this->profile->user)
            ->post(route('trainer.availability.overrides.store'), ['from' => '2026-11-16', 'to' => '2026-11-22', 'closed' => false, 'hours' => $hours])
            ->assertSessionHasNoErrors();

        $slots = $this->slots(21);
        $this->assertSame(['08:00', '09:00'], $slots['2026-11-16']);
        $this->assertSame([], $slots['2026-11-21']);
        // The week before and after: the weekly hours.
        $this->assertSame(['18:00', '19:00'], $slots['2026-11-15']);
        $this->assertSame(['18:00', '19:00'], $slots['2026-11-23']);
    }

    public function test_holidays_close_the_first_free_slot_moves_and_restoring_brings_it_back()
    {
        $this->actingAs($this->profile->user)
            ->post(route('trainer.availability.overrides.store'), ['from' => '2026-11-09', 'to' => '2026-11-15', 'closed' => true, 'note' => 'Ferie']);

        $this->assertSame('2026-11-16 18:00', $this->profile->fresh()->next_free_slot_at?->setTimezone('Europe/Rome')->format('Y-m-d H:i'));

        $this->actingAs($this->profile->user)
            ->delete(route('trainer.availability.overrides.destroy'), ['from' => '2026-11-09', 'to' => '2026-11-15'])
            ->assertSessionHasNoErrors();

        $this->assertSame('2026-11-09 18:00', $this->profile->fresh()->next_free_slot_at?->setTimezone('Europe/Rome')->format('Y-m-d H:i'));
        $this->assertSame(0, $this->profile->dayOverrides()->count());
    }

    public function test_saving_again_replaces_the_days_of_that_period()
    {
        $this->actingAs($this->profile->user)
            ->post(route('trainer.availability.overrides.store'), ['from' => '2026-11-10', 'to' => '2026-11-12', 'closed' => true]);
        $this->actingAs($this->profile->user)
            ->post(route('trainer.availability.overrides.store'), ['from' => '2026-11-11', 'to' => '2026-11-11', 'closed' => false, 'hours' => $this->week([10])]);

        $slots = $this->slots();
        $this->assertSame([], $slots['2026-11-10']);
        $this->assertSame(['10:00'], $slots['2026-11-11']);
        $this->assertSame([], $slots['2026-11-12']);
    }

    public function test_the_page_groups_the_changes_and_counts_the_bookings_in_them()
    {
        Booking::factory()->for($this->profile)->confirmed()->create([
            'starts_at' => CarbonImmutable::parse('2026-11-20 18:00', 'Europe/Rome'),
            'ends_at' => CarbonImmutable::parse('2026-11-20 19:00', 'Europe/Rome'),
        ]);

        $this->actingAs($this->profile->user)
            ->post(route('trainer.availability.overrides.store'), ['from' => '2026-11-19', 'to' => '2026-11-22', 'closed' => true, 'note' => 'Ferie']);
        $this->actingAs($this->profile->user)
            ->post(route('trainer.availability.overrides.store'), ['from' => '2026-11-25', 'to' => '2026-11-25', 'closed' => false, 'hours' => $this->week([7])]);

        $this->actingAs($this->profile->user)
            ->get(route('trainer.availability'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('today', '2026-11-09')
                ->has('overrides', 2)
                ->where('overrides.0.from', '2026-11-19')
                ->where('overrides.0.to', '2026-11-22')
                ->where('overrides.0.closed', true)
                ->where('overrides.0.note', 'Ferie')
                // Stays valid: the page says so.
                ->where('overrides.0.bookings', 1)
                ->where('overrides.1.days.0.hours', [7])
                ->where('overrides.1.bookings', 0)
            );
    }

    public function test_only_valid_periods_and_hours()
    {
        $post = fn (array $data) => $this->actingAs($this->profile->user)
            ->post(route('trainer.availability.overrides.store'), ['closed' => true, ...$data]);

        $post(['from' => '2026-11-08', 'to' => '2026-11-08'])->assertSessionHasErrors('from');
        $post(['from' => '2026-11-12', 'to' => '2026-11-10'])->assertSessionHasErrors('to');
        $post(['from' => '2026-11-10', 'to' => '2027-02-15'])->assertSessionHasErrors('to');
        $post(['from' => '2026-11-10', 'to' => '2026-11-10', 'closed' => false, 'hours' => $this->week([3])])->assertSessionHasErrors('hours.0.0');

        $this->assertSame(0, $this->profile->dayOverrides()->count());
    }

    public function test_clients_can_not_change_the_hours()
    {
        $this->actingAs(Booking::factory()->create()->client)
            ->post(route('trainer.availability.overrides.store'), ['from' => '2026-11-10', 'to' => '2026-11-10', 'closed' => true])
            ->assertRedirect();

        $this->assertSame(0, $this->profile->dayOverrides()->count());
    }
}
