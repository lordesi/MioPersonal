<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\ClientAttendance;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** How often a client shows up, on all MioPersonal and with one trainer. */
class ClientAttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_counts_the_sessions_over_minus_the_missed_ones()
    {
        $you = TrainerProfile::factory()->approved()->create();
        $other = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create();
        $past = CarbonImmutable::now()->subDays(3);

        // With you: 2 done. With another trainer: 1 done and 1 missed.
        Booking::factory()->count(2)->for($you)->for($client, 'client')->confirmed()->at($past)->create();
        Booking::factory()->for($other)->for($client, 'client')->confirmed()->at($past)->create();
        Booking::factory()->for($other)->for($client, 'client')->confirmed()->at($past)->create(['no_show_at' => now()]);

        // Not counted: still to come, cancelled.
        Booking::factory()->for($you)->for($client, 'client')->confirmed()->at(CarbonImmutable::now()->addDay())->create();
        Booking::factory()->for($you)->for($client, 'client')->status(BookingStatus::Cancelled)->at($past)->create();

        $this->assertSame([
            'platform' => ['rate' => 75, 'sessions' => 4],
            'withYou' => ['rate' => 100, 'sessions' => 2],
        ], ClientAttendance::forClient($client->id, $you));
    }

    public function test_null_before_the_first_session()
    {
        $client = User::factory()->create();

        $this->assertSame(
            ['platform' => null, 'withYou' => null],
            ClientAttendance::forClient($client->id, TrainerProfile::factory()->approved()->create()),
        );
    }
}
