<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * "Invita un amico": to the booker, when a friend joins the session with the
 * link. Queued, sent once the place is saved (afterCommit).
 */
class GuestJoined extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public function __construct(public Booking $booking, public User $guest)
    {
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return $this->inAppAndPush($notifiable);
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        return $this->pushMessage(
            "{$this->guest->first_name} si allena con te",
            BookingMailData::day($this->booking).' alle '.BookingMailData::hour($this->booking).' con '.$this->booking->trainerProfile->user->name,
            route('client.home'),
            "booking-{$this->booking->id}-guests",
        );
    }
}
