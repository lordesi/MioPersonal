<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\Sequence;

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
            // An hour after the start, and blocked until the end (no break): given
            // only `starts_at` and `ends_at`, the booking still takes only its own time.
            'ends_at' => fn (array $attributes) => CarbonImmutable::parse($attributes['starts_at'])->addHour(),
            'blocked_until' => fn (array $attributes) => $attributes['ends_at'],
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

    /**
     * Several bookings of the same trainer, an hour apart from `$from` (by
     * default tomorrow at 10:00 Rome), `$skip` hours later for the ones made
     * before. On PostgreSQL two active bookings of a trainer can't overlap
     * (bookings_no_overlap), as on the real site.
     */
    public function apart(?CarbonImmutable $from = null, int $skip = 0, int $minutes = 60): static
    {
        $from = ($from ?? CarbonImmutable::now('Europe/Rome')->startOfDay()->addDay()->setTime(10, 0))->utc();

        return $this->sequence(function (Sequence $sequence) use ($from, $skip, $minutes) {
            $start = $from->addHours($skip + $sequence->index);

            return [
                'starts_at' => $start,
                'ends_at' => $start->addMinutes($minutes),
                'blocked_until' => $start->addMinutes($minutes),
            ];
        });
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
