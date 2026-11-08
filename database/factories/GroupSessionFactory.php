<?php

namespace Database\Factories;

use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionStatus;
use App\Enums\GroupSessionType;
use App\Enums\GymLinkStatus;
use App\Models\City;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A free workshop at an address, tomorrow 10–11, 10 places, without
 * organizers: add one with by().
 *
 * @extends Factory<GroupSession>
 */
class GroupSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = now()->addDay()->setTime(10, 0);

        return [
            'type' => GroupSessionType::Workshop,
            'title' => 'Workshop di '.fake()->word(),
            'description' => fake()->sentence(),
            'city_id' => City::factory(),
            'place' => GroupSessionPlace::Address,
            'address' => 'Parco Sempione',
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHour(),
            'capacity' => 10,
            'offline_seats' => 0,
            'price_cents' => 0,
            'status' => GroupSessionStatus::Published,
        ];
    }

    /** Made by this trainer or gym (accepted owner), in its city. */
    public function by(TrainerProfile|GymProfile $profile): static
    {
        return $this->state(fn (array $attributes) => [
            'city_id' => $profile->city_id ?? $attributes['city_id'],
            'created_by_user_id' => $profile->user_id,
        ])->afterCreating(function (GroupSession $session) use ($profile) {
            $session->hosts()->create([
                $profile instanceof TrainerProfile ? 'trainer_profile_id' : 'gym_profile_id' => $profile->id,
                'is_owner' => true,
                'status' => GymLinkStatus::Accepted,
            ]);
        });
    }

    /** Saved in UTC, as the app does. */
    public function startingAt(\DateTimeInterface $start, int $minutes = 60): static
    {
        return $this->state(fn (array $attributes) => [
            'starts_at' => CarbonImmutable::instance($start)->utc(),
            'ends_at' => CarbonImmutable::instance($start)->utc()->addMinutes($minutes),
        ]);
    }

    public function capacity(int $capacity): static
    {
        return $this->state(fn (array $attributes) => ['capacity' => $capacity]);
    }
}
