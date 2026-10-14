<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingSentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('client.bookings.sent', Booking::factory()->create()))->assertRedirect(route('login'));
    }

    public function test_clients_with_an_unverified_email_can_see_their_booking()
    {
        $client = User::factory()->unverified()->create();
        $booking = Booking::factory()->for($client, 'client')->create(['price_cents' => 4500]);

        $this->actingAs($client)
            ->get(route('client.bookings.sent', $booking))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/booking-sent')
                ->has('booking', fn (Assert $sent) => $sent
                    ->where('id', $booking->id)
                    ->where('status', 'pending')
                    ->where('priceCents', 4500)
                    ->where('start', fn (string $start) => preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $start) === 1)
                    ->where('trainer.firstName', $booking->trainerProfile->user->first_name)
                    ->etc()
                )
            );
    }

    public function test_someone_elses_or_an_unknown_booking_is_not_found()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('client.bookings.sent', Booking::factory()->create()))
            ->assertNotFound();

        $this->actingAs(User::factory()->create())
            ->get(route('client.bookings.sent', 999))
            ->assertNotFound();
    }
}
