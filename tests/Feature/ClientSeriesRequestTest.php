<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingSeries;
use App\Models\City;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingRepeatDeclined;
use App\Notifications\BookingSeriesNotice;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Ripeti ogni settimana": the client asks for "sedute fisse", the trainer answers. */
class ClientSeriesRequestTest extends TestCase
{
    use RefreshDatabase;

    /** Monday 19 October 2026, 18:00 in Rome. */
    private const SLOT = '2026-10-19T16:00:00Z';

    private TrainerProfile $trainer;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        // Monday 19 October 2026, 08:00 in Rome.
        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));

        $this->trainer = TrainerProfile::factory()->approved()->bookable()->inCity(City::factory()->create())->create();
        $this->client = User::factory()->create();
    }

    private function serviceId(int $minutes = 60): int
    {
        return (int) $this->trainer->services()->where('minutes', $minutes)->value('id');
    }

    /** @param array<string, mixed> $overrides */
    private function ask(array $overrides = [])
    {
        return $this->actingAs($this->client)->post(route('trainers.book', $this->trainer->slug), [
            'service_id' => $this->serviceId(),
            'start' => self::SLOT,
            'minutes' => 60,
            'repeat_weekly' => true,
            ...$overrides,
        ]);
    }

    public function test_the_client_asks_to_repeat_it_every_week()
    {
        $this->ask()->assertSessionHasNoErrors();

        $booking = Booking::sole();
        $this->assertTrue($booking->repeat_weekly);
        $this->assertSame(BookingStatus::Pending, $booking->status);
        $this->assertSame(0, BookingSeries::count());

        $this->actingAs($this->trainer->user)->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page->where('requests.0.repeatWeekly', 'Ogni lunedì alle 18:00'));

        $this->actingAs($this->client)->get(route('client.bookings.sent', $booking))
            ->assertInertia(fn (Assert $page) => $page
                ->where('booking.repeatWeekly.label', 'Ogni lunedì alle 18:00')
                ->where('booking.repeatWeekly.set', false));
    }

    public function test_not_for_the_first_session_nor_with_friends()
    {
        $first = $this->trainer->services()->create([
            'name' => 'Prima seduta', 'minutes' => 60, 'price_cents' => 0, 'fixed_duration' => true, 'sort' => 0,
        ]);

        $this->ask(['service_id' => $first->id])->assertSessionHasErrors('repeat_weekly');
        $this->ask(['people' => 2])->assertSessionHasErrors('repeat_weekly');

        $this->assertSame(0, Booking::count());
    }

    public function test_accepted_every_week_the_sessions_are_set()
    {
        $this->ask();
        $booking = Booking::sole();

        $this->actingAs($this->trainer->user)
            ->post(route('trainer.requests.accept', $booking), ['weekly' => true])
            ->assertSessionHasNoErrors();

        $series = BookingSeries::sole();
        $this->assertSame(1, $series->weekday);
        $this->assertSame('18:00', $series->start_time);
        $this->assertSame($this->client->id, $series->client_id);

        $booking->refresh();
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertSame($series->id, $booking->booking_series_id);

        // The asked session and the next Mondays, at 18:00 in Rome, all confirmed.
        $sessions = $series->bookings()->orderBy('starts_at')->get();
        $this->assertGreaterThan(1, $sessions->count());
        $this->assertSame(1, $sessions->where('starts_at', $booking->starts_at)->count());
        $sessions->each(function (Booking $session) {
            $this->assertSame(BookingStatus::Confirmed, $session->status);
            $this->assertSame('Mon 18:00', $session->starts_at->setTimezone('Europe/Rome')->format('D H:i'));
        });

        Notification::assertSentTo($this->client, BookingSeriesNotice::class, fn (BookingSeriesNotice $notice) => $notice->count === $sessions->count());
    }

    public function test_only_this_session_confirms_it_alone()
    {
        $this->ask();
        $booking = Booking::sole();

        $this->actingAs($this->trainer->user)
            ->post(route('trainer.requests.accept', $booking))
            ->assertSessionHasNoErrors();

        $this->assertSame(BookingStatus::Confirmed, $booking->refresh()->status);
        $this->assertNull($booking->booking_series_id);
        $this->assertSame(0, BookingSeries::count());
        $this->assertSame(1, Booking::count());
        Notification::assertSentTo($this->client, BookingRepeatDeclined::class);
    }

    public function test_a_plain_request_sends_no_repeat_notice()
    {
        $this->ask(['repeat_weekly' => false]);

        $this->actingAs($this->trainer->user)->post(route('trainer.requests.accept', Booking::sole()), ['weekly' => true]);

        $this->assertSame(0, BookingSeries::count());
        Notification::assertNotSentTo($this->client, BookingRepeatDeclined::class);
    }

    public function test_automatic_confirmation_also_sets_the_sessions()
    {
        $this->trainer->forceFill(['auto_confirm' => true])->save();

        $this->ask()->assertSessionHasNoErrors();

        $series = BookingSeries::sole();
        // The asked session is the first of the rule.
        $this->assertSame($series->id, Booking::query()->oldest('starts_at')->firstOrFail()->booking_series_id);
        $this->assertGreaterThan(1, $series->bookings()->count());
    }

    public function test_another_trainer_cannot_answer()
    {
        $this->ask();
        $other = TrainerProfile::factory()->approved()->bookable()->create();

        $this->actingAs($other->user)
            ->post(route('trainer.requests.accept', Booking::sole()), ['weekly' => true])
            ->assertNotFound();

        $this->assertSame(0, BookingSeries::count());
    }
}
