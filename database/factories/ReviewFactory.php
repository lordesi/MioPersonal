<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A 5-star review by a new client, without a booking. Use the states for the
 * rest: rating(), hidden().
 *
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'trainer_profile_id' => TrainerProfile::factory()->approved(),
            'client_id' => User::factory(),
            'rating' => 5,
            'text' => fake()->realText(160),
        ];
    }

    public function rating(int $stars): static
    {
        return $this->state(fn (array $attributes) => ['rating' => $stars]);
    }

    /** Hidden by the team: off the profile and the average. */
    public function hidden(): static
    {
        return $this->state(fn (array $attributes) => ['hidden_at' => now()]);
    }
}
