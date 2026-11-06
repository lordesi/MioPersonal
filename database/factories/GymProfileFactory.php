<?php

namespace Database\Factories;

use App\Enums\GymAmenity;
use App\Enums\GymPlanPeriod;
use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * A gym waiting for the team ("In revisione"), in a new city, with weights
 * and cardio. Use the states for the rest: approved(), inCity(), withPlan()…
 *
 * @extends Factory<GymProfile>
 */
class GymProfileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'Palestra '.fake()->unique()->lastName();

        return [
            'user_id' => User::factory()->gym(),
            'slug' => Str::slug($name),
            'name' => $name,
            'description' => fake()->realText(300),
            'city_id' => City::factory(),
            'address' => 'Via Roma 1',
            'postal_code' => '20121',
            'amenities' => [GymAmenity::Weights->value, GymAmenity::Cardio->value],
            'status' => TrainerProfileStatus::Review,
            'status_changed_at' => now(),
        ];
    }

    /** Public: it shows up in search. */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TrainerProfileStatus::Approved,
            'approved_at' => now(),
        ]);
    }

    public function status(TrainerProfileStatus $status): static
    {
        return $this->state(fn (array $attributes) => ['status' => $status]);
    }

    public function inCity(City $city): static
    {
        return $this->state(fn (array $attributes) => ['city_id' => $city->id]);
    }

    /** @param  list<GymAmenity>  $amenities */
    public function withAmenities(array $amenities): static
    {
        return $this->state(fn (array $attributes) => [
            'amenities' => array_map(fn (GymAmenity $amenity) => $amenity->value, $amenities),
        ]);
    }

    /** One active plan; the monthly price is computed like SaveGymPlans does. */
    public function withPlan(int $priceCents = 4500, GymPlanPeriod $period = GymPlanPeriod::Monthly): static
    {
        return $this->afterCreating(function (GymProfile $gym) use ($priceCents, $period) {
            $gym->plans()->create([
                'name' => 'Open',
                'period' => $period,
                'entries_count' => $period === GymPlanPeriod::Entries ? 10 : null,
                'price_cents' => $priceCents,
                'features' => ['Sala pesi', 'Area cardio'],
            ]);
            $gym->refreshMonthlyFrom();
        });
    }

    /** Monday to Friday 7–22, Saturday 9–18, closed on Sunday. */
    public function withHours(): static
    {
        return $this->afterCreating(function (GymProfile $gym) {
            foreach (range(1, 5) as $weekday) {
                $gym->openingHours()->create(['weekday' => $weekday, 'opens_at' => '07:00', 'closes_at' => '22:00']);
            }

            $gym->openingHours()->create(['weekday' => 6, 'opens_at' => '09:00', 'closes_at' => '18:00']);
        });
    }
}
