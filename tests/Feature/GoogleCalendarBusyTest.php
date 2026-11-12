<?php

namespace Tests\Feature;

use App\Actions\Bookings\CreateBooking;
use App\Actions\Calendar\SyncBusyTimes;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\Socialite\GoogleCalendarProvider;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialUser;
use Tests\TestCase;

/** "Blocca gli orari occupati": the busy times on Google can't be booked. Optional. */
class GoogleCalendarBusyTest extends TestCase
{
    use RefreshDatabase;

    private const API = 'https://www.googleapis.com/calendar/v3';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);
        config(['services.google-calendar.client_id' => 'google-id', 'services.google-calendar.client_secret' => 'secret']);
        // Monday 12 October 2026, 08:00 in Rome; the factory works 18–21 every day.
        $this->travelTo(CarbonImmutable::parse('2026-10-12 08:00', 'Europe/Rome'));
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    private function linkedTrainer(bool $readsBusy = true): TrainerProfile
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->create();
        $profile->calendarConnection()->create([
            'google_user_id' => 'g-1',
            'google_email' => 'giulia@gmail.com',
            'access_token' => 'access-1',
            'refresh_token' => 'refresh-1',
            'token_expires_at' => now()->addHour(),
            'calendar_id' => 'cal-mp',
            'connected_at' => now(),
            'reads_busy_at' => $readsBusy ? now() : null,
        ]);

        return $profile->refresh()->load('workingHours');
    }

    /** Busy today 19:00–20:00 in Rome (17–18 UTC) on the personal calendar. */
    private function fakeGoogle(): void
    {
        Http::fake([
            self::API.'/users/me/calendarList*' => Http::response(['items' => [
                ['id' => 'primary@gmail.com', 'accessRole' => 'owner'],
                ['id' => 'cal-mp', 'accessRole' => 'owner'],
                ['id' => 'gone', 'accessRole' => 'owner', 'deleted' => true],
            ]]),
            self::API.'/freeBusy' => Http::sequence()
                ->push(['calendars' => ['primary@gmail.com' => ['busy' => [['start' => '2026-10-12T17:00:00Z', 'end' => '2026-10-12T18:00:00Z']]]]])
                ->whenEmpty(Http::response(['calendars' => []])),
        ]);
    }

    /** @return list<string> */
    private function todayStarts(TrainerProfile $profile): array
    {
        return array_column(TrainerSlots::days($profile, 1)[0]['slots'], 'start');
    }

    public function test_the_busy_times_of_the_own_calendars_are_read_and_block_the_slots()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();

        $this->assertSame(['2026-10-12T16:00:00Z', '2026-10-12T17:00:00Z', '2026-10-12T18:00:00Z'], $this->todayStarts($profile));

        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        // Only the calendars to write on, and never "MioPersonal" (its sessions are already here).
        Http::assertSent(fn ($request) => str_contains($request->url(), 'calendarList') && str_contains($request->url(), 'minAccessRole=writer'));
        Http::assertSent(fn ($request) => $request->url() === self::API.'/freeBusy' && $request['items'] === [['id' => 'primary@gmail.com']]);
        $this->assertDatabaseCount('calendar_busy_times', 1);
        $this->assertNotNull($profile->calendarConnection()->first()->busy_synced_at);

        // 19:00 is taken; 18:00 can last only one hour.
        $this->assertSame([
            ['start' => '2026-10-12T16:00:00Z', 'maxMinutes' => 60],
            ['start' => '2026-10-12T18:00:00Z', 'maxMinutes' => 60],
        ], TrainerSlots::days($profile, 1)[0]['slots']);
        $this->assertFalse(TrainerSlots::isFree($profile, CarbonImmutable::parse('2026-10-12T17:00:00Z'), 60));
    }

    public function test_the_break_counts_around_a_busy_time()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();
        $profile->update(['break_minutes' => 15]);

        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        // 18:00 must end 15 minutes before 19:00: no hour fits; 20:00 starts 15 minutes after the end.
        $this->assertSame([], $this->todayStarts($profile->refresh()));
    }

    public function test_a_busy_time_is_not_a_session_for_the_daily_maximum()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();
        $profile->update(['max_sessions_per_day' => 1]);

        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        $this->assertNotSame([], $this->todayStarts($profile->refresh()));
    }

    public function test_off_by_default_nothing_is_read_nor_blocked()
    {
        Http::fake();
        $profile = $this->linkedTrainer(readsBusy: false);
        $profile->calendarConnection->busyTimes()->create(['starts_at' => '2026-10-12T16:00:00Z', 'ends_at' => '2026-10-12T19:00:00Z']);

        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        Http::assertNothingSent();
        $this->assertCount(3, $this->todayStarts($profile));
    }

    public function test_reading_again_replaces_the_old_times()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();
        $profile->calendarConnection->busyTimes()->create(['starts_at' => '2026-10-12T16:00:00Z', 'ends_at' => '2026-10-12T17:00:00Z']);

        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        $this->assertDatabaseCount('calendar_busy_times', 1);
        $this->assertDatabaseHas('calendar_busy_times', ['starts_at' => '2026-10-12 17:00:00']);
    }

    public function test_the_first_free_slot_of_the_search_is_updated()
    {
        $profile = $this->linkedTrainer();
        TrainerSlots::refresh($profile);
        $this->assertSame('2026-10-12 16:00:00', $profile->next_free_slot_at->utc()->format('Y-m-d H:i:s'));
        // Busy all the evening: the first free slot moves to tomorrow.
        Http::fake([
            self::API.'/users/me/calendarList*' => Http::response(['items' => [['id' => 'primary@gmail.com', 'accessRole' => 'owner']]]),
            self::API.'/freeBusy' => Http::sequence()
                ->push(['calendars' => ['primary@gmail.com' => ['busy' => [['start' => '2026-10-12T15:00:00Z', 'end' => '2026-10-12T20:00:00Z']]]]])
                ->whenEmpty(Http::response(['calendars' => []])),
        ]);

        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        $this->assertSame('2026-10-13 16:00:00', $profile->refresh()->next_free_slot_at->utc()->format('Y-m-d H:i:s'));
    }

    public function test_the_permission_taken_off_turns_the_option_off()
    {
        Http::fake([self::API.'/*' => Http::response(['error' => ['errors' => [['reason' => 'insufficientPermissions']]]], 403)]);
        $profile = $this->linkedTrainer();
        $profile->calendarConnection->busyTimes()->create(['starts_at' => '2026-10-12T16:00:00Z', 'ends_at' => '2026-10-12T19:00:00Z']);

        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        $connection = $profile->calendarConnection()->first();
        $this->assertNull($connection->reads_busy_at);
        // The sessions are still written: no "Ricollega".
        $this->assertNull($connection->last_error);
        $this->assertDatabaseCount('calendar_busy_times', 0);
    }

    public function test_access_lost_asks_to_link_again_and_drops_the_times()
    {
        Http::fake(['https://oauth2.googleapis.com/*' => Http::response(['error' => 'invalid_grant'], 400)]);
        $profile = $this->linkedTrainer();
        $profile->calendarConnection->update(['token_expires_at' => now()->subMinute()]);
        $profile->calendarConnection->busyTimes()->create(['starts_at' => '2026-10-12T16:00:00Z', 'ends_at' => '2026-10-12T19:00:00Z']);

        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        $this->assertNotNull($profile->calendarConnection()->first()->last_error);
        $this->assertDatabaseCount('calendar_busy_times', 0);
    }

    public function test_google_down_keeps_the_last_times()
    {
        Http::fake([self::API.'/*' => Http::response(['error' => 'boom'], 500)]);
        $profile = $this->linkedTrainer();
        $profile->calendarConnection->busyTimes()->create(['starts_at' => '2026-10-12T16:00:00Z', 'ends_at' => '2026-10-12T19:00:00Z']);

        try {
            app(SyncBusyTimes::class)->run($profile->calendarConnection);
            $this->fail('A Google failure is thrown again, to be retried.');
        } catch (RequestException) {
        }

        $this->assertDatabaseCount('calendar_busy_times', 1);
        $this->assertNull($profile->calendarConnection()->first()->last_error);
    }

    public function test_turning_it_on_asks_google_for_the_permission()
    {
        $profile = $this->linkedTrainer(readsBusy: false);

        $response = $this->actingAs($profile->user)->get(route('trainer.google-calendar.connect', ['occupato' => 1]))->assertRedirect();

        $location = (string) $response->headers->get('Location');
        $this->assertStringContainsString(urlencode(GoogleCalendarProvider::BUSY_SCOPES[1]), $location);
        $this->assertStringContainsString('include_granted_scopes=true', $location);
    }

    public function test_coming_back_with_the_permission_turns_it_on()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer(readsBusy: false);
        Socialite::fake('google-calendar', $this->account([GoogleCalendarProvider::SCOPE, ...GoogleCalendarProvider::BUSY_SCOPES]));

        $this->actingAs($profile->user)->withSession(['google_calendar_busy_requested' => true])
            ->get(route('trainer.google-calendar.callback'))->assertRedirect(route('trainer.settings'));

        $this->assertTrue($profile->calendarConnection()->first()->readsBusy());
        $this->assertDatabaseCount('calendar_busy_times', 1);
    }

    public function test_coming_back_without_the_permission_leaves_it_off()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer(readsBusy: false);
        Socialite::fake('google-calendar', $this->account([GoogleCalendarProvider::SCOPE]));

        $this->actingAs($profile->user)->withSession(['google_calendar_busy_requested' => true])
            ->get(route('trainer.google-calendar.callback'));

        $connection = $profile->calendarConnection()->first();
        $this->assertFalse($connection->readsBusy());
        // The link to write is kept.
        $this->assertNull($connection->last_error);
        $this->assertDatabaseCount('calendar_busy_times', 0);
    }

    public function test_turning_it_off_drops_the_times_and_frees_the_slots()
    {
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();
        app(SyncBusyTimes::class)->run($profile->calendarConnection);

        $this->actingAs($profile->user)->delete(route('trainer.google-calendar.busy.disable'))->assertRedirect();

        $this->assertFalse($profile->calendarConnection()->first()->readsBusy());
        $this->assertDatabaseCount('calendar_busy_times', 0);
        $this->assertCount(3, $this->todayStarts($profile));
    }

    public function test_unlinking_drops_the_times_too()
    {
        Http::fake();
        $profile = $this->linkedTrainer();
        $profile->calendarConnection->busyTimes()->create(['starts_at' => '2026-10-12T16:00:00Z', 'ends_at' => '2026-10-12T19:00:00Z']);

        $this->actingAs($profile->user)->delete(route('trainer.google-calendar.disconnect'));

        $this->assertDatabaseCount('calendar_busy_times', 0);
    }

    public function test_the_settings_page_shows_the_option()
    {
        $profile = $this->linkedTrainer();

        $this->actingAs($profile->user)->get(route('trainer.settings'))
            ->assertInertia(fn (Assert $page) => $page->where('googleCalendar.readsBusy', true));
    }

    public function test_the_scheduled_read_skips_the_off_and_the_broken_links()
    {
        Http::fake();
        $this->linkedTrainer();
        $this->linkedTrainer(readsBusy: false);
        $this->linkedTrainer()->calendarConnection->update(['last_error' => 'Accesso revocato.']);

        $this->artisan('calendar:busy')->expectsOutput('1 Google calendars queued to read the busy times.')->assertSuccessful();
    }

    /** @return array<string, mixed> 60 minutes today at 19:00 in Rome */
    private function bookingRequest(TrainerProfile $profile): array
    {
        return [
            'service_id' => $profile->services()->where('minutes', 60)->value('id'),
            'start' => '2026-10-12T17:00:00Z',
            'minutes' => 60,
        ];
    }

    public function test_a_request_is_checked_live_on_google()
    {
        // Saved times: nothing yet. Google, right now: busy at 19:00.
        $this->fakeGoogle();
        $profile = $this->linkedTrainer();

        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $profile->slug), $this->bookingRequest($profile))
            ->assertSessionHasErrors(['start' => CreateBooking::TRAINER_BUSY]);

        $this->assertDatabaseCount('bookings', 0);
        // Only the minutes of the session asked, and the busy time saved for everyone.
        Http::assertSent(fn ($request) => $request->url() === self::API.'/freeBusy'
            && $request['timeMin'] === '2026-10-12T17:00:00+00:00' && $request['timeMax'] === '2026-10-12T18:00:00+00:00');
        $this->assertDatabaseCount('calendar_busy_times', 1);
        $this->assertFalse(TrainerSlots::isFree($profile, CarbonImmutable::parse('2026-10-12T17:00:00Z'), 60));
    }

    public function test_a_request_free_on_google_goes_through()
    {
        Http::fake([
            self::API.'/users/me/calendarList*' => Http::response(['items' => [['id' => 'primary@gmail.com', 'accessRole' => 'owner']]]),
            self::API.'/freeBusy' => Http::response(['calendars' => ['primary@gmail.com' => ['busy' => []]]]),
        ]);
        $profile = $this->linkedTrainer();

        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $profile->slug), $this->bookingRequest($profile))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('bookings', 1);
    }

    public function test_google_down_never_stops_a_request()
    {
        Http::fake([self::API.'/*' => Http::response(['error' => 'boom'], 500)]);
        $profile = $this->linkedTrainer();

        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $profile->slug), $this->bookingRequest($profile))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('bookings', 1);
    }

    public function test_without_the_option_a_request_asks_nothing_to_google()
    {
        Http::fake();
        $profile = $this->linkedTrainer(readsBusy: false);

        $this->actingAs(User::factory()->create())
            ->post(route('trainers.book', $profile->slug), $this->bookingRequest($profile))
            ->assertSessionHasNoErrors();

        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'freeBusy'));
    }

    /** @param  list<string>  $scopes */
    private function account(array $scopes): SocialUser
    {
        $account = (new SocialUser)->map(['id' => 'g-1', 'email' => 'giulia@gmail.com', 'name' => 'Giulia']);
        $account->token = 'access-new';
        $account->refreshToken = 'refresh-new';
        $account->expiresIn = 3600;
        $account->approvedScopes = $scopes;

        return $account;
    }
}
