<?php

namespace Database\Factories;

use App\Enums\PlaceType;
use App\Enums\TrainerExperience;
use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\Discipline;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * A trainer profile waiting for the team ("In revisione"), online only.
 * Use the states for the rest: approved(), inCity(), withDisciplines()…
 *
 * @extends Factory<TrainerProfile>
 */
class TrainerProfileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->trainer(),
            'slug' => Str::slug(fake()->unique()->name()),
            'headline' => 'Personal trainer',
            'bio' => fake()->realText(300),
            'experience' => TrainerExperience::TwoToFive,
            'status' => TrainerProfileStatus::Review,
            'status_changed_at' => now(),
            'trains_online' => true,
            'trains_in_person' => false,
            'price_from_cents' => 4000,
            'session_minutes' => [60, 120],
        ];
    }

    /** Public: it shows up in search and home. */
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

    /** Trains in person (studio) in this city, not online. */
    public function inCity(City $city): static
    {
        return $this->state(fn (array $attributes) => [
            'city_id' => $city->id,
            'trains_in_person' => true,
            'trains_online' => false,
        ])->afterCreating(fn (TrainerProfile $profile) => $profile->places()->create([
            'type' => PlaceType::Studio,
            'name' => 'Studio',
            'address' => 'Via Roma 1',
            'city_id' => $city->id,
        ]));
    }

    /** @param  list<string>  $slugs */
    public function withDisciplines(array $slugs): static
    {
        return $this->afterCreating(function (TrainerProfile $profile) use ($slugs) {
            $ids = Discipline::whereIn('slug', $slugs)->pluck('id')->all();
            $profile->disciplines()->sync(array_fill_keys($ids, ['sort' => 0]));
        });
    }

    /**
     * Ready to be booked: every evening 18–21 (Rome), notice of 2 hours, no
     * break between sessions, and a "Seduta singola" of 1 hour (40 €) or
     * 2 hours (75 €): one row for each duration, as SaveTrainerProfile writes them.
     */
    public function bookable(): static
    {
        return $this->state(fn (array $attributes) => [
            'notice_hours' => 2,
            'break_minutes' => 0,
        ])->afterCreating(function (TrainerProfile $profile) {
            foreach (range(1, 7) as $weekday) {
                $profile->workingHours()->create(['weekday' => $weekday, 'starts_at' => '18:00', 'ends_at' => '21:00']);
            }

            foreach ([60 => 4000, 120 => 7500] as $minutes => $cents) {
                $profile->services()->create([
                    'name' => 'Seduta singola',
                    'minutes' => $minutes,
                    'price_cents' => $cents,
                    'fixed_duration' => false,
                    'sort' => $minutes,
                ]);
            }
        });
    }

    /** Average rating, as if the reviews existed (rating_sum / rating_count). */
    public function rated(float $average, int $count): static
    {
        return $this->state(fn (array $attributes) => [
            'rating_count' => $count,
            'rating_sum' => (int) round($average * $count),
        ]);
    }
}
