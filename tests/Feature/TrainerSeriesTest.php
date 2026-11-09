<?php

namespace Tests\Feature;

use App\Actions\Bookings\GenerateSeries;
use App\Enums\BookingActor;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\City;
use App\Models\ClientPackage;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRequested;
use App\Notifications\BookingSeriesNotice;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Sedute fisse": ogni lunedì alle 18, for a client of the trainer. */
class TrainerSeriesTest extends TestCase
{
    use RefreshDatabase;

    private TrainerProfile $trainer;

    private User $client;

    private TrainerClient $record;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        // Monday 19 October 2026, 08:00 in Rome.
        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));

        $this->trainer = TrainerProfile::factory()->approved()->bookable()->inCity(City::factory()->create())->create();
        $this->client = User::factory()->create();
        $this->record = $this->trainer->clientRecords()->create(['name' => $this->client->name, 'user_id' => $this->client->id]);
    }

    private function serviceId(int $minutes = 60): int
    {
        return (int) $this->trainer->services()->where('minutes', $minutes)->value('id');
    }

    /** @param array<string, mixed> $overrides */
    private function make(array $overrides = [])
    {
        return $this->actingAs($this->trainer->user)->post(route('trainer.clients.series.store', $this->record), [
            'service_id' => $this->serviceId(),
            'weekday' => 1,
            'start_time' => '18:00',
            'starts_on' => '2026-10-19',
            ...$overrides,
        ]);
    }

    public function test_a_series_makes_confirmed_sessions_for_the_next_weeks_and_tells_the_client_once()
    {
        $this->make()->assertSessionHasNoErrors();

        $series = BookingSeries::firstOrFail();
        $bookings = $series->bookings()->orderBy('starts_at')->get();

        // Today (19th) is a Monday at 08:00: the 18:00 of today is free, then 8 more weeks.
        $this->assertCount(9, $bookings);
        $this->assertTrue($bookings->every(fn (Booking $booking) => $booking->status === BookingStatus::Confirmed));
        $this->assertSame('2026-10-19T16:00:00Z', $bookings->first()->starts_at->utc()->format('Y-m-d\TH:i:s\Z'));
        $this->assertSame($this->client->id, $bookings->first()->client_id);
        $this->assertSame(4000, $bookings->first()->price_cents);

        Notification::assertSentToTimes($this->client, BookingSeriesNotice::class, 1);
        Notification::assertNothingSentTo($this->trainer->user);
        Notification::assertNotSentTo($this->client, BookingConfirmed::class);
        Notification::assertNotSentTo($this->trainer->user, BookingRequested::class);
    }

    public function test_the_wall_clock_time_stays_the_same_when_the_clocks_change()
    {
        $this->make()->assertSessionHasNoErrors();

        // 26 October the clocks go back: still 18:00 in Rome, one hour later in UTC.
        $after = BookingSeries::firstOrFail()->bookings()->whereDate('starts_at', '2026-11-02')->firstOrFail();

        $this->assertSame('18:00', $after->starts_at->setTimezone('Europe/Rome')->format('H:i'));
        $this->assertSame('17:00', $after->starts_at->utc()->format('H:i'));
    }

    public function test_running_it_again_makes_nothing_twice()
    {
        $this->make();
        $before = Booking::count();

        $this->artisan('bookings:extend-series')->assertSuccessful();

        $this->assertSame($before, Booking::count());
    }

    public function test_the_next_weeks_are_added_as_time_goes_by()
    {
        $this->make();
        $before = Booking::count();

        $this->travelTo(CarbonImmutable::parse('2026-11-02 08:00', 'Europe/Rome'));
        $this->artisan('bookings:extend-series')->assertSuccessful();

        // Two more Mondays now fit in the 8 weeks ahead.
        $this->assertSame($before + 2, Booking::count());
    }

    public function test_a_cancelled_session_never_comes_back()
    {
        $this->make();
        $series = BookingSeries::firstOrFail();
        $second = $series->bookings()->orderBy('starts_at')->skip(1)->firstOrFail();
        $second->cancel(BookingActor::Client, $this->client);
        $count = Booking::count();

        $this->artisan('bookings:extend-series');

        $this->assertSame($count, Booking::count());
        $this->assertSame(BookingStatus::Cancelled, $second->fresh()->status);
    }

    public function test_a_taken_date_is_skipped_and_made_when_it_frees_up()
    {
        $other = Booking::factory()->for($this->trainer)->confirmed()
            ->at(CarbonImmutable::parse('2026-10-26 18:00', 'Europe/Rome'))->create();

        $this->make();
        $series = BookingSeries::firstOrFail();
        $this->assertCount(8, $series->bookings);

        $other->cancel(BookingActor::Trainer);
        $this->artisan('bookings:extend-series');

        $this->assertCount(9, $series->bookings()->get());
    }

    public function test_the_sessions_stay_inside_the_days_the_client_could_book()
    {
        $this->trainer->update(['booking_window_days' => 15]);

        $this->make();

        // 19 Oct … 2 Nov: Mondays 19 Oct, 26 Oct and 2 Nov.
        $this->assertCount(3, BookingSeries::firstOrFail()->bookings);
    }

    public function test_an_end_date_stops_the_sessions()
    {
        $this->make(['ends_on' => '2026-11-02']);

        $this->assertCount(3, BookingSeries::firstOrFail()->bookings);
    }

    public function test_without_a_free_date_nothing_is_kept()
    {
        // Tuesday 18:00 is free; make every Monday busy instead.
        $this->make(['weekday' => 7, 'start_time' => '03:00'])->assertSessionHasErrors('series');

        $this->assertDatabaseCount('booking_series', 0);
        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_the_same_day_and_time_twice_is_refused()
    {
        $this->make();
        $this->make()->assertSessionHasErrors('series');

        $this->assertDatabaseCount('booking_series', 1);
    }

    public function test_only_a_plain_session_can_be_repeated()
    {
        $first = $this->trainer->services()->create(['name' => 'Prima seduta', 'minutes' => 30, 'price_cents' => 0, 'fixed_duration' => true, 'sort' => 1]);
        $package = $this->trainer->services()->create(['name' => 'Pacchetto', 'kind' => 'package', 'minutes' => 60, 'price_cents' => 30000, 'package_sessions' => 10, 'sort' => 2]);

        $this->make(['service_id' => $first->id])->assertSessionHasErrors('service_id');
        $this->make(['service_id' => $package->id])->assertSessionHasErrors('service_id');
        $this->make(['service_id' => null])->assertSessionHasErrors('service_id');

        $other = TrainerProfile::factory()->approved()->bookable()->create();
        $this->make(['service_id' => $other->services()->firstOrFail()->id])->assertSessionHasErrors('service_id');
    }

    public function test_a_client_without_an_account_cannot_have_a_series()
    {
        $manual = $this->trainer->clientRecords()->create(['name' => 'Marco Rossi']);

        $this->actingAs($this->trainer->user)->post(route('trainer.clients.series.store', $manual), [
            'service_id' => $this->serviceId(), 'weekday' => 1, 'start_time' => '18:00', 'starts_on' => '2026-10-19',
        ])->assertSessionHasErrors('series');
    }

    public function test_another_trainers_client_cannot_be_given_a_series()
    {
        $other = TrainerProfile::factory()->approved()->bookable()->create();

        $this->actingAs($other->user)->post(route('trainer.clients.series.store', $this->record), [
            'service_id' => $other->services()->firstOrFail()->id, 'weekday' => 1, 'start_time' => '18:00', 'starts_on' => '2026-10-19',
        ])->assertNotFound();
    }

    public function test_a_series_can_use_up_a_package_and_then_ends()
    {
        $package = ClientPackage::factory()->for($this->trainer, 'trainerProfile')->create([
            'client_id' => $this->client->id, 'sessions_total' => 3,
        ]);

        $this->actingAs($this->trainer->user)->post(route('trainer.clients.series.store', $this->record), [
            'client_package_id' => $package->id, 'weekday' => 1, 'start_time' => '18:00', 'starts_on' => '2026-10-19',
        ])->assertSessionHasNoErrors();

        $series = BookingSeries::firstOrFail();
        $this->assertCount(3, $series->bookings);
        $this->assertTrue($series->bookings->every(fn (Booking $booking) => $booking->client_package_id === $package->id && $booking->price_cents === 0));

        // The package is full: the next run ends the rule.
        $this->artisan('bookings:extend-series');
        $this->assertSame(BookingSeries::ENDED, $series->fresh()->status);
        $this->assertCount(3, $series->bookings()->get());
    }

    public function test_a_package_of_another_client_or_without_sessions_left_is_refused()
    {
        $someoneElses = ClientPackage::factory()->for($this->trainer, 'trainerProfile')->create();
        $full = ClientPackage::factory()->for($this->trainer, 'trainerProfile')->create(['client_id' => $this->client->id, 'sessions_total' => 1]);
        Booking::factory()->for($this->trainer)->for($this->client, 'client')->for($full, 'clientPackage')->confirmed()->create();

        $payload = ['weekday' => 1, 'start_time' => '18:00', 'starts_on' => '2026-10-19'];
        $this->actingAs($this->trainer->user)->post(route('trainer.clients.series.store', $this->record), [...$payload, 'client_package_id' => $someoneElses->id])
            ->assertSessionHasErrors('client_package_id');
        $this->post(route('trainer.clients.series.store', $this->record), [...$payload, 'client_package_id' => $full->id])
            ->assertSessionHasErrors('client_package_id');
    }

    public function test_ending_a_series_can_keep_or_cancel_the_sessions_to_come()
    {
        $this->make();
        $series = BookingSeries::firstOrFail();
        Notification::fake();

        $this->post(route('trainer.clients.series.end', $series), ['cancel_future' => false])->assertSessionHasNoErrors();
        $this->assertSame(BookingSeries::ENDED, $series->fresh()->status);
        $this->assertSame(9, $series->bookings()->where('status', BookingStatus::Confirmed)->count());
        Notification::assertSentToTimes($this->client, BookingSeriesNotice::class, 1);

        // And it does not make more.
        $this->artisan('bookings:extend-series');
        $this->assertSame(9, $series->bookings()->count());
    }

    public function test_ending_with_cancellation_calls_off_what_is_still_to_come()
    {
        $this->make();
        $series = BookingSeries::firstOrFail();

        // Today's 18:00 is still to come at 08:00: all 9 are cancelled.
        $this->post(route('trainer.clients.series.end', $series), ['cancel_future' => true])->assertSessionHasNoErrors();

        $this->assertSame(0, $series->bookings()->where('status', BookingStatus::Confirmed)->count());
        $this->assertSame(9, $series->bookings()->where('status', BookingStatus::Cancelled)->count());
    }

    public function test_only_the_trainer_of_the_series_can_end_it()
    {
        $this->make();
        $series = BookingSeries::firstOrFail();
        $other = TrainerProfile::factory()->approved()->bookable()->create();

        $this->actingAs($other->user)->post(route('trainer.clients.series.end', $series), ['cancel_future' => true])->assertNotFound();
    }

    public function test_nothing_is_made_for_a_paused_trainer_or_a_client_leaving()
    {
        $this->make();
        $series = BookingSeries::firstOrFail();
        $series->bookings()->delete();

        $this->trainer->forceFill(['paused_at' => now()])->save();
        $this->assertSame(0, app(GenerateSeries::class)->handle($series->fresh())['created']);

        $this->trainer->forceFill(['paused_at' => null])->save();
        $this->client->forceFill(['deletion_scheduled_at' => now()])->save();
        $this->assertSame(0, app(GenerateSeries::class)->handle($series->fresh())['created']);
    }

    public function test_the_page_lists_the_series_and_what_can_be_repeated()
    {
        $this->make();

        $this->actingAs($this->trainer->user)->get(route('trainer.clients'))->assertInertia(fn (Assert $page) => $page
            ->has('seriesServices', 2)
            ->where('clients.0.series.0.label', 'Ogni lunedì alle 18:00')
            ->where('clients.0.series.0.upcomingCount', 9)
            ->where('clients.0.seriesPackage', null));
    }
}
