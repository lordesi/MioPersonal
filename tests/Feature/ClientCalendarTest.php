<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** "Aggiungi al calendario": the .ics file of a confirmed session. */
class ClientCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_client_downloads_the_calendar_file_of_a_confirmed_session()
    {
        $client = User::factory()->create();
        $trainer = TrainerProfile::factory()->approved()->create();
        // Monday 19 October 2026, 13:00 in Rome = 11:00 UTC.
        $booking = Booking::factory()->for($client, 'client')->for($trainer)->confirmed()
            ->at(CarbonImmutable::parse('2026-10-19 13:00', 'Europe/Rome'))
            ->create(['place_label' => 'Palestra Centro, Milano']);

        $response = $this->actingAs($client)->get(route('client.bookings.calendar', $booking));

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/calendar; charset=utf-8')
            ->assertHeader('Content-Disposition', 'attachment; filename="seduta-2026-10-19.ics"');

        $ics = $response->getContent();
        $this->assertIsString($ics);
        $this->assertStringStartsWith("BEGIN:VCALENDAR\r\n", $ics);
        $this->assertStringContainsString("UID:booking-{$booking->id}@miopersonal\r\n", $ics);
        $this->assertStringContainsString("DTSTART:20261019T110000Z\r\n", $ics);
        $this->assertStringContainsString("DTEND:20261019T120000Z\r\n", $ics);
        // The comma is escaped, as the format wants.
        $this->assertStringContainsString('LOCATION:Palestra Centro\, Milano', $ics);
        $this->assertStringContainsString($trainer->user->name, str_replace("\r\n ", '', $ics));
    }

    public function test_only_the_client_s_confirmed_sessions()
    {
        $client = User::factory()->create();
        $pending = Booking::factory()->for($client, 'client')->create();
        $someoneElses = Booking::factory()->confirmed()->create();

        $this->actingAs($client)->get(route('client.bookings.calendar', $pending))->assertNotFound();
        $this->actingAs($client)->get(route('client.bookings.calendar', $someoneElses))->assertNotFound();
    }

    public function test_long_lines_are_folded()
    {
        $client = User::factory()->create();
        $booking = Booking::factory()->for($client, 'client')->confirmed()
            ->create(['place_label' => str_repeat('Via della Palestra è lunga ', 5)]);

        $ics = (string) $this->actingAs($client)->get(route('client.bookings.calendar', $booking))->getContent();

        foreach (explode("\r\n", $ics) as $line) {
            $this->assertLessThanOrEqual(75, strlen($line));
        }
    }
}
