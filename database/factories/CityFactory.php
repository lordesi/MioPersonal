<?php

namespace Database\Factories;

use App\Models\City;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<City>
 */
class CityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->city();

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'province_code' => strtoupper(fake()->lexify('??')),
            'region' => 'Lombardia',
            'lat' => fake()->latitude(36, 47),
            'lng' => fake()->longitude(7, 18),
            'is_active' => true,
        ];
    }
}
