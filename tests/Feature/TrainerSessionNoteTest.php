<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Aggiungi nota" on a session: only the trainer writes it and reads it. */
class TrainerSessionNoteTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_trainer_writes_a_note_and_finds_it_on_home()
    {
        $now = CarbonImmutable::parse('2026-10-15 09:00', 'Europe/Rome');
        $this->travelTo($now);
        $booking = Booking::factory()->confirmed()->at($now->setTime(7, 0))->create();
        $trainer = $booking->trainerProfile->user;

        $this->actingAs($trainer)
            ->patch(route('trainer.sessions.note', $booking), ['note' => '  Sparring leggero, ottimo ritmo.  '])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame('Sparring leggero, ottimo ritmo.', $booking->fresh()->trainer_note);

        $this->actingAs($trainer)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page->where('daySessions.0.trainerNote', 'Sparring leggero, ottimo ritmo.'));

        // An empty note takes it away.
        $this->actingAs($trainer)->patch(route('trainer.sessions.note', $booking), ['note' => '']);
        $this->assertNull($booking->fresh()->trainer_note);
    }

    public function test_the_note_has_a_limit()
    {
        $booking = Booking::factory()->confirmed()->create();

        $this->actingAs($booking->trainerProfile->user)
            ->patch(route('trainer.sessions.note', $booking), ['note' => str_repeat('a', 1001)])
            ->assertSessionHasErrors('note');
    }

    public function test_nobody_else_writes_on_the_session()
    {
        $booking = Booking::factory()->confirmed()->create();

        $this->actingAs(TrainerProfile::factory()->approved()->create()->user)
            ->patch(route('trainer.sessions.note', $booking), ['note' => 'Ciao'])
            ->assertNotFound();

        // The client is not in the trainer area at all: sent away by the role check.
        $this->actingAs($booking->client)
            ->patch(route('trainer.sessions.note', $booking), ['note' => 'Ciao'])
            ->assertRedirect();

        $this->assertNull($booking->fresh()->trainer_note);
    }

    public function test_a_request_still_waiting_has_no_note()
    {
        $booking = Booking::factory()->create();

        $this->actingAs($booking->trainerProfile->user)
            ->patch(route('trainer.sessions.note', $booking), ['note' => 'Ciao'])
            ->assertNotFound();
    }
}
