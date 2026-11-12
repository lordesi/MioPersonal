<?php

namespace Tests\Feature;

use App\Actions\Trainer\SaveTrainerServices;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ServiceBookings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Il più prenotato", the numbers of "Servizi e prezzi" and of Admin · Statistiche. */
class ServiceBookingsTest extends TestCase
{
    use RefreshDatabase;

    private TrainerProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->profile = TrainerProfile::factory()->approved()->bookable()->create()->fresh() ?? $this->fail();
        app(SaveTrainerServices::class)->handle($this->profile, [
            'sessions' => [
                ['name' => 'Seduta singola', 'prices' => [['minutes' => 60, 'price_cents' => 5000]], 'note' => ''],
                ['name' => 'Calisthenics', 'prices' => [['minutes' => 90, 'price_cents' => 6000]], 'note' => ''],
            ],
            'first_session' => null,
            'packages' => [],
        ]);
    }

    private function service(string $name): Service
    {
        return $this->profile->services()->where('name', $name)->sole();
    }

    private function confirmed(string $name, int $times, array $attributes = []): void
    {
        Booking::factory()->for($this->profile)->confirmed()->count($times)->create([
            'service_id' => $this->service($name)->id,
            'service_name' => $name,
            ...$attributes,
        ]);
    }

    /** @return list<bool> */
    private function badges(): array
    {
        $flags = [];
        $this->get(route('trainers.show', $this->profile->slug))
            ->assertInertia(function (Assert $page) use (&$flags) {
                $flags = collect($page->toArray()['props']['trainer']['services'])->mapWithKeys(fn ($service) => [$service['name'] => $service['mostBooked']])->all();
            });

        return $flags;
    }

    public function test_the_most_booked_service_from_the_threshold_up()
    {
        $this->confirmed('Calisthenics', ServiceBookings::MOST_BOOKED_MIN - 1);
        // Not counted: cancelled, never confirmed, older than 90 days.
        $this->confirmed('Seduta singola', 3, ['status' => BookingStatus::Cancelled]);
        Booking::factory()->for($this->profile)->count(3)->create(['service_id' => $this->service('Seduta singola')->id]);
        $this->confirmed('Seduta singola', 3, ['confirmed_at' => now()->subDays(ServiceBookings::DAYS + 1)]);

        $this->assertSame(['Seduta singola' => false, 'Calisthenics' => false], $this->badges());

        $this->confirmed('Calisthenics', 1);

        $this->assertSame(['Seduta singola' => false, 'Calisthenics' => true], $this->badges());
    }

    public function test_the_trainer_and_the_team_see_the_numbers()
    {
        $this->confirmed('Seduta singola', 2);
        $this->confirmed('Calisthenics', 3);

        $this->actingAs($this->profile->user)
            ->get(route('trainer.services'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('booked', [
                    ['label' => 'Calisthenics · 90 min', 'count' => 3],
                    ['label' => 'Seduta singola · 60 min', 'count' => 2],
                ])
            );

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.stats'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.demand.services.0', ['source' => 'Calisthenics · 90 min', 'count' => 3])
            );
    }
}
