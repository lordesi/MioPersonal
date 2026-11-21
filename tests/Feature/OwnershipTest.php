<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * The ID of someone else's record in a private address answers 404, as if it
 * didn't exist, and changes nothing (app/Policies). One record per area, every
 * action that receives it.
 */
class OwnershipTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_a_client_cannot_touch_someone_elses_booking()
    {
        $booking = Booking::factory()->confirmed()->create();
        $before = $booking->fresh()?->getAttributes();

        $this->assertEveryActionIsNotFound(User::factory()->create(), [
            ['get', 'client.bookings.sent'],
            ['patch', 'client.bookings.cancel'],
            ['patch', 'client.bookings.people'],
            ['post', 'client.bookings.invite.regenerate'],
            ['post', 'client.bookings.reschedule.accept'],
            ['delete', 'client.bookings.reschedule.decline'],
            ['post', 'client.bookings.proposal.accept'],
            ['delete', 'client.bookings.proposal.decline'],
            ['post', 'client.bookings.review'],
        ], $booking);

        $this->assertSame($before, $booking->fresh()?->getAttributes());
    }

    /**
     * @param  list<array{string, string}>  $actions  [HTTP method, route name]
     */
    private function assertEveryActionIsNotFound(User $intruder, array $actions, mixed ...$parameters): void
    {
        foreach ($actions as [$method, $name]) {
            $this->actingAs($intruder)
                ->{$method}(route($name, $parameters))
                ->assertNotFound();
        }
    }
}
