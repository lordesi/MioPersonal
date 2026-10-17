<?php

namespace Tests\Feature;

use App\Enums\TrainerProfileStatus;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Disponibilità e regole": the hours and rules of step 5, changed from the trainer area. */
class TrainerAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * What the page sends: Monday 9–12 and Wednesday 18–20.
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function payload(array $changes = []): array
    {
        return [
            'hours' => [[9, 10, 11], [], [18, 19], [], [], [], []],
            'notice_hours' => 24,
            'booking_window_days' => 30,
            'break_minutes' => 0,
            'max_sessions_per_day' => null,
            'free_cancellation_hours' => 48,
            'auto_confirm' => true,
            ...$changes,
        ];
    }

    public function test_the_page_shows_the_saved_hours_and_rules()
    {
        $profile = TrainerProfile::factory()->create(['notice_hours' => 6, 'max_sessions_per_day' => null]);
        $profile->workingHours()->create(['weekday' => 1, 'starts_at' => '18:00', 'ends_at' => '21:00']);

        $this->actingAs($profile->user)
            ->get(route('trainer.availability'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/availability')
                ->has('availability.hours', 7)
                ->where('availability.hours.0', [18, 19, 20])
                ->where('availability.hours.1', [])
                ->where('availability.rules.noticeHours', 6)
                ->where('availability.rules.maxSessionsPerDay', null)
                ->missing('availability.sessionMinutes')
                ->where('availability.autoConfirm', false)
            );
    }

    public function test_the_trainer_saves_hours_and_rules_without_a_new_review()
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome'));
        $profile = TrainerProfile::factory()->bookable()->approved()->create();

        $this->actingAs($profile->user)
            ->from(route('trainer.availability'))
            ->put(route('trainer.availability.update'), $this->payload())
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('trainer.availability'));

        $profile->refresh();
        $this->assertSame(
            [[1, '09:00', '12:00'], [3, '18:00', '20:00']],
            $profile->workingHours()->orderBy('weekday')->get()
                ->map(fn ($range) => [$range->weekday, substr($range->starts_at, 0, 5), substr($range->ends_at, 0, 5)])
                ->all(),
        );
        $this->assertSame(24, $profile->notice_hours);
        $this->assertSame(30, $profile->booking_window_days);
        $this->assertNull($profile->max_sessions_per_day);
        // The durations come with their prices from "Servizi e prezzi": they don't change here.
        $this->assertSame([60, 120], $profile->session_minutes);
        $this->assertTrue($profile->auto_confirm);
        // Hours are not checked by the team: the profile stays public.
        $this->assertSame(TrainerProfileStatus::Approved, $profile->status);
        // The first free slot follows the new hours: Monday 19 October at 9:00.
        $this->assertSame('2026-10-19 09:00', $profile->next_free_slot_at?->setTimezone('Europe/Rome')->format('Y-m-d H:i'));
    }

    public function test_wrong_values_are_refused()
    {
        $profile = TrainerProfile::factory()->bookable()->create();

        $this->actingAs($profile->user)
            ->put(route('trainer.availability.update'), $this->payload([
                'hours' => [[5], [], [], [], [], [], []],
                'notice_hours' => 5,
            ]))
            ->assertSessionHasErrors(['hours.0.0', 'notice_hours']);

        // Nothing changed.
        $this->assertSame(7, $profile->workingHours()->count());
    }

    public function test_a_trainer_without_a_profile_cannot_save()
    {
        $this->actingAs(User::factory()->trainer()->create())
            ->put(route('trainer.availability.update'), $this->payload())
            ->assertNotFound();
    }
}
