<?php

namespace Tests\Feature;

use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `php artisan migrate:fresh --seed` in local: the demo data must load from
 * start to end, with the fields the model events fill (e.g. the username).
 */
class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_demo_data_loads_in_local()
    {
        // The demo seeders run only in local (and on the staging site).
        $this->app->detectEnvironment(fn () => 'local');

        $this->seed(DatabaseSeeder::class);

        $this->assertGreaterThan(0, TrainerProfile::count());
        $this->assertGreaterThan(0, GymProfile::count());
        $this->assertSame(0, User::whereNull('username')->count());
    }
}
