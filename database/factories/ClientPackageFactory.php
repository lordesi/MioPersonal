<?php

namespace Database\Factories;

use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A bought package of 10 one-hour sessions, without sessions booked yet.
 * Link the bookings with Booking::factory()->for($package).
 *
 * @extends Factory<ClientPackage>
 */
class ClientPackageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => User::factory(),
            'trainer_profile_id' => TrainerProfile::factory()->approved(),
            'name' => 'Pacchetto 10 sedute',
            'price_cents' => 40000,
            'sessions_total' => 10,
            'minutes' => 60,
            'bought_at' => now(),
        ];
    }

    /** The first session is still waiting for the trainer's answer. */
    public function notBought(): static
    {
        return $this->state(fn (array $attributes) => ['bought_at' => null]);
    }
}
