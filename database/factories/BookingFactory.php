<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A one-hour request waiting for the trainer, tomorrow at 10:00 (Rome).
 * Use the states for the rest: at(), confirmed(), expired()…
 *
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = CarbonImmutable::now('Europe/Rome')->startOfDay()->addDay()->setTime(10, 0)->utc();

        return [
            'client_id' => User::factory(),
            'trainer_profile_id' => TrainerProfile::factory()->approved(),
            'starts_at' => $start,
            'ends_at' => $start->addHour(),
            'blocked_until' => $start->addHour(),
            'service_name' => 'Seduta singola',
            'price_cents' => 4500,
            'place_label' => 'Online',
            'status' => BookingStatus::Pending,
            'expires_at' => now()->addDay(),
        ];
    }

    /** Starts at this moment and lasts `$minutes`. */
    public function at(CarbonImmutable $start, int $minutes = 60): static
    {
        $start = $start->utc();

        return $this->state(fn (array $attributes) => [
            'starts_at' => $start,
            'ends_at' => $start->addMinutes($minutes),
            'blocked_until' => $start->addMinutes($minutes),
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BookingStatus::Confirmed,
            'expires_at' => null,
            'confirmed_at' => now(),
        ]);
    }

    /** Pending, but the trainer's time to answer is over. */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => ['expires_at' => now()->subMinute()]);
    }

    public function status(BookingStatus $status): static
    {
        return $this->state(fn (array $attributes) => ['status' => $status]);
    }
}
