<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClientBookingsTest extends TestCase
{
    use RefreshDatabase;

    private const UTC_ISO = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/';

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('client.bookings'))->assertRedirect(route('login'));
    }

    /** No sample data: a new account has nothing booked and nothing saved. */
    public function test_a_new_account_sees_every_section_empty()
    {
        // Someone else's booking is never shown.
        Booking::factory()->confirmed()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('client.bookings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/bookings')
                ->has('upcoming', 0)
                ->has('pending', 0)
                ->has('packages', 0)
                ->has('favorites', 0)
                ->has('past', 0)
            );
    }

    public function test_each_booking_goes_in_its_section()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create(['free_cancellation_hours' => 24]);
        $tomorrow = CarbonImmutable::now('Europe/Rome')->startOfDay()->addDay()->setTime(18, 0);
        $booking = fn () => Booking::factory()->for($client, 'client')->for($trainer);

        $booking()->confirmed()->at($tomorrow)->create();
        $booking()->at($tomorrow->addHours(2))->create();
        $booking()->status(BookingStatus::Declined)->at($tomorrow->addDay())->create();
        $booking()->expired()->at($tomorrow->addDays(2))->create();
        $booking()->status(BookingStatus::Cancelled)->at($tomorrow->addDays(3))->create();
        $booking()->confirmed()->at($tomorrow->subDays(3))->create();

        $this->actingAs($client)
            ->get(route('client.bookings'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('upcoming', 1)
                ->where('upcoming.0.status', 'confirmed')
                ->where('upcoming.0.hours', 1)
                ->where('upcoming.0.trainerName', $trainer->user->name)
                ->where('upcoming.0.freeCancellationUntil', $tomorrow->subDay()->utc()->format('Y-m-d\TH:i:s\Z'))
                ->has('pending', 3)
                ->where('pending.0.status', 'pending')
                ->where('pending.1.status', 'declined')
                ->where('pending.2.status', 'expired')
                ->where('pending.2.expiresAt', null)
                // Cancelled bookings are not listed.
                ->has('past', 1)
                ->where('past.0.review', null)
            );
    }

    public function test_booking_times_are_utc_iso_strings()
    {
        $client = User::factory()->create();
        Booking::factory()->for($client, 'client')->create();
        $client->favoriteTrainers()->attach(
            TrainerProfile::factory()->approved()->create(['next_free_slot_at' => now()->addDay()]),
            ['created_at' => now()],
        );

        $this->actingAs($client)
            ->get(route('client.bookings'))
            ->assertInertia(function (Assert $page) {
                $props = $page->toArray()['props'];

                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['pending'][0]['start']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['pending'][0]['expiresAt']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['favorites'][0]['nextSlotStart']);
            });
    }
}
