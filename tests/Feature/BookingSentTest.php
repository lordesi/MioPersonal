<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingSentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('client.bookings.sent', 1))->assertRedirect(route('login'));
    }

    public function test_clients_with_an_unverified_email_can_see_the_page()
    {
        $this->actingAs(User::factory()->unverified()->create())
            ->get(route('client.bookings.sent', 1))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/booking-sent')
                ->has('booking', fn (Assert $booking) => $booking
                    ->where('status', 'pending')
                    ->whereType('priceCents', 'integer')
                    ->where('start', fn (string $start) => preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $start) === 1)
                    ->where('trainer.firstName', 'Giulia')
                    ->etc()
                )
            );
    }

    public function test_unknown_booking_returns_not_found()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('client.bookings.sent', 999))
            ->assertNotFound();
    }
}
