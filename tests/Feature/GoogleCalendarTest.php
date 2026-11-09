<?php

namespace Tests\Feature;

use App\Enums\BookingActor;
use App\Models\Booking;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\Socialite\GoogleCalendarProvider;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialUser;
use Tests\TestCase;

/** "Collega Google Calendar": the sessions are written on a "MioPersonal" calendar of the trainer. */
class GoogleCalendarTest extends TestCase
{
    use RefreshDatabase;

    private const API = 'https://www.googleapis.com/calendar/v3';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        config(['services.google-calendar.client_id' => 'google-id', 'services.google-calendar.client_secret' => 'secret']);
    }

    private function linkedTrainer(): TrainerProfile
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->create();
        $profile->calendarConnection()->create([
            'google_user_id' => 'g-1',
            'google_email' => 'giulia@gmail.com',
            'access_token' => 'access-1',
            'refresh_token' => 'refresh-1',
            'token_expires_at' => now()->addHour(),
            'calendar_id' => 'cal-1',
            'connected_at' => now(),
        ]);

        return $profile;
    }

    private function fakeGoogle(): void
    {
        Http::fake([
            self::API.'/calendars/cal-1/events' => Http::response(['id' => 'ev-1']),
            self::API.'/calendars/cal-1/events/*' => Http::response(['id' => 'ev-1', 'status' => 'confirmed']),
            self::API.'/calendars/cal-1' => Http::response([]),
            self::API.'/calendars/cal-new/events' => Http::response(['id' => 'ev-9']),
            self::API.'/calendars' => Http::response(['id' => 'cal-new']),
            'https://oauth2.googleapis.com/*' => Http::response(['access_token' => 'access-2', 'expires_in' => 3600]),
        ]);
    }

    private function confirmedBooking(TrainerProfile $profile): Booking
    {
        $start = CarbonImmutable::now()->addDays(2)->startOfHour();
        $booking = Booking::factory()->for($profile, 'trainerProfile')->at($start)
            ->create(['service_name' => 'Allenamento 1:1', 'place_label' => 'Palestra Centrale']);
        $booking->confirm();

        return $booking;
    }

    public function test_a_confirmed_session_is_written_on_the_google_calendar()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();

        $booking = $this->confirmedBooking($profile);

        Http::assertSent(fn ($request) => $request->method() === 'POST'
            && $request->url() === self::API.'/calendars/cal-1/events'
            && str_starts_with($request['summary'], 'Allenamento 1:1 · ')
            && $request['location'] === 'Palestra Centrale'
            && $request['start']['timeZone'] === 'Europe/Rome'
            && $request->hasHeader('Authorization', 'Bearer access-1')
            // Never the contacts of the client.
            && ! str_contains(json_encode($request->data()), $booking->client->email));
        $this->assertDatabaseHas('calendar_events', ['booking_id' => $booking->id, 'google_event_id' => 'ev-1']);
    }

    public function test_a_moved_session_changes_the_event_and_a_cancelled_one_removes_it()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();
        $booking = $this->confirmedBooking($profile);

        $start = CarbonImmutable::now()->addDays(3)->startOfHour();
        $booking->forceFill(['starts_at' => $start, 'ends_at' => $start->addHour(), 'blocked_until' => $start->addHour()])->save();

        Http::assertSent(fn ($request) => $request->method() === 'PUT' && $request->url() === self::API.'/calendars/cal-1/events/ev-1');

        $booking->cancel(BookingActor::Trainer);

        Http::assertSent(fn ($request) => $request->method() === 'DELETE' && $request->url() === self::API.'/calendars/cal-1/events/ev-1');
        $this->assertDatabaseMissing('calendar_events', ['booking_id' => $booking->id]);
    }

    public function test_a_request_still_waiting_is_not_on_the_calendar()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();

        Booking::factory()->for($profile, 'trainerProfile')->create();

        Http::assertNothingSent();
    }

    public function test_a_trainer_without_google_costs_nothing()
    {
        Http::fake();
        $profile = TrainerProfile::factory()->approved()->bookable()->create();

        $this->confirmedBooking($profile);

        Http::assertNothingSent();
    }

    public function test_an_event_deleted_by_hand_on_google_is_made_again()
    {
        Http::fake([
            self::API.'/calendars/cal-1/events/ev-1' => Http::response([], 404),
            self::API.'/calendars/cal-1/events' => Http::sequence()->push(['id' => 'ev-1'])->push(['id' => 'ev-2']),
        ]);
        $profile = $this->linkedTrainer();
        $booking = $this->confirmedBooking($profile);

        $booking->forceFill(['place_label' => 'Online'])->save();

        $this->assertDatabaseHas('calendar_events', ['booking_id' => $booking->id, 'google_event_id' => 'ev-2']);
    }

    public function test_an_expired_token_is_renewed()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();
        $profile->calendarConnection->update(['token_expires_at' => now()->subMinute()]);

        $this->confirmedBooking($profile);

        Http::assertSent(fn ($request) => str_starts_with($request->url(), 'https://oauth2.googleapis.com/token') && $request['refresh_token'] === 'refresh-1');
        Http::assertSent(fn ($request) => $request->url() === self::API.'/calendars/cal-1/events' && $request->hasHeader('Authorization', 'Bearer access-2'));
        $this->assertSame('access-2', $profile->calendarConnection()->first()->access_token);
    }

    public function test_revoked_access_is_saved_and_never_breaks_the_booking()
    {
        Http::fake(['https://oauth2.googleapis.com/*' => Http::response(['error' => 'invalid_grant'], 400)]);
        $profile = $this->linkedTrainer();
        $profile->calendarConnection->update(['token_expires_at' => now()->subMinute()]);

        $booking = $this->confirmedBooking($profile);

        $this->assertSame('confirmed', $booking->fresh()->status->value);
        $this->assertNotNull($profile->calendarConnection()->first()->last_error);
    }

    public function test_a_google_error_does_not_break_the_booking_either()
    {
        Http::fake([self::API.'/*' => Http::response(['error' => 'boom'], 500)]);
        $profile = $this->linkedTrainer();

        try {
            $booking = $this->confirmedBooking($profile);
        } catch (\Throwable) {
            $this->fail('The booking must not depend on Google.');
        }

        $this->assertSame('confirmed', $booking->fresh()->status->value);
    }

    public function test_linking_keeps_the_tokens_encrypted_and_writes_the_sessions_to_come()
    {
        $this->fakeGoogle();
        $profile = TrainerProfile::factory()->approved()->bookable()->create();
        $booking = Booking::factory()->for($profile, 'trainerProfile')
            ->at(CarbonImmutable::now()->addDays(2)->startOfHour())->confirmed()->create();

        $account = (new SocialUser)->map(['id' => 'g-7', 'email' => 'giulia@gmail.com', 'name' => 'Giulia']);
        $account->token = 'access-new';
        $account->refreshToken = 'refresh-new';
        $account->expiresIn = 3600;
        $account->approvedScopes = [GoogleCalendarProvider::SCOPE];
        Socialite::fake('google-calendar', $account);

        $this->actingAs($profile->user)->get(route('trainer.google-calendar.callback'))->assertRedirect(route('trainer.settings'));

        $connection = $profile->calendarConnection()->first();
        $this->assertSame('giulia@gmail.com', $connection->google_email);
        $this->assertSame('cal-new', $connection->calendar_id);
        $this->assertNotSame('access-new', $connection->getRawOriginal('access_token'));
        $this->assertDatabaseHas('calendar_events', ['booking_id' => $booking->id]);
    }

    public function test_linking_without_the_permission_to_write_is_refused()
    {
        Http::fake();
        $profile = TrainerProfile::factory()->approved()->bookable()->create();
        $account = (new SocialUser)->map(['id' => 'g-7', 'email' => 'giulia@gmail.com']);
        $account->token = 'x';
        $account->refreshToken = 'y';
        $account->approvedScopes = ['openid', 'email'];
        Socialite::fake('google-calendar', $account);

        $this->actingAs($profile->user)->get(route('trainer.google-calendar.callback'));

        $this->assertDatabaseCount('trainer_calendar_connections', 0);
    }

    public function test_unlinking_deletes_the_calendar_on_google_and_the_tokens_here()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();

        $this->actingAs($profile->user)->delete(route('trainer.google-calendar.disconnect'))->assertRedirect();

        Http::assertSent(fn ($request) => $request->method() === 'DELETE' && $request->url() === self::API.'/calendars/cal-1');
        $this->assertDatabaseCount('trainer_calendar_connections', 0);
    }

    public function test_the_settings_page_shows_the_state_of_the_link()
    {
        $profile = $this->linkedTrainer();

        $this->actingAs($profile->user)->get(route('trainer.settings'))
            ->assertInertia(fn (Assert $page) => $page->where('googleCalendar', ['connected' => true, 'email' => 'giulia@gmail.com', 'error' => null]));

        config(['services.google-calendar.client_id' => null]);

        $this->actingAs($profile->user)->get(route('trainer.settings'))
            ->assertInertia(fn (Assert $page) => $page->where('googleCalendar', null));
    }

    public function test_the_connect_route_is_only_for_trainers()
    {
        $response = $this->actingAs(User::factory()->create())->get(route('trainer.google-calendar.connect'))->assertRedirect();

        // Sent away from the trainer area, not to Google.
        $this->assertStringNotContainsString('google.com', (string) $response->headers->get('Location'));
    }

    public function test_the_daily_resync_skips_the_links_that_need_reconnecting()
    {
        Http::fake();
        $this->linkedTrainer();
        $broken = $this->linkedTrainer();
        $broken->calendarConnection->update(['last_error' => 'Accesso revocato.']);

        $this->artisan('calendar:resync')->expectsOutput('1 Google calendars queued to be checked.')->assertSuccessful();
    }
}
