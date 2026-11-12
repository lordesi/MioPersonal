<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            // The username itself is given by User::creating, free and from the name.
            'username_chosen_at' => now(),
            'email' => fake()->unique()->safeEmail(),
            // Required for everyone, as saved by the sign-up: "+39" + a 10-digit mobile.
            'phone' => '+39'.fake()->randomElement(['320', '333', '347', '351', '380', '393']).fake()->numerify('#######'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * An account from before the usernames: it must confirm the one it was given.
     */
    public function withoutChosenUsername(): static
    {
        return $this->state(fn (array $attributes) => [
            'username_chosen_at' => null,
        ]);
    }

    /**
     * Indicate that the user is a personal trainer.
     */
    public function trainer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Trainer,
        ]);
    }

    /**
     * Indicate that the user manages a gym.
     */
    public function gym(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Gym,
        ]);
    }

    /**
     * Indicate that the user is part of the MioPersonal team.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Admin,
        ]);
    }
}
