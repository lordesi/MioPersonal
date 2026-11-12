<?php

namespace Tests\Feature;

use App\Actions\Bookings\SendSessionReminders;
use App\Enums\BookingGuestStatus;
use App\Enums\BookingStatus;
use App\Http\Controllers\BookingInviteController;
use App\Models\Booking;
use App\Models\BookingGuest;
use App\Models\City;
use App\Models\Service;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\BookingChanged;
use App\Notifications\BookingConfirmed;
use App\Notifications\GuestJoined;
use App\Notifications\SessionReminder;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Invita un amico": the trainer opens a kind of session to more people,
 * the client books it for 2…N and shares a link; friends join with it.
 */
class BookingGuestsTest extends TestCase
{
    use RefreshDatabase;

    /** Monday 19 October 2026, 18:00 in Rome (summer time, UTC+2). */
    private const SLOT = '2026-10-19T16:00:00Z';

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));
    }

    /** "Seduta singola" 1 h at 40 €, up to 3 people: 60 € for 2, 75 € for 3. */
    private function trainer(): TrainerProfile
    {
        $trainer = TrainerProfile::factory()->approved()->bookable()
            ->inCity(City::factory()->create(['name' => 'Milano']))
            // The session is in 10 hours: still free to cancel (and to change).
            ->create(['free_cancellation_hours' => 2]);

        $trainer->services()->where('minutes', 60)->update(['group_prices' => json_encode(['2' => 6000, '3' => 7500])]);

        return $trainer;
    }

    private function service(TrainerProfile $trainer, int $minutes = 60): Service
    {
        return $trainer->services()->where('minutes', $minutes)->sole();
    }

    private function book(TrainerProfile $trainer, User $client, int $people, int $minutes = 60): TestResponse
    {
        return $this->actingAs($client)->post(route('trainers.book', $trainer->slug), [
            'service_id' => $this->service($trainer, $minutes)->id,
            'start' => self::SLOT,
            'minutes' => $minutes,
            'people' => $people,
        ]);
    }

    private function groupBooking(int $people = 3, bool $confirmed = true): Booking
    {
        $trainer = $this->trainer();

        $this->book($trainer, User::factory()->create(), $people)->assertSessionHasNoErrors();

        $booking = Booking::sole();

        if ($confirmed) {
            $booking->confirm();
        }

        // The tests choose who is signed in.
        $this->app['auth']->forgetGuards();

        return $booking->refresh();
    }

    public function test_a_client_books_a_session_for_more_people_at_the_total_price()
    {
        $trainer = $this->trainer();

        $this->book($trainer, User::factory()->create(), 3)->assertSessionHasNoErrors();

        $booking = Booking::sole();
        $this->assertSame(3, $booking->people);
        $this->assertSame(7500, $booking->price_cents);
        $this->assertSame(32, strlen((string) $booking->invite_token));
        // Still one slot: nobody else can book it.
        $this->assertFalse(TrainerSlots::isFree($trainer->refresh(), CarbonImmutable::parse(self::SLOT), 60));
    }

    public function test_one_person_is_the_usual_booking_without_a_link()
    {
        $this->book($this->trainer(), User::factory()->create(), 1)->assertSessionHasNoErrors();

        $booking = Booking::sole();
        $this->assertSame(1, $booking->people);
        $this->assertSame(4000, $booking->price_cents);
        $this->assertNull($booking->invite_token);
    }

    public function test_only_as_many_people_as_the_trainer_allows_for_that_duration()
    {
        $trainer = $this->trainer();
        $client = User::factory()->create();

        // 3 at most for 1 hour.
        $this->book($trainer, $client, 4)->assertSessionHasErrors('people');
        // 2 hours: only one person.
        $this->book($trainer, $client, 2, 120)->assertSessionHasErrors('people');

        $this->assertSame(0, Booking::count());
    }

    public function test_the_first_session_and_packages_never_take_more_people()
    {
        $service = new Service(['kind' => 'session', 'fixed_duration' => true, 'group_prices' => ['2' => 6000]]);
        $this->assertSame(1, $service->maxPeople());
        $this->assertNull($service->priceFor(2));

        $package = new Service(['kind' => 'package', 'fixed_duration' => true, 'group_prices' => ['2' => 6000]]);
        $this->assertSame(1, $package->maxPeople());
    }

    public function test_the_trainer_saves_the_prices_for_more_people()
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->create();

        $this->actingAs($profile->user)
            ->put(route('trainer.services.update'), [
                'sessions' => [[
                    'name' => 'Seduta singola',
                    'prices' => [['minutes' => 60, 'price_cents' => 5000], ['minutes' => 90, 'price_cents' => 7000]],
                    'note' => '',
                    'group_prices' => [
                        ['people' => 2, 'minutes' => 60, 'price_cents' => 5000],
                        ['people' => 2, 'minutes' => 90, 'price_cents' => 8000],
                        ['people' => 3, 'minutes' => 60, 'price_cents' => 6000],
                        ['people' => 3, 'minutes' => 90, 'price_cents' => 9000],
                    ],
                ]],
                'packages' => [],
            ])
            ->assertSessionHasNoErrors();

        $hour = $profile->services()->where('minutes', 60)->sole();
        $this->assertSame([1 => 5000, 2 => 5000, 3 => 6000], $hour->pricesByPeople());
        $this->assertSame(3, $profile->services()->where('minutes', 90)->sole()->maxPeople());

        // Read back by the page as it was sent.
        $this->actingAs($profile->user()->firstOrFail())
            ->get(route('trainer.services'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pricing.sessions.0.maxPeople', 3)
                ->has('pricing.sessions.0.group', 4)
            );
    }

    public function test_the_prices_for_more_people_cover_every_duration_and_number()
    {
        $profile = TrainerProfile::factory()->approved()->bookable()->create();

        $this->actingAs($profile->user)
            ->put(route('trainer.services.update'), [
                'sessions' => [[
                    'name' => 'Seduta singola',
                    'prices' => [['minutes' => 60, 'price_cents' => 5000], ['minutes' => 90, 'price_cents' => 7000]],
                    // 90 minutes for 2 is missing, and 3 skips nothing but 2 is incomplete.
                    'group_prices' => [
                        ['people' => 2, 'minutes' => 60, 'price_cents' => 5000],
                        ['people' => 3, 'minutes' => 60, 'price_cents' => 6000],
                        ['people' => 3, 'minutes' => 90, 'price_cents' => 9000],
                    ],
                ]],
                'packages' => [],
            ])
            ->assertSessionHasErrors('sessions.0.group_prices');
    }

    public function test_the_profile_shows_the_prices_for_more_people()
    {
        $trainer = $this->trainer();

        $this->get(route('trainers.show', $trainer->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('trainer.services.0.options.0.groupPrices', [
                    ['people' => 2, 'priceCents' => 6000],
                    ['people' => 3, 'priceCents' => 7500],
                ])
                ->where('trainer.services.0.options.1.groupPrices', [])
            );
    }

    public function test_a_friend_opens_the_link_and_joins()
    {
        Notification::fake();
        $booking = $this->groupBooking();
        $friend = User::factory()->create();

        // Without an account: the page, and a way to sign in.
        $this->get(route('bookings.invite', $booking->invite_token))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/invite')
                ->where('state', 'login')
                ->where('invite.people', 3)
                ->where('invite.freeSeats', 2)
                ->where('seo.index', false)
            );

        $this->actingAs($friend)
            ->post(route('bookings.invite.join', $booking->invite_token))
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('bookings.invite', $booking->invite_token));

        $guest = BookingGuest::sole();
        $this->assertSame($friend->id, $guest->user_id);
        $this->assertSame(BookingGuestStatus::Joined, $guest->status);
        $this->assertSame(1, $booking->freeSeats());
        Notification::assertSentTo($booking->client, GuestJoined::class);

        $this->get(route('bookings.invite', $booking->invite_token))
            ->assertInertia(fn (Assert $page) => $page->where('state', 'joined'));
    }

    public function test_no_more_friends_than_the_places()
    {
        $booking = $this->groupBooking(2);

        $this->actingAs(User::factory()->create())->post(route('bookings.invite.join', $booking->invite_token))->assertSessionHasNoErrors();

        $this->actingAs(User::factory()->create())
            ->post(route('bookings.invite.join', $booking->invite_token))
            ->assertSessionHasErrors(['invite' => BookingInviteController::NO_SEATS]);

        $this->assertSame(1, BookingGuest::count());
    }

    public function test_the_booker_cannot_join_their_own_session()
    {
        $booking = $this->groupBooking();

        $this->actingAs($booking->client)
            ->post(route('bookings.invite.join', $booking->invite_token))
            ->assertSessionHasErrors('invite');

        $this->assertSame(0, BookingGuest::count());
    }

    public function test_a_cancelled_or_past_session_takes_no_friends()
    {
        $booking = $this->groupBooking();
        $booking->forceFill(['status' => BookingStatus::Cancelled])->save();

        $this->actingAs(User::factory()->create())
            ->post(route('bookings.invite.join', $booking->invite_token))
            ->assertSessionHasErrors('invite');

        $this->get(route('bookings.invite', 'x'.substr((string) $booking->invite_token, 1)))->assertNotFound();
    }

    public function test_a_friend_who_joined_sees_the_session_without_cancelling_it()
    {
        $booking = $this->groupBooking();
        $friend = User::factory()->create();
        $booking->guests()->create(['user_id' => $friend->id]);

        $this->actingAs($friend)
            ->get(route('client.bookings'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('upcoming', 1)
                ->where('upcoming.0.id', $booking->id)
                ->where('upcoming.0.group.role', 'guest')
                ->where('upcoming.0.group.inviteUrl', null)
                ->where('upcoming.0.group.guests.0.isYou', true)
            );

        // Only the booker cancels.
        $this->actingAs($friend)->patch(route('client.bookings.cancel', $booking))->assertNotFound();
        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()?->status);
    }

    public function test_the_booker_sees_the_link_and_who_joined()
    {
        $booking = $this->groupBooking();
        $friend = User::factory()->create(['first_name' => 'Luca', 'last_name' => 'Bianchi']);
        $booking->guests()->create(['user_id' => $friend->id]);

        $this->actingAs($booking->client)
            ->get(route('client.bookings'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('upcoming.0.group.role', 'booker')
                ->where('upcoming.0.group.inviteUrl', route('bookings.invite', $booking->invite_token))
                ->where('upcoming.0.group.guests.0.name', 'Luca B.')
                ->where('upcoming.0.group.freeSeats', 1)
                ->where('upcoming.0.group.maxPeople', 3)
            );
    }

    public function test_a_friend_leaves_and_the_booker_takes_one_off()
    {
        $booking = $this->groupBooking();
        $friend = User::factory()->create();
        $other = User::factory()->create();
        $leaving = $booking->guests()->create(['user_id' => $friend->id]);
        $removed = $booking->guests()->create(['user_id' => $other->id]);

        $this->actingAs($friend)->delete(route('client.bookings.guests.destroy', [$booking, $leaving]))->assertRedirect();
        $this->actingAs($booking->client)->delete(route('client.bookings.guests.destroy', [$booking, $removed]))->assertRedirect();

        $this->assertSame(BookingGuestStatus::Left, $leaving->fresh()?->status);
        $this->assertSame(BookingGuestStatus::Removed, $removed->fresh()?->status);
        $this->assertSame(2, $booking->freeSeats());

        // Someone else can't touch the friends.
        $this->actingAs(User::factory()->create())->delete(route('client.bookings.guests.destroy', [$booking, $leaving]))->assertNotFound();
    }

    public function test_the_booker_changes_how_many_people_come()
    {
        $booking = $this->groupBooking(3);
        $booking->guests()->create(['user_id' => User::factory()->create()->id]);
        $booking->guests()->create(['user_id' => User::factory()->create()->id]);

        // Two friends joined: not down to 2.
        $this->actingAs($booking->client)
            ->patch(route('client.bookings.people', $booking), ['people' => 2])
            ->assertSessionHasErrors('people');

        $booking->guests()->latest('id')->first()?->update(['status' => BookingGuestStatus::Left]);

        $this->actingAs($booking->client)
            ->patch(route('client.bookings.people', $booking), ['people' => 2])
            ->assertSessionHasNoErrors();

        $booking->refresh();
        $this->assertSame(2, $booking->people);
        $this->assertSame(6000, $booking->price_cents);

        // Back to one person: no link any more.
        $booking->guests()->update(['status' => BookingGuestStatus::Left]);
        $this->actingAs($booking->client)->patch(route('client.bookings.people', $booking), ['people' => 1])->assertSessionHasNoErrors();
        $this->assertSame(4000, $booking->fresh()?->price_cents);
        $this->assertNull($booking->fresh()?->invite_token);
    }

    public function test_a_new_link_stops_the_old_one()
    {
        $booking = $this->groupBooking();
        $old = $booking->invite_token;

        $this->actingAs($booking->client)->post(route('client.bookings.invite.regenerate', $booking))->assertRedirect();

        $this->assertNotSame($old, $booking->fresh()?->invite_token);
        $this->get(route('bookings.invite', $old))->assertNotFound();
    }

    public function test_friends_hear_of_the_confirmation_the_cancellation_and_the_reminders()
    {
        Notification::fake();
        $booking = $this->groupBooking(3, confirmed: false);
        $friend = User::factory()->create();
        $booking->guests()->create(['user_id' => $friend->id]);

        $booking->confirm();
        Notification::assertSentTo($friend, BookingConfirmed::class);

        // Confirmed days ago: the session in 10 hours gets the day-before reminder.
        $booking->forceFill(['confirmed_at' => now()->subDays(2)])->save();
        app(SendSessionReminders::class)->handle();
        Notification::assertSentTo($friend, SessionReminder::class);

        $this->actingAs($booking->client)->patch(route('client.bookings.cancel', $booking))->assertRedirect();
        Notification::assertSentTo($friend, BookingChanged::class, fn (BookingChanged $notification) => $notification->kind === 'guest-cancelled');
    }

    public function test_the_trainer_sees_who_comes()
    {
        $booking = $this->groupBooking(3, confirmed: false);
        $booking->guests()->create(['user_id' => User::factory()->create(['first_name' => 'Sara', 'last_name' => 'Neri'])->id]);

        $this->actingAs($booking->trainerProfile->user)
            ->get(route('trainer.requests'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('requests.0.serviceName', 'Seduta singola · 3 persone')
                ->where('requests.0.guestNames', ['Sara Neri'])
            );
    }
}
