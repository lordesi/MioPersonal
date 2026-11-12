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
 * The notification (bell inside the site, and the push with a device) to the
 * client when the session is confirmed: by the trainer from "Richieste", or at
 * once by "Conferma automatica". No email (daily limit of the mail provider).
 *
 * Queued, and sent only once the confirmation is saved (afterCommit).
 */
class BookingConfirmed extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public function __construct(public Booking $booking)
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
        $booking = $this->booking;

        return $this->pushMessage(
            'Seduta confermata',
            'Con '.$booking->trainerProfile->user->name.' · '.BookingMailData::day($booking).' alle '.BookingMailData::hour($booking),
            route('client.bookings'),
            "booking-{$booking->id}",
        );
    }
}
