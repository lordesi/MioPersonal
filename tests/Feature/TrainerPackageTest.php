<?php

namespace Tests\Feature;

use App\Actions\Trainer\LinkClient;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\City;
use App\Models\ClientPackage;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Aggiungi pacchetto" in "Pacchetti attivi" of the trainer's Home, and
 * "Dal pacchetto" in "Aggiungi seduta": the sessions use it up.
 */
class TrainerPackageTest extends TestCase
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

    /** @param array<string, mixed> $overrides */
    private function addPackage(array $overrides = [])
    {
        return $this->actingAs($this->trainer->user)->post(route('trainer.packages.store'), [
            'client_record_id' => $this->offApp->id,
            'name' => 'Pacchetto 3 sedute',
            'sessions' => 3,
            'price_cents' => 12000,
            'minutes' => 45,
            ...$overrides,
        ]);
    }

    /** @param array<string, mixed> $overrides */
    private function addSession(array $overrides = [])
    {
        return $this->actingAs($this->trainer->user)->post(route('trainer.calendar.sessions.store'), [
            'client_record_id' => $this->offApp->id,
            'service_id' => (int) $this->trainer->services()->where('kind', 'session')->value('id'),
            'date' => '2026-10-20',
            'time' => '07:30',
            'minutes' => 45,
            ...$overrides,
        ]);
    }

    public function test_a_package_is_added_to_someone_without_an_account()
    {
        $this->addPackage()->assertSessionHasNoErrors()->assertInertiaFlash('toast.message', 'Pacchetto aggiunto a Marco Rossi.');

        $package = ClientPackage::firstOrFail();
        $this->assertNull($package->client_id);
        $this->assertSame($this->offApp->id, $package->trainer_client_id);
        $this->assertSame(3, $package->sessions_total);
        $this->assertSame(12000, $package->price_cents);
        $this->assertSame(45, $package->minutes);
        $this->assertNotNull($package->bought_at);

        // In "Pacchetti attivi" of the Home, with the row of "Clienti".
        $this->actingAs($this->trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('packages.0.clientName', 'Marco Rossi')
                ->where('packages.0.recordId', $this->offApp->id)
                ->where('packages.0.total', 3)
                ->where('sessionOptions.clients', fn ($clients) => collect($clients)->firstWhere('id', $this->offApp->id)['package']['remaining'] === 3));
    }

    public function test_a_package_of_a_client_with_an_account_is_theirs()
    {
        $this->addPackage(['client_record_id' => $this->registered->id])->assertSessionHasNoErrors();

        $package = ClientPackage::firstOrFail();
        $this->assertSame($this->client->id, $package->client_id);
        $this->assertSame($this->registered->id, $package->trainer_client_id);
    }

    public function test_a_new_client_can_be_added_with_the_package()
    {
        $this->addPackage(['client_record_id' => null, 'new_client' => ['name' => 'Giulia Bianchi', 'email' => 'giulia@example.com']])
            ->assertSessionHasNoErrors();

        $record = $this->trainer->clientRecords()->where('name', 'Giulia Bianchi')->firstOrFail();
        $this->assertSame($record->id, ClientPackage::firstOrFail()->trainer_client_id);
    }

    public function test_the_fields_are_checked()
    {
        $this->addPackage(['client_record_id' => null])->assertSessionHasErrors('client_record_id');
        $this->addPackage(['sessions' => 0])->assertSessionHasErrors('sessions');
        $this->addPackage(['sessions' => 101])->assertSessionHasErrors('sessions');
        $this->addPackage(['price_cents' => null])->assertSessionHasErrors('price_cents');
        $this->addPackage(['minutes' => 7])->assertSessionHasErrors('minutes');
        $this->addPackage(['name' => ''])->assertSessionHasErrors('name');
        // A session service is not a package.
        $this->addPackage(['service_id' => $this->trainer->services()->where('kind', 'session')->value('id')])->assertSessionHasErrors('service_id');
        $this->assertSame(0, ClientPackage::count());

        // Someone of another trainer's list.
        $other = TrainerProfile::factory()->approved()->create()->clientRecords()->create(['name' => 'Altro']);
        $this->addPackage(['client_record_id' => $other->id])->assertNotFound();
    }

    public function test_a_session_uses_up_the_package_and_is_free()
    {
        $this->addPackage()->assertSessionHasNoErrors();
        $package = ClientPackage::firstOrFail();

        $this->addSession(['client_package_id' => $package->id])->assertSessionHasNoErrors();

        $booking = Booking::firstOrFail();
        $this->assertSame($package->id, $booking->client_package_id);
        $this->assertSame(0, $booking->price_cents);
        $this->assertSame('Pacchetto 3 sedute', $booking->service_name);
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertSame(2, $package->fresh()?->remaining());

        // Without the package: a single session, at its price.
        $this->addSession(['date' => '2026-10-21'])->assertSessionHasNoErrors();
        $this->assertNull(Booking::latest('id')->firstOrFail()->client_package_id);
    }

    public function test_a_package_with_no_sessions_left_or_of_someone_else_is_refused()
    {
        $this->addPackage(['sessions' => 1])->assertSessionHasNoErrors();
        $package = ClientPackage::firstOrFail();

        $this->addSession(['client_package_id' => $package->id])->assertSessionHasNoErrors();
        $this->addSession(['client_package_id' => $package->id, 'date' => '2026-10-21'])->assertSessionHasErrors('client_package_id');

        // Another client of the list can't use it.
        $this->addSession(['client_record_id' => $this->registered->id, 'client_package_id' => $package->id, 'date' => '2026-10-22'])
            ->assertSessionHasErrors('client_package_id');
        $this->assertSame(1, Booking::count());
    }

    public function test_the_package_becomes_the_clients_when_they_sign_up()
    {
        $this->addPackage()->assertSessionHasNoErrors();
        $user = User::factory()->create();

        app(LinkClient::class)->claimToken($this->trainer, $user, $this->offApp->invite_token);

        $this->assertSame($user->id, ClientPackage::firstOrFail()->client_id);
    }

    public function test_one_client_is_added_and_their_card_opens()
    {
        $response = $this->actingAs($this->trainer->user)->post(route('trainer.clients.add'), [
            'name' => '  Giulia Bianchi ',
            'phone' => '333 765 4321',
            'email' => 'Giulia@example.com',
        ]);

        $record = $this->trainer->clientRecords()->where('name', 'Giulia Bianchi')->firstOrFail();
        $response->assertRedirect(route('trainer.clients', ['con' => $record->id]))
            ->assertInertiaFlash('toast.message', 'Cliente aggiunto.');
        $this->assertSame('333 765 4321', $record->phone);

        // The same email again: the same row.
        $this->actingAs($this->trainer->user)
            ->post(route('trainer.clients.add'), ['name' => 'Giulia B.', 'email' => 'giulia@example.com'])
            ->assertRedirect(route('trainer.clients', ['con' => $record->id]));
        $this->assertSame(1, $this->trainer->clientRecords()->where('email', 'Giulia@example.com')->count());

        $this->actingAs($this->trainer->user)
            ->post(route('trainer.clients.add'), ['name' => '', 'phone' => 'abc'])
            ->assertSessionHasErrors(['name', 'phone']);
    }

    public function test_the_clients_card_shows_the_package_of_someone_without_an_account()
    {
        $this->addPackage()->assertSessionHasNoErrors();

        $this->actingAs($this->trainer->user)
            ->get(route('trainer.clients'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('clients', fn ($clients) => collect($clients)->firstWhere('recordId', $this->offApp->id)['package']['total'] === 3));
    }
}
