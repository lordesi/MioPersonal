<?php

namespace Tests\Feature;

use App\Actions\GroupSessions\SendGroupSessionReminders;
use App\Enums\GroupSessionStatus;
use App\Enums\GymLinkStatus;
use App\Enums\RegistrationStatus;
use App\Enums\TrainerProfileStatus;
use App\Models\City;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Notifications\GroupSessionChanged;
use App\Notifications\GroupSessionHostInvited;
use App\Notifications\GroupSessionJoined;
use App\Notifications\GroupSessionReminder;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * "Eventi": trainers and gyms publish appointments with N places; a place
 * is confirmed at once while there are places left; the organizers set the
 * places left by hand for the people who booked outside the app.
 */
class GroupSessionsTest extends TestCase
{
    use RefreshDatabase;

    private City $milano;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        Storage::fake('public');
        // Monday 19 October 2026, morning in Rome.
        $this->travelTo(CarbonImmutable::parse('2026-10-19 09:00', 'Europe/Rome'));
        $this->milano = City::factory()->create(['name' => 'Milano', 'slug' => 'milano']);
    }

    /**
     * What "Nuovo evento" sends.
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function form(array $changes = []): array
    {
        return [
            'type' => 'workshop',
            'title' => 'Workshop di mobilità',
            'description' => 'Per la schiena.',
            'discipline_id' => null,
            'place' => 'address',
            'gym_profile_id' => null,
            'address' => 'Parco Sempione',
            'city_id' => $this->milano->id,
            'date' => '2026-10-24',
            'start' => '10:00',
            'end' => '11:30',
            'capacity' => 20,
            'price' => '15,50',
            'dates' => 1,
            ...$changes,
        ];
    }

    private function trainer(): TrainerProfile
    {
        return TrainerProfile::factory()->approved()->inCity($this->milano)->create();
    }

    private function event(TrainerProfile|GymProfile $owner, int $capacity = 10): GroupSession
    {
        return GroupSession::factory()->by($owner)->capacity($capacity)->create(['city_id' => $this->milano->id]);
    }

    public function test_an_approved_trainer_publishes_an_event()
    {
        $trainer = $this->trainer();

        $this->actingAs($trainer->user)
            ->post(route('trainer.events.store'), $this->form(['cover' => UploadedFile::fake()->image('cover.jpg', 1200, 700)]))
            ->assertSessionHasNoErrors();

        $event = GroupSession::sole();
        $this->assertSame('Workshop di mobilità', $event->title);
        $this->assertSame(1550, $event->price_cents);
        $this->assertSame('2026-10-24 08:00', $event->starts_at->utc()->format('Y-m-d H:i'));
        $this->assertTrue($event->hosts()->sole()->is_owner);
        Storage::disk('public')->assertExists((string) $event->cover_path);

        $this->get(route('events.search', 'milano'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('public/events')
                ->has('events', 1)
                ->where('events.0.price', '15,50 €')
                ->where('events.0.remaining', 20));

        $this->get(route('events.show', $event->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('public/event')->where('state', 'organizer'));
    }

    public function test_a_profile_not_approved_cant_publish()
    {
        $trainer = TrainerProfile::factory()->status(TrainerProfileStatus::Review)->create();

        $this->actingAs($trainer->user)->post(route('trainer.events.store'), $this->form())->assertForbidden();
        $this->assertSame(0, GroupSession::count());
    }

    public function test_a_weekly_event_makes_one_date_per_week()
    {
        $gym = GymProfile::factory()->approved()->inCity($this->milano)->create();

        $this->actingAs($gym->user)
            ->post(route('gym.events.store'), $this->form(['place' => 'gym', 'gym_profile_id' => $gym->id, 'dates' => 4]))
            ->assertSessionHasNoErrors();

        $dates = GroupSession::orderBy('starts_at')->get();
        $this->assertCount(4, $dates);
        $this->assertCount(1, $dates->pluck('series_id')->unique());
        $this->assertSame('2026-11-14', $dates[3]->starts_at->setTimezone('Europe/Rome')->toDateString());
        $this->assertSame($this->milano->id, $dates[0]->city_id);

        // "Questa e le successive": from the second date on, at 18:00.
        $this->actingAs($gym->user)
            ->post(route('gym.events.update', $dates[1]), $this->form([
                'place' => 'gym', 'gym_profile_id' => $gym->id,
                'date' => '2026-10-31', 'start' => '18:00', 'end' => '19:00', 'scope' => 'following',
            ]))
            ->assertSessionHasNoErrors();

        $hours = GroupSession::orderBy('starts_at')->get()->map(fn (GroupSession $event) => $event->starts_at->setTimezone('Europe/Rome')->format('H:i'))->all();
        $this->assertSame(['10:00', '18:00', '18:00', '18:00'], $hours);

        // At most 12 dates.
        $this->actingAs($gym->user)
            ->post(route('gym.events.store'), $this->form(['place' => 'gym', 'gym_profile_id' => $gym->id, 'dates' => 13]))
            ->assertSessionHasErrors('dates');
    }

    public function test_a_client_takes_a_place_until_they_are_over()
    {
        $event = $this->event($this->trainer(), capacity: 2);
        $first = User::factory()->create();
        $second = User::factory()->create();
        $third = User::factory()->create();

        $this->actingAs($first)->post(route('events.register', $event->slug))->assertSessionHasNoErrors();
        Notification::assertSentTo($first, GroupSessionJoined::class);

        // Twice: only one place.
        $this->actingAs($first)->post(route('events.register', $event->slug))->assertSessionHasErrors('place');

        $this->actingAs($second)->post(route('events.register', $event->slug))->assertSessionHasNoErrors();
        $this->actingAs($third)->post(route('events.register', $event->slug))->assertSessionHasErrors('place');
        $this->assertSame(0, $event->fresh()?->remainingSeats());

        // Given back: the place is free again.
        $this->actingAs($second)->delete(route('events.cancel', $event->slug))->assertSessionHasNoErrors();
        $this->actingAs($third)->post(route('events.register', $event->slug))->assertSessionHasNoErrors();

        $this->actingAs($third)->get(route('events.show', $event->slug))
            ->assertInertia(fn (Assert $page) => $page->where('state', 'registered')->where('event.remaining', 0));
    }

    public function test_only_clients_take_places_and_guests_go_through_the_login()
    {
        $event = $this->event($this->trainer());

        $this->get(route('events.show', $event->slug))->assertInertia(fn (Assert $page) => $page->where('state', 'open'));
        $this->get(route('events.start', $event->slug))->assertRedirect(route('login'));

        $otherTrainer = $this->trainer();
        $this->actingAs($otherTrainer->user)->post(route('events.register', $event->slug))->assertRedirect();
        $this->assertSame(0, $event->registrations()->count());
    }

    public function test_the_places_left_by_hand_count_the_people_outside_the_app()
    {
        $trainer = $this->trainer();
        $event = $this->event($trainer, capacity: 20);
        $event->registrations()->createMany(collect(range(1, 3))->map(fn () => [
            'user_id' => User::factory()->create()->id,
            'status' => RegistrationStatus::Registered,
        ])->all());

        $this->actingAs($trainer->user)
            ->put(route('trainer.events.seats', $event), ['remaining' => 0])
            ->assertSessionHasNoErrors();

        $this->assertSame(17, $event->fresh()?->offline_seats);
        $this->assertSame(0, $event->fresh()?->remainingSeats());
        $this->actingAs(User::factory()->create())->post(route('events.register', $event->slug))->assertSessionHasErrors('place');

        // Not more than the places not taken by the clients of the app.
        $this->actingAs($trainer->user)
            ->put(route('trainer.events.seats', $event), ['remaining' => 18])
            ->assertSessionHasErrors('remaining');

        $this->actingAs($trainer->user)->put(route('trainer.events.seats', $event), ['remaining' => 5]);
        $this->assertSame(12, $event->fresh()?->offline_seats);
    }

    public function test_cancelling_tells_the_clients_and_the_capacity_never_goes_under_them()
    {
        $trainer = $this->trainer();
        $event = $this->event($trainer);
        $client = User::factory()->create();
        $event->registrations()->create(['user_id' => $client->id, 'status' => RegistrationStatus::Registered]);
        $event->registrations()->create(['user_id' => User::factory()->create()->id, 'status' => RegistrationStatus::Registered]);

        $this->actingAs($trainer->user)
            ->post(route('trainer.events.update', $event), $this->form(['capacity' => 1]))
            ->assertSessionHasErrors('capacity');

        // Another time: the clients are told.
        $this->actingAs($trainer->user)
            ->post(route('trainer.events.update', $event), $this->form(['date' => '2026-10-25']))
            ->assertSessionHasNoErrors();
        Notification::assertSentTo($client, GroupSessionChanged::class, fn (GroupSessionChanged $notification) => $notification->kind === GroupSessionChanged::MOVED);

        // With clients it can't be deleted, only cancelled.
        $this->actingAs($trainer->user)->delete(route('trainer.events.destroy', $event))->assertSessionHasErrors('delete');

        $this->actingAs($trainer->user)
            ->post(route('trainer.events.cancel', $event), ['note' => 'Pioggia'])
            ->assertSessionHasNoErrors();

        $this->assertSame(GroupSessionStatus::Cancelled, $event->fresh()?->status);
        Notification::assertSentTo($client, GroupSessionChanged::class, fn (GroupSessionChanged $notification) => $notification->kind === GroupSessionChanged::CANCELLED);
        $this->get(route('events.search'))->assertInertia(fn (Assert $page) => $page->has('events', 0));
    }

    public function test_co_organizers_are_invited_up_to_the_limit()
    {
        $owner = $this->trainer();
        $event = $this->event($owner);
        $gym = GymProfile::factory()->approved()->inCity($this->milano)->create();
        $others = TrainerProfile::factory()->approved()->count(3)->create();

        $this->actingAs($owner->user)
            ->post(route('trainer.events.hosts.store', $event), ['kind' => 'gym', 'slug' => $gym->slug])
            ->assertSessionHasNoErrors();
        Notification::assertSentTo($gym->user, GroupSessionHostInvited::class);

        $this->actingAs($owner->user)->post(route('trainer.events.hosts.store', $event), ['kind' => 'trainer', 'slug' => $others[0]->slug]);
        $this->actingAs($owner->user)->post(route('trainer.events.hosts.store', $event), ['kind' => 'trainer', 'slug' => $others[1]->slug]);
        // The fifth organizer is one too many.
        $this->actingAs($owner->user)
            ->post(route('trainer.events.hosts.store', $event), ['kind' => 'trainer', 'slug' => $others[2]->slug])
            ->assertSessionHasErrors('host');

        // The gym accepts: it sees the clients and the event is on its profile.
        $invite = $event->hosts()->where('gym_profile_id', $gym->id)->sole();
        $this->actingAs($gym->user)->post(route('gym.events.invites.accept', $invite))->assertRedirect();
        $this->assertSame(GymLinkStatus::Accepted, $invite->fresh()?->status);
        $this->actingAs($gym->user)->get(route('gym.events.show', $event))->assertOk()->assertInertia(fn (Assert $page) => $page->where('isOwner', false));
        $this->get(route('gyms.show', $gym->slug))->assertInertia(fn (Assert $page) => $page->has('events', 1));

        // A co-organizer can't change or cancel the event, it can leave.
        $this->actingAs($gym->user)->post(route('gym.events.cancel', $event))->assertForbidden();
        $this->actingAs($gym->user)->delete(route('gym.events.hosts.destroy', [$event, $invite]))->assertRedirect(route('gym.events'));
        $this->assertSame(0, $event->hosts()->where('gym_profile_id', $gym->id)->count());

        // Not an organizer: nothing to see.
        $this->actingAs($others[2]->user)->get(route('trainer.events.show', $event))->assertNotFound();
    }

    public function test_an_event_of_the_trainer_takes_its_time_from_the_bookings()
    {
        $trainer = TrainerProfile::factory()->approved()->bookable()->inCity($this->milano)->create();
        // Tuesday 20 October, 18:00–19:00: one of the evening hours.
        GroupSession::factory()->by($trainer)->startingAt(CarbonImmutable::parse('2026-10-20 18:00', 'Europe/Rome'))->create();

        $trainer = $trainer->fresh();
        $this->assertNotNull($trainer);
        $this->assertFalse(TrainerSlots::isFree($trainer, CarbonImmutable::parse('2026-10-20 18:00', 'Europe/Rome'), 60));
        $this->assertTrue(TrainerSlots::isFree($trainer, CarbonImmutable::parse('2026-10-20 19:00', 'Europe/Rome'), 60));
    }

    public function test_the_reminders_go_out_once()
    {
        $event = GroupSession::factory()->by($this->trainer())->startingAt(now()->addHours(20))->create();
        $client = User::factory()->create();
        $this->travelTo(now()->subDays(2));
        $event->registrations()->create(['user_id' => $client->id, 'status' => RegistrationStatus::Registered]);
        $this->travelBack();
        $this->travelTo(CarbonImmutable::parse('2026-10-19 09:00', 'Europe/Rome'));

        $this->assertSame(1, app(SendGroupSessionReminders::class)->handle());
        $this->assertSame(0, app(SendGroupSessionReminders::class)->handle());
        Notification::assertSentToTimes($client, GroupSessionReminder::class, 1);
    }

    public function test_the_client_home_and_news_show_the_events()
    {
        $event = $this->event($this->trainer());
        $client = User::factory()->create();
        $event->registrations()->create(['user_id' => $client->id, 'status' => RegistrationStatus::Registered]);

        $this->actingAs($client)->get(route('client.home'))
            ->assertInertia(fn (Assert $page) => $page->has('events', 1)->where('events.0.slug', $event->slug));

        $this->get(route('news'))->assertInertia(fn (Assert $page) => $page->has('events', 1));
        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page->has('news.events', 1));
        $this->get(route('sitemap'))->assertSee(route('events.show', $event->slug), false);
    }

    public function test_the_team_hides_an_event()
    {
        $event = $this->event($this->trainer());
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->withSession(['auth.password_confirmed_at' => time()])
            ->post(route('admin.events.hide', $event))
            ->assertRedirect();

        $this->assertNotNull($event->fresh()?->hidden_at);
        $this->app['auth']->forgetGuards();
        $this->get(route('events.show', $event->slug))->assertNotFound();
        $this->get(route('events.search'))->assertInertia(fn (Assert $page) => $page->has('events', 0));
    }
}
