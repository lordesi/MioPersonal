<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Support\ResponseTimes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ResponseTimesTest extends TestCase
{
    use RefreshDatabase;

    /** A request answered after `$minutes`; `$byTrainer` false = confirmed automatically. */
    private function answered(TrainerProfile $profile, int $minutes, string $answer = 'confirmed', bool $byTrainer = true, int $daysAgo = 2): void
    {
        $booking = Booking::factory()->for($profile)->create();
        $requested = now()->subDays($daysAgo);

        DB::table('booking_events')->insert([
            ['booking_id' => $booking->id, 'type' => 'requested', 'actor_id' => $booking->client_id, 'created_at' => $requested],
            ['booking_id' => $booking->id, 'type' => $answer, 'actor_id' => $byTrainer ? $profile->user_id : null, 'created_at' => $requested->copy()->addMinutes($minutes)],
        ]);
    }

    public function test_the_median_of_the_trainer_answers_of_the_last_90_days()
    {
        $profile = TrainerProfile::factory()->approved()->create(['auto_confirm' => false]);
        foreach ([20, 40, 50, 90, 600] as $minutes) {
            $this->answered($profile, $minutes, $minutes === 90 ? 'declined' : 'confirmed');
        }
        // Not counted: automatic confirmations and requests older than 90 days.
        $this->answered($profile, 3000, byTrainer: false);
        $this->answered($profile, 5000, daysAgo: ResponseTimes::DAYS + 5);

        ResponseTimes::refreshAll();

        $this->assertSame(50, $profile->fresh()?->response_minutes);

        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page->where('trainer.responseTimeLabel', 'Risponde in genere entro 1 ora'));
    }

    public function test_too_few_answers_show_nothing_and_clear_an_old_time()
    {
        $profile = TrainerProfile::factory()->approved()->create(['response_minutes' => 30, 'auto_confirm' => false]);
        foreach (range(1, ResponseTimes::MIN_ANSWERS - 1) as $ignored) {
            $this->answered($profile, 30);
        }

        ResponseTimes::refreshAll();

        $this->assertNull($profile->fresh()?->response_minutes);
        $this->get(route('trainers.show', $profile->slug))
            ->assertInertia(fn (Assert $page) => $page->where('trainer.responseTimeLabel', null));
    }

    public function test_the_labels()
    {
        $this->assertSame('Risponde in genere entro 1 ora', ResponseTimes::label(60));
        $this->assertSame('Risponde in genere entro 3 ore', ResponseTimes::label(61));
        $this->assertSame('Risponde in genere entro 12 ore', ResponseTimes::label(700));
        $this->assertSame('Risponde in genere entro un giorno', ResponseTimes::label(2000));
        $this->assertNull(ResponseTimes::label(null));
    }
}
