<?php

namespace Tests\Feature;

use App\Actions\Trainer\DeleteTrainerProfile;
use App\Actions\Trainer\LinkClient;
use App\Models\Booking;
use App\Models\City;
use App\Models\ClientPayment;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Clienti": the trainer's own list, with people added by hand, private notes and payments. */
class TrainerClientRecordsTest extends TestCase
{
    use RefreshDatabase;

    /** Monday 19 October 2026, 18:00 in Rome (summer time, UTC+2). */
    private const SLOT = '2026-10-19T16:00:00Z';

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));
    }

    private function trainer(): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->bookable()->inCity(City::factory()->create())->create();
    }

    public function test_a_client_who_booked_has_a_record_made_the_first_time_the_list_is_opened()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create(['name' => 'Marco Verdi']);
        Booking::factory()->for($trainer)->for($client, 'client')->confirmed()->create();

        $this->actingAs($trainer->user)->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('clients', 1)
                ->where('clients.0.id', $client->id)
                ->where('clients.0.registered', true)
                ->where('clients.0.inviteLink', null));

        $this->assertDatabaseHas('trainer_clients', ['trainer_profile_id' => $trainer->id, 'user_id' => $client->id]);
    }

    public function test_the_trainer_adds_a_list_of_clients_by_hand()
    {
        $trainer = $this->trainer();

        $this->actingAs($trainer->user)->post(route('trainer.clients.store'), [
            'list' => "Marco Rossi, 333 1234567\nGiulia Bianchi; giulia@example.com\n\nLuca Verdi",
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('trainer_clients', ['name' => 'Marco Rossi', 'phone' => '333 1234567', 'user_id' => null]);
        $this->assertDatabaseHas('trainer_clients', ['name' => 'Giulia Bianchi', 'email' => 'giulia@example.com']);
        $this->assertDatabaseHas('trainer_clients', ['name' => 'Luca Verdi', 'email' => null, 'phone' => null]);

        $this->get(route('trainer.clients'))->assertInertia(fn (Assert $page) => $page
            ->has('clients', 3)
            ->where('clients.0.id', null)
            ->where('clients.0.firstSession', null)
            ->where('clients.0.inviteLink', fn ($link) => str_contains($link, '/trainer/'.$trainer->slug) && str_contains($link, 'c=')));
    }

    public function test_a_bad_line_adds_nothing()
    {
        $trainer = $this->trainer();

        $this->actingAs($trainer->user)->post(route('trainer.clients.store'), [
            'list' => "Marco Rossi\nGiulia Bianchi, non-una-email@",
        ])->assertSessionHasErrors('list');

        $this->assertDatabaseCount('trainer_clients', 0);
    }

    public function test_the_same_email_twice_is_the_same_person()
    {
        $trainer = $this->trainer();

        $this->actingAs($trainer->user)->post(route('trainer.clients.store'), ['list' => 'Marco, marco@example.com']);
        $this->post(route('trainer.clients.store'), ['list' => "Marco Rossi, MARCO@example.com\nAltro, altro@example.com"]);

        $this->assertDatabaseCount('trainer_clients', 2);
    }

    public function test_notes_and_goal_are_saved_and_private_to_the_trainer()
    {
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco Rossi']);

        $this->actingAs($trainer->user)->patch(route('trainer.clients.update', $record), [
            'notes' => 'Ginocchio sinistro delicato.',
            'goal' => 'Mezza maratona',
            'phone' => '333 1234567',
        ])->assertSessionHasNoErrors();

        $record->refresh();
        $this->assertSame('Ginocchio sinistro delicato.', $record->private_notes);
        $this->assertSame('Mezza maratona', $record->goal);
        $this->assertSame('333 1234567', $record->phone);
    }

    public function test_who_has_an_account_keeps_their_own_name_and_contacts()
    {
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco', 'user_id' => User::factory()->create()->id]);

        $this->actingAs($trainer->user)->patch(route('trainer.clients.update', $record), ['name' => 'Altro nome'])
            ->assertSessionHasErrors('name');
        $this->patch(route('trainer.clients.update', $record), ['notes' => 'Ok'])->assertSessionHasNoErrors();
    }

    public function test_another_trainers_clients_cannot_be_touched()
    {
        $trainer = $this->trainer();
        $other = $this->trainer()->clientRecords()->create(['name' => 'Di un altro']);

        $this->actingAs($trainer->user)->patch(route('trainer.clients.update', $other), ['notes' => 'x'])->assertNotFound();
        $this->delete(route('trainer.clients.destroy', $other))->assertNotFound();
        $this->post(route('trainer.clients.payments.store', $other), ['amount' => '10', 'paid_on' => '2026-10-19'])->assertNotFound();
    }

    public function test_a_payment_is_noted_by_hand_and_summed()
    {
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco Rossi']);

        $this->actingAs($trainer->user)
            ->post(route('trainer.clients.payments.store', $record), ['amount' => '45,50', 'paid_on' => '2026-10-19', 'note' => 'Contanti'])
            ->assertSessionHasNoErrors();
        $this->post(route('trainer.clients.payments.store', $record), ['amount' => '100', 'paid_on' => '2026-10-18']);

        $this->assertDatabaseHas('client_payments', ['trainer_client_id' => $record->id, 'amount_cents' => 4550, 'note' => 'Contanti']);
        $this->get(route('trainer.clients'))->assertInertia(fn (Assert $page) => $page
            ->where('clients.0.paidCents', 14550)
            ->has('clients.0.payments', 2)
            ->where('clients.0.payments.0.amountCents', 4550));

        $payment = ClientPayment::where('amount_cents', 4550)->firstOrFail();
        $this->delete(route('trainer.clients.payments.destroy', [$record, $payment]))->assertRedirect();
        $this->assertDatabaseMissing('client_payments', ['id' => $payment->id]);
    }

    public function test_a_payment_must_be_a_real_amount_and_not_in_the_future()
    {
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco Rossi']);

        $this->actingAs($trainer->user);
        $this->post(route('trainer.clients.payments.store', $record), ['amount' => 'abc', 'paid_on' => '2026-10-19'])->assertSessionHasErrors('amount');
        $this->post(route('trainer.clients.payments.store', $record), ['amount' => '0', 'paid_on' => '2026-10-19'])->assertSessionHasErrors('amount');
        $this->post(route('trainer.clients.payments.store', $record), ['amount' => '10', 'paid_on' => '2026-12-01'])->assertSessionHasErrors('paid_on');
    }

    public function test_only_a_client_without_an_account_can_be_removed()
    {
        $trainer = $this->trainer();
        $manual = $trainer->clientRecords()->create(['name' => 'Marco Rossi']);
        $registered = $trainer->clientRecords()->create(['name' => 'Giulia', 'user_id' => User::factory()->create()->id]);

        $this->actingAs($trainer->user)->delete(route('trainer.clients.destroy', $registered))->assertSessionHasErrors('client');
        $this->delete(route('trainer.clients.destroy', $manual))->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('trainer_clients', ['id' => $manual->id]);
        $this->assertDatabaseHas('trainer_clients', ['id' => $registered->id]);
    }

    public function test_a_client_added_by_hand_is_recognized_when_they_open_the_personal_link_logged_in()
    {
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco Rossi', 'private_notes' => 'Ginocchio']);
        $client = User::factory()->create();

        $this->actingAs($client)->get(route('trainers.show', ['slug' => $trainer->slug, 'invito' => 1, 'c' => $record->invite_token]))->assertOk();

        $this->assertSame($client->id, $record->fresh()->user_id);
    }

    public function test_the_personal_link_waits_in_the_session_until_the_client_books()
    {
        Notification::fake();
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco Rossi', 'private_notes' => 'Ginocchio']);
        $client = User::factory()->create(['email' => 'altra@example.com']);

        // Not logged in yet: only the link is opened.
        $this->get(route('trainers.show', ['slug' => $trainer->slug, 'c' => $record->invite_token]))->assertOk();
        $this->assertNull($record->fresh()->user_id);

        $this->actingAs($client)->post(route('trainers.book', $trainer->slug), [
            'service_id' => $trainer->services()->where('minutes', 60)->value('id'),
            'start' => self::SLOT,
            'minutes' => 60,
        ])->assertSessionHasNoErrors();

        // The same person: one record, with the notes already written.
        $this->assertSame($client->id, $record->fresh()->user_id);
        $this->assertSame(1, $trainer->clientRecords()->count());
        $this->assertSame('Ginocchio', $record->fresh()->private_notes);
    }

    public function test_the_same_email_is_recognized_when_the_client_books_without_the_link()
    {
        Notification::fake();
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco Rossi', 'email' => 'Marco@Example.com']);
        $client = User::factory()->create(['email' => 'marco@example.com']);

        $this->actingAs($client)->post(route('trainers.book', $trainer->slug), [
            'service_id' => $trainer->services()->where('minutes', 60)->value('id'),
            'start' => self::SLOT,
            'minutes' => 60,
        ])->assertSessionHasNoErrors();

        $this->assertSame($client->id, $record->fresh()->user_id);
        $this->assertSame(1, $trainer->clientRecords()->count());
    }

    public function test_a_client_already_in_the_list_takes_over_the_notes_of_the_link()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create();
        $mine = $trainer->clientRecords()->create(['name' => 'Marco', 'user_id' => $client->id, 'private_notes' => 'Prima nota']);
        $manual = $trainer->clientRecords()->create(['name' => 'Marco R.', 'private_notes' => 'Seconda nota', 'goal' => 'Dimagrire']);
        $manual->payments()->create(['amount_cents' => 5000, 'paid_on' => '2026-10-01']);

        app(LinkClient::class)->claimToken($trainer, $client, $manual->invite_token);

        $this->assertDatabaseMissing('trainer_clients', ['id' => $manual->id]);
        $this->assertSame("Prima nota\n\nSeconda nota", $mine->fresh()->private_notes);
        $this->assertSame('Dimagrire', $mine->fresh()->goal);
        $this->assertSame(1, $mine->payments()->count());
    }

    public function test_the_trainer_does_not_become_their_own_client_opening_the_link()
    {
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco Rossi']);

        $this->actingAs($trainer->user)->get(route('trainers.show', ['slug' => $trainer->slug, 'c' => $record->invite_token]));

        $this->assertNull($record->fresh()->user_id);
    }

    public function test_deleting_the_account_keeps_the_trainers_notes()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create();
        $record = $trainer->clientRecords()->create(['name' => 'Marco', 'user_id' => $client->id, 'private_notes' => 'Nota']);

        $client->delete();

        $this->assertNull($record->fresh()->user_id);
        $this->assertSame('Nota', $record->fresh()->private_notes);
        $this->assertInstanceOf(TrainerClient::class, $record->fresh());
    }

    public function test_closing_the_profile_deletes_the_list_and_the_payments()
    {
        $trainer = $this->trainer();
        $record = $trainer->clientRecords()->create(['name' => 'Marco']);
        $record->payments()->create(['amount_cents' => 1000, 'paid_on' => '2026-10-01']);

        app(DeleteTrainerProfile::class)->handle($trainer);

        $this->assertDatabaseCount('trainer_clients', 0);
        $this->assertDatabaseCount('client_payments', 0);
    }
}
