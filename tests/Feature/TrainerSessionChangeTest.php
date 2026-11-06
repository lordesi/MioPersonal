<?php

namespace Tests\Feature;

use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingChanged;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * The trainer cancels a confirmed session or proposes another time
 * ("Sposta"); the client accepts it or keeps the old one.
 */
class TrainerSessionChangeTest extends TestCase
{
    use RefreshDatabase;

    private TrainerProfile $profile;

    private User $client;

    private Booking $booking;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        // Monday 9 November 2026, 10:00 in Rome. The trainer works 18–21.
        $this->travelTo(CarbonImmutable::parse('2026-11-09 10:00', 'Europe/Rome'));

        $this->profile = TrainerProfile::factory()->approved()->bookable()->create();
        $this->client = User::factory()->create();
        $this->booking = Booking::factory()->confirmed()
            ->at($this->rome('2026-11-10 18:00'))
            ->create(['client_id' => $this->client->id, 'trainer_profile_id' => $this->profile->id]);
    }

    private function rome(string $time): CarbonImmutable
    {
        return CarbonImmutable::parse($time, 'Europe/Rome');
    }

    private function propose(string $time): TestResponse
    {
        return $this->actingAs($this->profile->user)
            ->post(route('trainer.sessions.reschedule', $this->booking), ['start' => $this->rome($time)->toIso8601String()]);
    }

    public function test_the_trainer_cancels_with_a_message_for_the_client(): void
    {
        $this->actingAs($this->profile->user)
            ->patch(route('trainer.sessions.cancel', $this->booking), ['note' => 'Ho la febbre, scusami!'])
            ->assertRedirect();

        $booking = $this->booking->fresh();
        $this->assertSame(BookingStatus::Cancelled, $booking->status);
        $this->assertSame(BookingActor::Trainer, $booking->cancelled_by);
        $this->assertSame('Ho la febbre, scusami!', $booking->cancel_note);

        Notification::assertSentTo($this->client, BookingChanged::class, fn (BookingChanged $n) => $n->kind === 'cancelled-by-trainer');
    }

    public function test_another_trainer_and_past_sessions_cannot_be_changed(): void
    {
        $other = TrainerProfile::factory()->approved()->create();

        $this->actingAs($other->user)
            ->patch(route('trainer.sessions.cancel', $this->booking))
            ->assertNotFound();

        $this->travelTo($this->rome('2026-11-10 18:30'));
        $this->actingAs($this->profile->user)
            ->patch(route('trainer.sessions.cancel', $this->booking))
            ->assertSessionHasErrors('booking');
    }

    public function test_a_proposal_holds_the_new_time_and_the_client_accepts_it(): void
    {
        $this->propose('2026-11-11 19:00')->assertSessionHasNoErrors();

        $booking = $this->booking->fresh();
        $this->assertTrue($booking->proposed_starts_at->equalTo($this->rome('2026-11-11 19:00')));
        // Until the client answers, the old time holds…
        $this->assertTrue($booking->starts_at->equalTo($this->rome('2026-11-10 18:00')));
        // …and nobody else can book the new one.
        $this->assertFalse(TrainerSlots::isFree($this->profile->fresh(), $this->rome('2026-11-11 19:00'), 60));
        Notification::assertSentTo($this->client, BookingChanged::class, fn (BookingChanged $n) => $n->kind === 'proposed');

        $this->actingAs($this->client)
            ->post(route('client.bookings.reschedule.accept', $this->booking))
            ->assertSessionHasNoErrors();

        $booking = $this->booking->fresh();
        $this->assertTrue($booking->starts_at->equalTo($this->rome('2026-11-11 19:00')));
        $this->assertTrue($booking->ends_at->equalTo($this->rome('2026-11-11 20:00')));
        $this->assertNull($booking->proposed_starts_at);
        // The old time is free again.
        $this->assertTrue(TrainerSlots::isFree($this->profile->fresh(), $this->rome('2026-11-10 18:00'), 60));
        Notification::assertSentTo($this->profile->user, BookingChanged::class, fn (BookingChanged $n) => $n->kind === 'accepted');
    }

    public function test_the_client_keeps_the_old_time(): void
    {
        $this->propose('2026-11-11 19:00');

        $this->actingAs($this->client)
            ->delete(route('client.bookings.reschedule.decline', $this->booking))
            ->assertSessionHasNoErrors();

        $booking = $this->booking->fresh();
        $this->assertNull($booking->proposed_starts_at);
        $this->assertTrue($booking->starts_at->equalTo($this->rome('2026-11-10 18:00')));
        $this->assertTrue(TrainerSlots::isFree($this->profile->fresh(), $this->rome('2026-11-11 19:00'), 60));
        Notification::assertSentTo($this->profile->user, BookingChanged::class, fn (BookingChanged $n) => $n->kind === 'declined');
    }

    public function test_only_a_free_time_can_be_proposed(): void
    {
        Booking::factory()->confirmed()->at($this->rome('2026-11-11 19:00'))
            ->create(['trainer_profile_id' => $this->profile->id]);

        $this->propose('2026-11-11 19:00')->assertSessionHasErrors('start');
        // Outside the working hours.
        $this->propose('2026-11-11 08:00')->assertSessionHasErrors('start');
        // Its own time minus nothing: moving by one hour is fine, its old time doesn't block it.
        $this->propose('2026-11-10 19:00')->assertSessionHasNoErrors();
    }

    public function test_an_unanswered_proposal_lapses(): void
    {
        $this->propose('2026-11-12 19:00');

        // It expires when the session starts (sooner than 48 hours).
        $this->travelTo($this->rome('2026-11-10 18:01'));
        $this->artisan('bookings:expire')->assertSuccessful();

        $this->assertNull($this->booking->fresh()->proposed_starts_at);
        $this->actingAs($this->client)
            ->post(route('client.bookings.reschedule.accept', $this->booking))
            ->assertSessionHasErrors('booking');
    }

    public function test_during_a_proposal_the_client_can_cancel_for_free(): void
    {
        // Past the free cancellation (24 hours before).
        $this->travelTo($this->rome('2026-11-10 09:00'));
        $this->propose('2026-11-11 19:00');

        $this->actingAs($this->client)
            ->patch(route('client.bookings.cancel', $this->booking))
            ->assertSessionHasNoErrors();

        $booking = $this->booking->fresh();
        $this->assertSame(BookingStatus::Cancelled, $booking->status);
        $this->assertNull($booking->proposed_starts_at);
        Notification::assertSentTo($this->profile->user, BookingChanged::class, fn (BookingChanged $n) => $n->kind === 'cancelled-by-client');
    }

    public function test_the_trainer_withdraws_the_proposal(): void
    {
        $this->propose('2026-11-11 19:00');

        $this->actingAs($this->profile->user)
            ->delete(route('trainer.sessions.reschedule.withdraw', $this->booking))
            ->assertRedirect();

        $this->assertNull($this->booking->fresh()->proposed_starts_at);
    }

    public function test_the_emails_render(): void
    {
        $this->propose('2026-11-11 19:00');
        $booking = $this->booking->fresh();

        foreach (['cancelled-by-trainer', 'cancelled-by-client', 'proposed', 'accepted', 'declined'] as $kind) {
            $html = (new BookingChanged($booking, $kind))->toMail($this->client)->render();
            $this->assertStringContainsString('MioPersonal', (string) $html);
        }
    }
}
