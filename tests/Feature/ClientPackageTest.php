<?php

namespace Tests\Feature;

use App\Enums\BookingActor;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Packages of sessions: booking a package service buys it (once the first
 * session is confirmed), then "Il tuo pacchetto" books the other sessions.
 */
class ClientPackageTest extends TestCase
{
    use RefreshDatabase;

    /** Monday 19 October 2026, 18:00 and 19:00 in Rome (UTC+2). */
    private const FIRST = '2026-10-19T16:00:00Z';

    private const SECOND = '2026-10-19T17:00:00Z';

    private TrainerProfile $trainer;

    private Service $package;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));

        $this->trainer = TrainerProfile::factory()->approved()->bookable()->create();
        $this->package = $this->trainer->services()->create([
            'name' => 'Pacchetto 3 sedute',
            'kind' => 'package',
            'minutes' => 60,
            'price_cents' => 10500,
            'fixed_duration' => true,
            'package_sessions' => 3,
            'sort' => 10,
        ]);
    }

    private function buy(User $client): Booking
    {
        $this->actingAs($client)
            ->post(route('trainers.book', $this->trainer->slug), [
                'service_id' => $this->package->id,
                'start' => self::FIRST,
                'minutes' => 60,
            ])
            ->assertSessionHasNoErrors();

        return Booking::latest('id')->firstOrFail();
    }

    private function useSession(User $client, ClientPackage $package, string $start): TestResponse
    {
        return $this->actingAs($client)->post(route('trainers.book', $this->trainer->slug), [
            'client_package_id' => $package->id,
            'start' => $start,
        ]);
    }

    public function test_booking_a_package_creates_it_but_it_is_bought_only_once_confirmed()
    {
        $client = User::factory()->create();
        $booking = $this->buy($client);

        $package = ClientPackage::sole();
        $this->assertSame($package->id, $booking->client_package_id);
        $this->assertSame($client->id, $package->client_id);
        $this->assertSame('Pacchetto 3 sedute', $package->name);
        $this->assertSame(3, $package->sessions_total);
        $this->assertSame(10500, $package->price_cents);
        $this->assertNull($package->bought_at);

        $this->actingAs($this->trainer->user)->post(route('trainer.requests.accept', $booking));

        $this->assertNotNull($package->refresh()->bought_at);
        $this->assertSame(2, $package->remaining());
    }

    public function test_with_automatic_confirmation_the_package_is_bought_right_away()
    {
        $this->trainer->update(['auto_confirm' => true]);

        $this->buy(User::factory()->create());

        $this->assertNotNull(ClientPackage::sole()->bought_at);
    }

    public function test_a_declined_first_session_does_not_buy_the_package()
    {
        $client = User::factory()->create();
        $booking = $this->buy($client);

        $this->actingAs($this->trainer->user)->post(route('trainer.requests.decline', $booking));

        $this->assertNull(ClientPackage::sole()->bought_at);
        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page->has('packages', 0));
    }

    public function test_the_client_books_the_next_sessions_with_the_package()
    {
        $client = User::factory()->create();
        $package = ClientPackage::factory()->for($this->trainer)->for($client, 'client')->create(['sessions_total' => 3]);

        $this->useSession($client, $package, self::SECOND)->assertSessionHasNoErrors();

        $booking = Booking::sole();
        $this->assertSame($package->id, $booking->client_package_id);
        $this->assertSame(0, $booking->price_cents);
        $this->assertSame('Pacchetto 10 sedute', $booking->service_name);
        $this->assertSame(60, (int) $booking->starts_at->diffInMinutes($booking->ends_at));
        $this->assertSame(2, $package->refresh()->remaining());
    }

    public function test_no_more_sessions_than_the_package_has()
    {
        $client = User::factory()->create();
        $package = ClientPackage::factory()->for($this->trainer)->for($client, 'client')->create(['sessions_total' => 1]);
        Booking::factory()->for($this->trainer)->for($client, 'client')->for($package)->confirmed()->at(now()->subDays(3))->create();

        $this->useSession($client, $package, self::SECOND)->assertSessionHasErrors('client_package_id');

        $this->assertSame(1, Booking::count());
    }

    public function test_a_cancelled_session_is_free_again()
    {
        $client = User::factory()->create();
        $package = ClientPackage::factory()->for($this->trainer)->for($client, 'client')->create(['sessions_total' => 1]);
        $this->useSession($client, $package, self::SECOND);

        Booking::sole()->cancel(BookingActor::Client, $client);

        $this->assertSame(1, $package->refresh()->remaining());
    }

    public function test_nobody_else_can_use_the_package()
    {
        $package = ClientPackage::factory()->for($this->trainer)->create();

        $this->useSession(User::factory()->create(), $package, self::SECOND)->assertSessionHasErrors('client_package_id');

        $this->assertSame(0, Booking::count());
    }

    public function test_the_profile_offers_the_package_first_to_its_client()
    {
        $client = User::factory()->create();
        $package = ClientPackage::factory()->for($this->trainer)->for($client, 'client')->create(['sessions_total' => 10]);

        $this->actingAs($client)
            ->get(route('trainers.show', $this->trainer->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.services.0.packageId', $package->id)
                ->where('trainer.services.0.name', 'Il tuo pacchetto')
                ->where('trainer.services.0.durationLabel', '10 sedute rimaste · 1 ora')
                ->where('trainer.services.1.packageId', null)
            );

        // Another client sees only the services.
        $this->actingAs(User::factory()->create())
            ->get(route('trainers.show', $this->trainer->slug))
            ->assertInertia(fn (Assert $page) => $page->where('trainer.services.0.packageId', null));
    }

    public function test_le_mie_prenotazioni_lists_the_packages_not_all_done()
    {
        $client = User::factory()->create();
        $package = ClientPackage::factory()->for($this->trainer)->for($client, 'client')->create(['sessions_total' => 3]);
        Booking::factory()->for($this->trainer)->for($client, 'client')->for($package)->confirmed()->at(CarbonImmutable::now()->subDay())->create();
        $next = Booking::factory()->for($this->trainer)->for($client, 'client')->for($package)->confirmed()->at(CarbonImmutable::now()->addDay())->create();
        // All done: nothing left.
        $full = ClientPackage::factory()->for($this->trainer)->for($client, 'client')->create(['sessions_total' => 1]);
        Booking::factory()->for($this->trainer)->for($client, 'client')->for($full)->confirmed()->at(CarbonImmutable::now()->subDay())->create();

        $this->actingAs($client)
            ->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('packages', 1)
                ->where('packages.0.id', $package->id)
                ->where('packages.0.done', 1)
                ->where('packages.0.booked', 2)
                ->where('packages.0.total', 3)
                ->where('packages.0.nextStart', $next->starts_at->utc()->format('Y-m-d\TH:i:s\Z'))
                ->where('packages.0.trainerHref', route('trainers.show', $this->trainer->slug, false))
                // The session of the package says which one it is.
                ->where('upcoming.0.serviceLabel', $package->name.' · seduta 2 di 3')
            );
    }

    public function test_the_trainer_reads_which_session_of_the_package_it_is()
    {
        $client = User::factory()->create();
        $package = ClientPackage::factory()->for($this->trainer)->for($client, 'client')->create();
        Booking::factory()->for($this->trainer)->for($client, 'client')->for($package)->confirmed()->at(now()->subDays(2))->create(['service_name' => 'Pacchetto 10 sedute']);
        Booking::factory()->for($this->trainer)->for($client, 'client')->for($package)->confirmed()->at(now()->addDay())->create(['service_name' => 'Pacchetto 10 sedute']);

        $this->actingAs($this->trainer->user)
            ->get(route('trainer.today'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('next.serviceName', 'Pacchetto 10 sedute · seduta 2 di 10')
                ->has('packages', 1)
                ->where('packages.0.done', 1)
                ->where('packages.0.booked', 2)
                ->where('packages.0.total', 10)
                ->where('packages.0.clientName', $client->name)
            );
    }
}
