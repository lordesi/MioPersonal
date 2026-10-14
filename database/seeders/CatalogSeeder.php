<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Everything the app needs to work: cities and disciplines.
 * Production: `php artisan db:seed --class=CatalogSeeder` after the first deploy.
 * Tests: `protected string $seeder = CatalogSeeder::class;` with `$seed = true`.
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([CitySeeder::class, DisciplineSeeder::class]);
    }
}
