<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\GroupSession;
use App\Models\GymProfile;
use App\Models\GymProfileReview;
use App\Models\GymTrainerLink;
use App\Models\TrainerProfile;
use App\Models\TrainerProfileReview;
use App\Notifications\GroupSessionReminder;
use App\Notifications\GymLinkAccepted;
use App\Notifications\GymLinkRequested;
use App\Notifications\GymProfileDecided;
use App\Notifications\SessionReminder;
use App\Notifications\TrainerProfileDecided;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

/**
 * The notifications go through the queue (the page answers without waiting for
 * the mail or push services) and only once the change is saved: a transaction
 * that fails sends nothing.
 */
class QueuedNotificationsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{\Closure(): Notification}>
     */
    public static function notifications(): array
    {
        return [
            'GymLinkAccepted' => [fn () => new GymLinkAccepted(new GymTrainerLink)],
            'GymLinkRequested' => [fn () => new GymLinkRequested(new GymTrainerLink)],
            'GymProfileDecided' => [fn () => new GymProfileDecided(new GymProfileReview, 'https://example.test')],
            'TrainerProfileDecided' => [fn () => new TrainerProfileDecided(new TrainerProfileReview, 'https://example.test')],
            'SessionReminder' => [fn () => new SessionReminder(new Booking, SessionReminder::DAY_BEFORE)],
            'GroupSessionReminder' => [fn () => new GroupSessionReminder(new GroupSession, SessionReminder::DAY_BEFORE)],
        ];
    }

    /**
     * @param  \Closure(): Notification  $make
     */
    #[DataProvider('notifications')]
    public function test_the_notification_is_queued_after_the_commit(\Closure $make)
    {
        $notification = $make();

        $this->assertInstanceOf(ShouldQueue::class, $notification);
        $this->assertTrue($notification->afterCommit);
    }

    public function test_nothing_is_sent_when_the_transaction_fails()
    {
        $link = $this->link();
        // Not the rows of `notifications` (the rollback would delete them anyway): the push and the email don't roll back.
        Event::fake([NotificationSent::class]);

        try {
            DB::transaction(function () use ($link) {
                $link->gymProfile->user->notify(new GymLinkRequested($link));

                throw new RuntimeException('Saving failed');
            });
        } catch (RuntimeException) {
        }

        Event::assertNotDispatched(NotificationSent::class);
        $this->assertSame(0, DB::table('notifications')->count());
    }

    public function test_the_notification_is_sent_once_the_transaction_is_saved()
    {
        $link = $this->link();

        DB::transaction(function () use ($link) {
            $link->gymProfile->user->notify(new GymLinkRequested($link));

            // Still waiting for the commit.
            $this->assertSame(0, DB::table('notifications')->count());
        });

        $this->assertSame(1, DB::table('notifications')->where('notifiable_id', $link->gymProfile->user_id)->count());
    }

    private function link(): GymTrainerLink
    {
        $gym = GymProfile::factory()->approved()->create();
        $trainer = TrainerProfile::factory()->approved()->create();

        $link = new GymTrainerLink;
        $link->gym_profile_id = $gym->id;
        $link->trainer_profile_id = $trainer->id;
        $link->forceFill(['status' => 'pending', 'initiated_by' => 'trainer'])->save();

        return $link->load('gymProfile.user', 'trainerProfile.user');
    }
}
