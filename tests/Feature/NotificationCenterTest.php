<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteUser;
use App\Models\Booking;
use App\Models\GroupSession;
use App\Models\User;
use App\Notifications\BookingChanged;
use App\Notifications\BookingConfirmed;
use App\Notifications\GroupSessionChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** The bell of the site: the notifications saved for each person, and which events are still emailed. */
class NotificationCenterTest extends TestCase
{
    use RefreshDatabase;

    private function notify(User $user, string $title, ?string $readAt = null, ?string $createdAt = null): DatabaseNotification
    {
        return $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => BookingConfirmed::class,
            'data' => ['title' => $title, 'body' => 'Il testo', 'url' => '/area-cliente'],
            'read_at' => $readAt,
            'created_at' => $createdAt ?? now(),
        ]);
    }

    public function test_guests_cannot_open_the_bell()
    {
        $this->getJson(route('notifications.index'))->assertUnauthorized();
        $this->postJson(route('notifications.read'))->assertUnauthorized();
    }

    public function test_the_bell_lists_only_the_notifications_of_who_is_logged_in_newest_first()
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->notify($user, 'Vecchia', null, now()->subDay()->toDateTimeString());
        $this->notify($user, 'Nuova', now()->toDateTimeString());
        $this->notify($other, 'Di un altro');

        $this->actingAs($user)->getJson(route('notifications.index'))
            ->assertOk()
            ->assertJsonPath('unread', 1)
            ->assertJsonCount(2, 'notifications')
            ->assertJsonPath('notifications.0.title', 'Nuova')
            ->assertJsonPath('notifications.0.read', true)
            ->assertJsonPath('notifications.1.title', 'Vecchia')
            ->assertJsonPath('notifications.1.read', false)
            ->assertJsonPath('notifications.1.url', '/area-cliente');
    }

    public function test_the_bell_never_leads_outside_the_site()
    {
        $user = User::factory()->create();
        $notification = $this->notify($user, 'Strana');
        $notification->update(['data' => ['title' => 'Strana', 'body' => '', 'url' => 'https://evil.example/login']]);

        $this->actingAs($user)->getJson(route('notifications.index'))
            ->assertJsonPath('notifications.0.url', '/');
    }

    public function test_the_bell_shows_the_latest_30()
    {
        $user = User::factory()->create();

        foreach (range(1, 35) as $number) {
            $this->notify($user, "N{$number}");
        }

        $this->actingAs($user)->getJson(route('notifications.index'))
            ->assertJsonCount(30, 'notifications')
            ->assertJsonPath('unread', 35);
    }

    public function test_mark_all_as_read_touches_only_my_notifications()
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->notify($user, 'Mia 1');
        $this->notify($user, 'Mia 2');
        $this->notify($other, 'Sua');

        $this->actingAs($user)->postJson(route('notifications.read'))
            ->assertOk()
            ->assertJsonPath('unread', 0);

        $this->assertSame(0, $user->unreadNotifications()->count());
        $this->assertSame(1, $other->unreadNotifications()->count());
    }

    public function test_the_number_on_the_bell_is_shared_with_every_page()
    {
        $user = User::factory()->create();
        $this->notify($user, 'Una');
        $this->notify($user, 'Due');
        $this->notify($user, 'Letta', now()->toDateTimeString());

        $this->actingAs($user)->get(route('contact.show'))
            ->assertInertia(fn (Assert $page) => $page->where('auth.unreadNotifications', 2));
    }

    public function test_a_real_notification_is_saved_with_the_text_of_the_push_and_a_path()
    {
        $booking = Booking::factory()->confirmed()->create();
        /** @var User $client */
        $client = $booking->client;

        $client->notify(new BookingConfirmed($booking));

        $saved = $client->notifications()->first();
        $this->assertNotNull($saved);
        $this->assertSame('Seduta confermata', $saved->data['title']);
        $this->assertSame(parse_url(route('client.bookings'), PHP_URL_PATH), $saved->data['url']);
        $this->assertStringStartsWith('Con ', $saved->data['body']);
        $this->assertNull($saved->read_at);
    }

    public function test_only_what_must_be_read_without_the_site_is_still_emailed()
    {
        $booking = Booking::factory()->confirmed()->create();
        $user = $booking->client;

        foreach (['cancelled-by-trainer', 'proposed', 'guest-cancelled', 'guest-moved'] as $kind) {
            $this->assertSame(['mail', 'database'], (new BookingChanged($booking, $kind))->via($user), $kind);
        }

        // The answers of the client to the trainer: bell and push.
        foreach (['cancelled-by-client', 'accepted', 'declined'] as $kind) {
            $this->assertSame(['database'], (new BookingChanged($booking, $kind))->via($user), $kind);
        }
    }

    public function test_deleting_an_account_deletes_its_notifications()
    {
        $user = User::factory()->create();
        $this->notify($user, 'Una');

        app(DeleteUser::class)->handle($user);

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_old_notifications_are_pruned_after_90_days()
    {
        $user = User::factory()->create();
        $this->notify($user, 'Vecchia', null, now()->subDays(91)->toDateTimeString());
        $this->notify($user, 'Recente', null, now()->subDays(89)->toDateTimeString());

        $this->artisan('notifications:prune')->assertSuccessful();

        $this->assertSame(['Recente'], $user->notifications()->get()->pluck('data.title')->all());
    }

    public function test_an_event_that_takes_place_again_is_not_emailed()
    {
        $user = User::factory()->create();
        $session = GroupSession::factory()->create();

        $this->assertSame(['database'], (new GroupSessionChanged($session, GroupSessionChanged::RESTORED))->via($user));
        $this->assertSame(['mail', 'database'], (new GroupSessionChanged($session, GroupSessionChanged::CANCELLED))->via($user));
    }
}
