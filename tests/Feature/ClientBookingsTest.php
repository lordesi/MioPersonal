<?php

namespace Tests\Feature;

use App\Models\User;
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

    public function test_bookings_page_renders_every_section()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('client.bookings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/bookings')
                ->has('upcoming.0', fn (Assert $booking) => $booking
                    ->where('status', 'confirmed')
                    ->whereType('hours', 'integer')
                    ->etc()
                )
                ->has('pending', 2)
                ->has('packages.0', fn (Assert $package) => $package
                    ->whereType('used', 'integer')
                    ->whereType('total', 'integer')
                    ->etc()
                )
                ->has('favorites', 3)
                ->has('past', 2)
            );
    }

    public function test_booking_times_are_utc_iso_strings()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('client.bookings'))
            ->assertInertia(function (Assert $page) {
                $props = $page->toArray()['props'];

                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['upcoming'][0]['start']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['upcoming'][0]['freeCancellationUntil']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['pending'][0]['expiresAt']);
                $this->assertMatchesRegularExpression(self::UTC_ISO, $props['favorites'][0]['nextSlotStart']);
            });
    }
}
