<?php

namespace Tests\Feature;

use App\Actions\Trainer\RelinkServices;
use App\Actions\Trainer\SaveTrainerServices;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Servizi e prezzi" keeps its rows: bookings, "sedute fisse" and packages
 * stay linked to the service when the trainer changes prices or takes a
 * service away.
 */
class ServiceHistoryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  list<array{name: string, prices: list<array{minutes: int, price_cents: int}>}>|null  $sessions
     * @return array<string, mixed>
     */
    private function data(?array $sessions = null): array
    {
        return [
            'sessions' => $sessions ?? [
                ['name' => 'Seduta singola', 'prices' => [['minutes' => 60, 'price_cents' => 5000]], 'note' => ''],
                ['name' => 'Calisthenics', 'prices' => [['minutes' => 90, 'price_cents' => 6000]], 'note' => ''],
            ],
            'first_session' => null,
            'packages' => [],
        ];
    }

    private function save(TrainerProfile $profile, array $data): void
    {
        app(SaveTrainerServices::class)->handle($profile->fresh() ?? $profile, $data);
    }

    private function trainer(): TrainerProfile
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $this->save($profile, $this->data());

        return $profile;
    }

    private function service(TrainerProfile $profile, string $name): Service
    {
        return $profile->services()->where('name', $name)->sole();
    }

    public function test_a_new_price_keeps_the_same_service()
    {
        $profile = $this->trainer();
        $single = $this->service($profile, 'Seduta singola');

        $this->save($profile, $this->data([
            ['name' => 'Seduta singola', 'prices' => [['minutes' => 60, 'price_cents' => 5500]], 'note' => 'Al parco'],
            ['name' => 'Calisthenics', 'prices' => [['minutes' => 90, 'price_cents' => 6000]], 'note' => ''],
        ]));

        $single->refresh();
        $this->assertSame(5500, $single->price_cents);
        $this->assertSame('Al parco', $single->note);
        $this->assertTrue($single->is_active);
        $this->assertSame(2, $profile->services()->count());
    }

    public function test_a_service_taken_away_is_hidden_when_booked_and_deleted_otherwise()
    {
        $profile = $this->trainer();
        $single = $this->service($profile, 'Seduta singola');
        $calisthenics = $this->service($profile, 'Calisthenics');
        $booking = Booking::factory()->for($profile)->create(['service_id' => $single->id, 'service_name' => 'Seduta singola']);

        $this->save($profile, $this->data([
            ['name' => 'Pilates', 'prices' => [['minutes' => 60, 'price_cents' => 4000]], 'note' => ''],
        ]));

        $this->assertFalse($single->fresh()?->is_active);
        $this->assertNull($calisthenics->fresh());
        $this->assertSame($single->id, $booking->fresh()?->service_id);
        // Only the active ones count for the search.
        $this->assertSame(4000, $profile->fresh()?->price_from_cents);
        $this->assertSame([60], $profile->fresh()?->session_minutes);
    }

    public function test_a_hidden_service_is_not_shown_nor_bookable_and_comes_back_when_added_again()
    {
        $profile = $this->trainer();
        $single = $this->service($profile, 'Seduta singola');
        Booking::factory()->for($profile)->create(['service_id' => $single->id, 'service_name' => 'Seduta singola']);

        $this->save($profile, $this->data([
            ['name' => 'Calisthenics', 'prices' => [['minutes' => 90, 'price_cents' => 6000]], 'note' => ''],
        ]));

        $this->actingAs($profile->user)
            ->get(route('trainer.services'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('pricing.sessions', 1)
                ->where('pricing.sessions.0.name', 'Calisthenics')
            );
        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page->where('trainer.services', fn ($services) => collect($services)->pluck('name')->doesntContain('Seduta singola')));

        // Added again with the same name and duration: the same row, active again.
        $this->save($profile, $this->data());
        $this->assertTrue($single->fresh()?->is_active);
    }

    public function test_relink_gives_back_the_service_only_when_there_is_one_match()
    {
        $profile = $this->trainer();
        $single = $this->service($profile, 'Seduta singola');
        $lost = Booking::factory()->for($profile)->at(now()->addDay()->startOfHour(), 60)->create(['service_id' => null, 'service_name' => 'Seduta singola']);
        $otherDuration = Booking::factory()->for($profile)->at(now()->addDays(2)->startOfHour(), 45)->create(['service_id' => null, 'service_name' => 'Seduta singola']);
        $series = (new BookingSeries)->forceFill([
            'trainer_profile_id' => $profile->id, 'client_id' => User::factory()->create()->id, 'service_id' => null,
            'service_name' => 'Calisthenics', 'price_cents' => 6000, 'minutes' => 90, 'weekday' => 1,
            'start_time' => '18:00', 'starts_on' => now()->toDateString(),
        ]);
        $series->save();

        $dryRun = app(RelinkServices::class)->handle(false);
        $this->assertSame(['relinked' => 2, 'ambiguous' => 0, 'missing' => 1], $dryRun);
        $this->assertNull($lost->fresh()?->service_id);

        app(RelinkServices::class)->handle(true);

        $this->assertSame($single->id, $lost->fresh()?->service_id);
        $this->assertNull($otherDuration->fresh()?->service_id);
        $this->assertSame($this->service($profile, 'Calisthenics')->id, $series->fresh()?->service_id);
    }
}
