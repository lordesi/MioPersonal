<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Saltata": a session is done as soon as it ends; only the trainer can mark
 * it as missed, within 7 days. The client doesn't see it.
 */
class TrainerNoShowTest extends TestCase
{
    use RefreshDatabase;

    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();

        $this->now = CarbonImmutable::parse('2026-10-15 18:00', 'Europe/Rome');
        $this->travelTo($this->now);
    }

    /** Confirmed, from 16:00 to 17:00 today: over one hour ago. */
    private function finishedSession(): Booking
    {
        return Booking::factory()->confirmed()->at($this->now->setTime(16, 0))->create();
    }

    public function test_the_trainer_marks_a_finished_session_as_missed_and_takes_it_back()
    {
        $booking = $this->finishedSession();
        $trainer = $booking->trainerProfile->user;

        $this->actingAs($trainer)
            ->post(route('trainer.sessions.no-show', $booking))
            ->assertSessionHasNoErrors();
        $this->assertNotNull($booking->refresh()->no_show_at);

        $this->actingAs($trainer)
            ->delete(route('trainer.sessions.no-show.destroy', $booking))
            ->assertSessionHasNoErrors();
        $this->assertNull($booking->refresh()->no_show_at);
    }

    public function test_only_the_trainer_of_the_session()
    {
        $booking = $this->finishedSession();

        $this->actingAs(TrainerProfile::factory()->approved()->create()->user)
            ->post(route('trainer.sessions.no-show', $booking))
            ->assertNotFound();

        // Clients don't even reach the trainer area: sent back to theirs.
        $this->actingAs($booking->client)
            ->post(route('trainer.sessions.no-show', $booking))
            ->assertRedirect();

        $this->assertNull($booking->refresh()->no_show_at);
    }

    public function test_not_before_the_end_of_the_session()
    {
        // 17:30–18:30: still going on.
        $booking = Booking::factory()->confirmed()->at($this->now->setTime(17, 30))->create();

        $this->actingAs($booking->trainerProfile->user)
            ->post(route('trainer.sessions.no-show', $booking))
            ->assertSessionHasErrors('booking');

        $this->assertNull($booking->refresh()->no_show_at);
    }

    public function test_not_after_seven_days()
    {
        $booking = $this->finishedSession();
        $this->travelTo($this->now->addDays(7)->addMinute());

        $this->actingAs($booking->trainerProfile->user)
            ->post(route('trainer.sessions.no-show', $booking))
            ->assertSessionHasErrors('booking');

        $this->assertNull($booking->refresh()->no_show_at);
    }

    public function test_the_client_still_sees_the_session_as_done()
    {
        $booking = $this->finishedSession();
        $booking->forceFill(['no_show_at' => now()])->save();

        $this->actingAs($booking->client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('past', 1)
                ->missing('past.0.noShow')
                ->where('past.0.id', $booking->id)
            );
    }

    public function test_panoramica_shows_the_mark_and_the_attendance_of_the_requests()
    {
        $booking = $this->finishedSession();
        $booking->forceFill(['no_show_at' => now()])->save();
        $trainer = $booking->trainerProfile;
        // The same client asks again: the trainer sees how often they show up.
        Booking::factory()->for($trainer)->for($booking->client, 'client')->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                // Today's sessions are in the agenda, the finished ones too.
                ->where('agenda.0.noShow', true)
                ->where('requests.0.attendance', [
                    'platform' => ['rate' => 0, 'sessions' => 1],
                    'withYou' => ['rate' => 0, 'sessions' => 1],
                ])
            );
    }

    public function test_clienti_counts_the_missed_sessions_and_the_attendance()
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $client = User::factory()->create();
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($this->now->subDays(2))->create(['no_show_at' => now()]);
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->at($this->now->subDays(10))->create();

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('clients.0.done', 1)
                ->where('clients.0.missed', 1)
                ->where('clients.0.attendance.withYou', ['rate' => 50, 'sessions' => 2])
            );

        $this->actingAs($trainer->user)
            ->get(route('trainer.clients.show', $client))
            ->assertInertia(fn (Assert $page) => $page
                ->where('client.attendance.platform', ['rate' => 50, 'sessions' => 2])
            );
    }
}
