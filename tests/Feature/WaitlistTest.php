<?php

namespace Tests\Feature;

use App\Actions\GroupSessions\GroupSessionPlaces;
use App\Actions\Waitlist\Waitlist;
use App\Enums\BookingActor;
use App\Enums\GroupSessionStatus;
use App\Enums\GymLinkStatus;
use App\Models\Booking;
use App\Models\City;
use App\Models\GroupSession;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Models\WaitlistEntry;
use App\Notifications\WaitlistOpened;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Avvisami se si libera": a full event, and a day a trainer is full. */
class WaitlistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        // Monday 19 October 2026, 08:00 in Rome.
        $this->travelTo(CarbonImmutable::parse('2026-10-19 08:00', 'Europe/Rome'));
    }

    private function event(int $capacity = 2): GroupSession
    {
        $trainer = TrainerProfile::factory()->approved()->create();
        $session = GroupSession::factory()->create([
            'capacity' => $capacity,
            'offline_seats' => 0,
            'starts_at' => now()->addDays(3),
            'ends_at' => now()->addDays(3)->addHour(),
        ]);
        $session->hosts()->forceCreate([
            'group_session_id' => $session->id, 'trainer_profile_id' => $trainer->id, 'is_owner' => true, 'status' => GymLinkStatus::Accepted,
        ]);

        return $session;
    }

    private function fill(GroupSession $session, ?int $places = null): array
    {
        $clients = [];

        foreach (range(1, $places ?? $session->capacity) as $ignored) {
            $clients[] = $client = User::factory()->create();
            app(GroupSessionPlaces::class)->register($session, $client);
        }

        return $clients;
    }

    public function test_a_client_joins_the_line_of_a_full_event_and_leaves_it()
    {
        $session = $this->event();
        $this->fill($session);
        $me = User::factory()->create();

        $this->actingAs($me)->post(route('events.waitlist.join', $session->slug))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('waitlist_entries', ['user_id' => $me->id, 'group_session_id' => $session->id]);

        // Twice is still once.
        $this->post(route('events.waitlist.join', $session->slug));
        $this->assertSame(1, WaitlistEntry::count());

        $this->delete(route('events.waitlist.leave', $session->slug))->assertSessionHasNoErrors();
        $this->assertSame(0, WaitlistEntry::count());
    }

    public function test_there_is_no_line_for_an_event_with_places_left()
    {
        $session = $this->event(3);
        $this->fill($session, 2);

        $this->actingAs(User::factory()->create())->post(route('events.waitlist.join', $session->slug))
            ->assertSessionHasErrors('waitlist');
    }

    public function test_only_clients_who_are_not_already_in_can_wait()
    {
        $session = $this->event();
        [$inside] = $this->fill($session);

        $this->actingAs($inside)->post(route('events.waitlist.join', $session->slug))->assertSessionHasErrors('waitlist');
        // A trainer account is turned away before it gets to the line.
        $this->actingAs(User::factory()->trainer()->create())->post(route('events.waitlist.join', $session->slug));
        $this->assertSame(0, WaitlistEntry::count());
    }

    public function test_the_first_in_line_is_told_when_a_place_is_given_back()
    {
        $session = $this->event();
        [$first] = $this->fill($session);
        $one = User::factory()->create();
        $two = User::factory()->create();
        app(Waitlist::class)->joinEvent($one, $session);
        app(Waitlist::class)->joinEvent($two, $session);

        app(GroupSessionPlaces::class)->cancel($session, $first);

        // One place, one person told; nothing is booked for them.
        Notification::assertSentTo($one, WaitlistOpened::class);
        Notification::assertNotSentTo($two, WaitlistOpened::class);
        $this->assertSame(1, $session->activeRegistrations()->count());
        $this->assertNotNull(WaitlistEntry::where('user_id', $one->id)->value('notified_at'));
    }

    public function test_the_next_in_line_is_told_when_the_turn_is_not_used()
    {
        $session = $this->event(1);
        [$inside] = $this->fill($session);
        $one = User::factory()->create();
        $two = User::factory()->create();
        app(Waitlist::class)->joinEvent($one, $session);
        app(Waitlist::class)->joinEvent($two, $session);
        app(GroupSessionPlaces::class)->cancel($session, $inside);
        Notification::assertSentToTimes($one, WaitlistOpened::class, 1);

        // Within the hours of precedence nobody else is told, even sweeping again.
        $this->travel(2)->hours();
        app(Waitlist::class)->sweep();
        Notification::assertNotSentTo($two, WaitlistOpened::class);

        // After them the place goes to the next one, and the first loses the line.
        $this->travel(2)->hours();
        app(Waitlist::class)->sweep();
        Notification::assertSentToTimes($two, WaitlistOpened::class, 1);
        $this->assertDatabaseMissing('waitlist_entries', ['user_id' => $one->id]);
    }

    public function test_taking_the_place_takes_you_out_of_the_line()
    {
        $session = $this->event(1);
        [$inside] = $this->fill($session);
        $one = User::factory()->create();
        app(Waitlist::class)->joinEvent($one, $session);
        app(GroupSessionPlaces::class)->cancel($session, $inside);

        app(GroupSessionPlaces::class)->register($session->fresh(), $one);

        $this->assertSame(0, WaitlistEntry::count());
    }

    public function test_a_place_set_free_by_the_organizer_tells_the_line_too()
    {
        $session = $this->event();
        $this->fill($session);
        $session->update(['offline_seats' => 0]);
        $one = User::factory()->create();
        app(Waitlist::class)->joinEvent($one, $session);

        app(GroupSessionPlaces::class)->remove($session->registrations()->firstOrFail());

        Notification::assertSentTo($one, WaitlistOpened::class);
    }

    public function test_a_cancelled_event_closes_its_line()
    {
        $session = $this->event();
        $this->fill($session);
        app(Waitlist::class)->joinEvent(User::factory()->create(), $session);

        $session->update(['status' => GroupSessionStatus::Cancelled]);
        app(Waitlist::class)->sweep();

        $this->assertSame(0, WaitlistEntry::count());
    }

    public function test_the_event_page_tells_whether_the_viewer_is_in_line()
    {
        $session = $this->event();
        $this->fill($session);
        $me = User::factory()->create();
        app(Waitlist::class)->joinEvent($me, $session);
        app(Waitlist::class)->joinEvent(User::factory()->create(), $session);

        $this->actingAs($me)->get(route('events.show', $session->slug))
            ->assertInertia(fn (Assert $page) => $page->where('waitlist', ['joined' => true, 'count' => 2]));
        $this->actingAs(User::factory()->create())->get(route('events.show', $session->slug))
            ->assertInertia(fn (Assert $page) => $page->where('waitlist.joined', false));
    }

    // ---- a trainer's day ----

    private function trainer(): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->bookable()->inCity(City::factory()->create())->create()->fresh();
    }

    /** Fills Wednesday 21 October: the trainer works 18:00–21:00, three one-hour sessions. */
    private function fullDay(TrainerProfile $trainer): array
    {
        $bookings = [];

        foreach ([18, 19, 20] as $hour) {
            $bookings[] = Booking::factory()->for($trainer)->confirmed()
                ->at(CarbonImmutable::parse("2026-10-21 {$hour}:00", 'Europe/Rome'))->create();
        }

        return $bookings;
    }

    public function test_a_client_waits_for_a_full_day_and_only_for_a_full_day()
    {
        $trainer = $this->trainer();
        $this->fullDay($trainer);
        $me = User::factory()->create();

        $this->actingAs($me)->post(route('trainers.waitlist.join', $trainer->slug), ['date' => '2026-10-21'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('waitlist_entries', ['user_id' => $me->id, 'trainer_profile_id' => $trainer->id]);

        // A free day, a past day and a day beyond the window: nothing to wait for.
        $this->post(route('trainers.waitlist.join', $trainer->slug), ['date' => '2026-10-22'])->assertSessionHasErrors('waitlist');
        $this->post(route('trainers.waitlist.join', $trainer->slug), ['date' => '2026-10-18'])->assertSessionHasErrors('waitlist');
        $this->post(route('trainers.waitlist.join', $trainer->slug), ['date' => '2027-12-01'])->assertSessionHasErrors('waitlist');
        $this->post(route('trainers.waitlist.join', $trainer->slug), ['date' => 'domani'])->assertSessionHasErrors('date');
    }

    public function test_the_trainer_cannot_wait_for_themselves()
    {
        $trainer = $this->trainer();
        $this->fullDay($trainer);

        $this->actingAs($trainer->user)->post(route('trainers.waitlist.join', $trainer->slug), ['date' => '2026-10-21']);

        $this->assertSame(0, WaitlistEntry::count());
    }

    public function test_a_cancelled_session_tells_who_waits_for_that_day()
    {
        $trainer = $this->trainer();
        [$first] = $this->fullDay($trainer);
        $me = User::factory()->create();
        app(Waitlist::class)->joinDay($me, $trainer, '2026-10-21');

        $first->cancel(BookingActor::Client, $first->client);

        Notification::assertSentTo($me, WaitlistOpened::class, fn (WaitlistOpened $notification) => $notification->date === '2026-10-21');
    }

    public function test_a_session_moved_to_another_day_frees_the_old_one()
    {
        $trainer = $this->trainer();
        [$first] = $this->fullDay($trainer);
        $me = User::factory()->create();
        app(Waitlist::class)->joinDay($me, $trainer, '2026-10-21');

        $start = CarbonImmutable::parse('2026-10-22 18:00', 'Europe/Rome');
        $first->forceFill(['starts_at' => $start, 'ends_at' => $start->addHour(), 'blocked_until' => $start->addHour()])->save();

        Notification::assertSentTo($me, WaitlistOpened::class);
    }

    public function test_nobody_is_told_while_the_day_is_still_full()
    {
        $trainer = $this->trainer();
        $this->fullDay($trainer);
        app(Waitlist::class)->joinDay(User::factory()->create(), $trainer, '2026-10-21');

        app(Waitlist::class)->sweep();

        Notification::assertNothingSent();
    }

    public function test_who_books_that_day_leaves_the_line()
    {
        $trainer = $this->trainer();
        [$first] = $this->fullDay($trainer);
        $me = User::factory()->create();
        app(Waitlist::class)->joinDay($me, $trainer, '2026-10-21');
        $first->cancel(BookingActor::Client, $first->client);

        $this->actingAs($me)->post(route('trainers.book', $trainer->slug), [
            'service_id' => $trainer->services()->where('minutes', 60)->value('id'),
            'start' => '2026-10-21T16:00:00Z',
            'minutes' => 60,
        ])->assertSessionHasNoErrors();

        $this->assertSame(0, WaitlistEntry::count());
    }

    public function test_old_days_are_cleaned_and_the_profile_page_lists_the_days_waited_for()
    {
        $trainer = $this->trainer();
        $this->fullDay($trainer);
        $me = User::factory()->create();
        app(Waitlist::class)->joinDay($me, $trainer, '2026-10-21');

        $this->actingAs($me)->get(route('trainers.show', $trainer->slug))
            ->assertInertia(fn (Assert $page) => $page->where('trainer.waitlistDays', ['2026-10-21']));

        $this->travelTo(CarbonImmutable::parse('2026-10-23 08:00', 'Europe/Rome'));
        app(Waitlist::class)->sweep();

        $this->assertSame(0, WaitlistEntry::count());
    }
}
