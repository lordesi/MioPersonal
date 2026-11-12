<?php

namespace Tests\Feature;

use App\Actions\Trainer\LinkClient;
use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\City;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingChanged;
use App\Notifications\BookingConfirmed;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Aggiungi seduta" in the trainer's calendar: confirmed at once with someone
 * without an account, a proposal the client answers for who has one.
 */
class TrainerManualSessionTest extends TestCase
{
    use RefreshDatabase;

    private TrainerProfile $trainer;

    private User $client;

    private TrainerClient $registered;

    private TrainerClient $offApp;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        // Monday 19 October 2026, 08:00 in Rome.
        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));

        $this->trainer = TrainerProfile::factory()->approved()->bookable()->inCity(City::factory()->create())->create();
        $this->client = User::factory()->create();
        $this->registered = $this->trainer->clientRecords()->create(['name' => $this->client->name, 'user_id' => $this->client->id]);
        $this->offApp = $this->trainer->clientRecords()->create(['name' => 'Marco Rossi', 'phone' => '333 1234567']);
    }

    private function serviceId(): int
    {
        return (int) $this->trainer->services()->where('kind', 'session')->value('id');
    }

    /** @param array<string, mixed> $overrides */
    private function add(array $overrides = [])
    {
        return $this->actingAs($this->trainer->user)->post(route('trainer.calendar.sessions.store'), [
            'client_record_id' => $this->offApp->id,
            'service_id' => $this->serviceId(),
            // Outside the open hours (18–21): the trainer chose it.
            'date' => '2026-10-20',
            'time' => '07:30',
            'minutes' => 60,
            ...$overrides,
        ]);
    }

    public function test_a_session_with_someone_without_an_account_is_confirmed_at_once()
    {
        $this->add()->assertSessionHasNoErrors()->assertInertiaFlash('invitePrompt.name', 'Marco Rossi');

        $booking = Booking::firstOrFail();
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertSame(BookingActor::Trainer, $booking->requested_by);
        $this->assertNull($booking->client_id);
        $this->assertSame($this->offApp->id, $booking->trainer_client_id);
        $this->assertSame('2026-10-20T05:30:00Z', $booking->starts_at->utc()->format('Y-m-d\TH:i:s\Z'));
        Notification::assertNothingSent();

        $this->actingAs($this->trainer->user)
            ->get(route('trainer.calendar', ['giorno' => '2026-10-20']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('events.0.clientName', 'Marco Rossi')
                ->where('events.0.offApp', true)
                ->where('events.0.kind', 'confirmed'));
    }

    public function test_a_new_client_can_be_added_in_the_same_step()
    {
        $this->add(['client_record_id' => null, 'new_client' => ['name' => 'Giulia Bianchi', 'email' => 'giulia@example.com']])
            ->assertSessionHasNoErrors();

        $record = $this->trainer->clientRecords()->where('name', 'Giulia Bianchi')->firstOrFail();
        $this->assertSame('giulia@example.com', $record->email);
        $this->assertSame($record->id, Booking::firstOrFail()->trainer_client_id);
    }

    public function test_the_invite_step_can_be_turned_off_for_a_client()
    {
        $this->actingAs($this->trainer->user)
            ->post(route('trainer.clients.invite-prompt.dismiss', $this->offApp))
            ->assertRedirect();

        $this->assertNotNull($this->offApp->fresh()->invite_prompt_dismissed_at);
        $this->add()->assertSessionHasNoErrors()->assertInertiaFlashMissing('invitePrompt');

        $other = TrainerProfile::factory()->approved()->create();
        $this->actingAs($other->user)
            ->post(route('trainer.clients.invite-prompt.dismiss', $this->offApp))
            ->assertNotFound();
    }

    public function test_a_session_with_a_client_on_the_app_is_a_proposal_the_client_answers()
    {
        $this->add(['client_record_id' => $this->registered->id])
            ->assertSessionHasNoErrors()
            ->assertInertiaFlashMissing('invitePrompt');

        $booking = Booking::firstOrFail();
        $this->assertSame(BookingStatus::Pending, $booking->status);
        $this->assertSame($this->client->id, $booking->client_id);
        $this->assertTrue($booking->isTrainerProposal());
        Notification::assertSentTo($this->client, BookingChanged::class, fn (BookingChanged $notification) => $notification->kind === 'trainer-proposed');

        // Not a request for the trainer.
        $this->actingAs($this->trainer->user)->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page->has('requests', 0)->where('trainerArea.pendingCount', 0));
        $this->actingAs($this->trainer->user)->post(route('trainer.requests.accept', $booking))->assertNotFound();

        // The client sees it to answer.
        $this->actingAs($this->client)->get(route('client.bookings'))
            ->assertInertia(fn (Assert $page) => $page->where('pending.0.fromTrainer', true));

        $this->actingAs($this->client)->post(route('client.bookings.proposal.accept', $booking))->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        Notification::assertSentTo($this->trainer->user, BookingChanged::class, fn (BookingChanged $notification) => $notification->kind === 'proposal-accepted');
        Notification::assertNotSentTo($this->client, BookingConfirmed::class);
    }

    public function test_the_client_can_decline_and_nobody_else_can_answer()
    {
        $this->add(['client_record_id' => $this->registered->id]);
        $booking = Booking::firstOrFail();

        $this->actingAs(User::factory()->create())->post(route('client.bookings.proposal.accept', $booking))->assertNotFound();

        $this->actingAs($this->client)->delete(route('client.bookings.proposal.decline', $booking))->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Declined, $booking->fresh()->status);
        Notification::assertSentTo($this->trainer->user, BookingChanged::class, fn (BookingChanged $notification) => $notification->kind === 'proposal-declined');

        // Gone from the client's page.
        $this->actingAs($this->client)->get(route('client.bookings'))
            ->assertInertia(fn (Assert $page) => $page->has('pending', 0));
    }

    public function test_an_unanswered_proposal_lapses_when_the_session_starts()
    {
        $this->add(['client_record_id' => $this->registered->id]);

        $this->travelTo(CarbonImmutable::parse('2026-10-20 07:31', 'Europe/Rome'));
        $this->artisan('bookings:expire')->assertSuccessful();

        $this->assertSame(BookingStatus::Expired, Booking::firstOrFail()->status);
    }

    public function test_an_overlapping_session_is_refused()
    {
        $this->add()->assertSessionHasNoErrors();

        $this->add(['time' => '08:00', 'client_record_id' => $this->registered->id])->assertSessionHasErrors('start');
        $this->assertSame(1, Booking::count());
    }

    public function test_another_trainers_client_or_a_past_time_is_refused()
    {
        $other = TrainerProfile::factory()->approved()->create();
        $theirs = $other->clientRecords()->create(['name' => 'Altro']);

        $this->add(['client_record_id' => $theirs->id])->assertNotFound();
        $this->add(['date' => '2026-10-18'])->assertSessionHasErrors('start');
        $this->assertSame(0, Booking::count());
    }

    public function test_the_trainer_can_withdraw_a_proposal_or_remove_an_off_app_session()
    {
        $this->add(['client_record_id' => $this->registered->id]);
        $this->add(['time' => '10:00']);
        [$proposal, $offApp] = Booking::orderBy('id')->get()->all();

        $this->actingAs($this->trainer->user)->delete(route('trainer.calendar.sessions.destroy', $proposal))->assertSessionHasNoErrors();
        $this->actingAs($this->trainer->user)->delete(route('trainer.calendar.sessions.destroy', $offApp))->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Cancelled, $proposal->fresh()->status);
        $this->assertSame(BookingStatus::Cancelled, $offApp->fresh()->status);

        // A withdrawn proposal is not "Annullata dal trainer" for the client.
        $this->actingAs($this->client)->get(route('client.bookings'))
            ->assertInertia(fn (Assert $page) => $page->has('pending', 0));
    }

    public function test_the_sessions_become_the_clients_when_they_sign_up_with_the_personal_link()
    {
        $this->add()->assertSessionHasNoErrors();
        $marco = User::factory()->create();

        app(LinkClient::class)->claimToken($this->trainer, $marco, $this->offApp->invite_token);

        $booking = Booking::firstOrFail();
        $this->assertSame($marco->id, $booking->client_id);

        $this->actingAs($marco)->get(route('client.bookings'))
            ->assertInertia(fn (Assert $page) => $page->has('upcoming', 1));
    }

    public function test_a_client_with_sessions_to_come_cannot_be_removed()
    {
        $this->add()->assertSessionHasNoErrors();

        $this->actingAs($this->trainer->user)
            ->delete(route('trainer.clients.destroy', $this->offApp))
            ->assertSessionHasErrors('client');
    }
}
