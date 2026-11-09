<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Staging;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Needed in production too: `php artisan db:seed --class=CatalogSeeder`.
        $this->call(CatalogSeeder::class);

        // Example trainers, never in production: in local and on the staging site.
        if (app()->isLocal() || Staging::active()) {
            $this->call(DemoTrainerSeeder::class);
            $this->call(DemoGymSeeder::class);
        }

        // The accounts to try the staging site with (docs/staging.md).
        if (Staging::active()) {
            $this->call(StagingSeeder::class);
        }

        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
