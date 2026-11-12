<?php

namespace Tests\Feature;

use App\Actions\Trainer\LinkClient;
use App\Models\Booking;
use App\Models\City;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\TrainerNoteShared;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Condividi i miei progressi" and "Nota per il cliente", between a client and a trainer. */
class ProgressSharingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-11-12 10:00', 'Europe/Rome'));
    }

    private function trainer(): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->bookable()->inCity(City::factory()->create())->create();
    }

    /** A client with a session done with the trainer, and a training of their own. */
    private function clientOf(TrainerProfile $trainer): TrainerClient
    {
        $client = User::factory()->create();
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()
            ->at(CarbonImmutable::parse('2026-11-10 18:00', 'Europe/Rome'))->create();
        $client->activityLogs()->create(['done_on' => '2026-11-11', 'kind' => 'running']);

        return app(LinkClient::class)->forBooking($trainer, $client, false);
    }

    /** @return array<string, mixed> the client's card in the trainer's "Clienti" */
    private function card(TrainerProfile $trainer, User $client): array
    {
        $clients = $this->actingAs($trainer->user)->get(route('trainer.clients'))->inertiaProps('clients');

        return collect($clients)->firstWhere('id', $client->id);
    }

    public function test_the_trainer_sees_nothing_until_the_client_shares()
    {
        $trainer = $this->trainer();
        $record = $this->clientOf($trainer);

        $this->assertNull($this->card($trainer, $record->user)['progress']);

        $this->actingAs($record->user)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('sharing', 1)
                ->where('sharing.0.recordId', $record->id)
                ->where('sharing.0.shared', false));

        $this->patch(route('client.sharing.update', $record), ['shared' => true])->assertSessionHasNoErrors();
        $this->assertNotNull($record->refresh()->progress_shared_at);

        $progress = $this->card($trainer, $record->user)['progress'];
        $this->assertSame(2, $progress['thisWeek']);
        $this->assertSame('Corsa', $progress['recent'][0]['label']);
        // The trainer never deletes the client's trainings.
        $this->assertNull($progress['recent'][0]['logId']);
        // No consent to body data: no weight.
        $this->assertNull($progress['weights']);

        $this->actingAs($record->user)->patch(route('client.sharing.update', $record), ['shared' => false]);
        $this->assertNull($this->card($trainer, $record->user)['progress']);
    }

    public function test_a_session_with_another_trainer_loses_the_name()
    {
        $trainer = $this->trainer();
        $record = $this->clientOf($trainer);
        $other = $this->trainer();
        Booking::factory()->for($other)->for($record->user, 'client')->confirmed()
            ->at(CarbonImmutable::parse('2026-11-12 08:00', 'Europe/Rome'))->create();
        $record->forceFill(['progress_shared_at' => now()])->save();

        $labels = collect($this->card($trainer, $record->user)['progress']['recent'])->pluck('label');

        $this->assertContains('Seduta con un altro trainer', $labels);
        $this->assertContains('Seduta con '.$trainer->user->first_name, $labels);
        $this->assertNotContains('Seduta con '.$other->user->first_name, $labels);
    }

    public function test_a_client_shares_only_with_their_own_trainers()
    {
        $trainer = $this->trainer();
        $record = $this->clientOf($trainer);
        $stranger = User::factory()->create();

        // Someone else's row.
        $this->actingAs($stranger)->patch(route('client.sharing.update', $record), ['shared' => true])->assertNotFound();

        // A row without a confirmed session: only a request.
        $requested = $this->trainer();
        Booking::factory()->for($requested)->for($stranger, 'client')->create();
        $row = app(LinkClient::class)->forBooking($requested, $stranger, false);
        $this->patch(route('client.sharing.update', $row), ['shared' => true])->assertNotFound();

        $this->assertNull($record->refresh()->progress_shared_at);
        $this->assertNull($row->refresh()->progress_shared_at);
    }

    public function test_the_note_for_the_client_reaches_the_bell_and_the_overview()
    {
        Notification::fake();
        $trainer = $this->trainer();
        $record = $this->clientOf($trainer);

        $this->actingAs($trainer->user)
            ->patch(route('trainer.clients.update', $record), ['shared_note' => 'Ottima settimana!'])
            ->assertSessionHasNoErrors();

        Notification::assertSentTo($record->user, TrainerNoteShared::class);
        $this->assertSame('Ottima settimana!', $record->refresh()->shared_note);

        // Saving the private notes doesn't send it again.
        $this->patch(route('trainer.clients.update', $record), ['notes' => 'Ginocchio sinistro', 'shared_note' => 'Ottima settimana!']);
        Notification::assertSentToTimes($record->user, TrainerNoteShared::class, 1);

        $this->actingAs($record->user)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('notes', 1)
                ->where('notes.0.note', 'Ottima settimana!')
                ->where('notes.0.trainerName', $trainer->user->name)
                // The private notes stay the trainer's.
                ->missing('notes.0.private_notes'));
    }

    public function test_no_note_for_who_has_no_account()
    {
        $trainer = $this->trainer();
        $manual = $trainer->clientRecords()->create(['name' => 'Luca Verdi']);

        $this->actingAs($trainer->user)
            ->patch(route('trainer.clients.update', $manual), ['shared_note' => 'Ciao'])
            ->assertSessionHasErrors('shared_note');
    }
}
