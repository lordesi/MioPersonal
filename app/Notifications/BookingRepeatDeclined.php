<?php

namespace App\Notifications;

use App\Enums\PushCategory;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * "Solo questa seduta": the trainer confirmed the session but not "Ripeti
 * ogni settimana". Bell inside the site and push, no email: the session's
 * own confirmation (BookingConfirmed) is the email.
 */
class BookingRepeatDeclined extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    protected function pushCategory(): PushCategory
    {
        return PushCategory::Bookings;
    }

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
        $trainer = $this->booking->trainerProfile->user->name;
        $when = BookingMailData::day($this->booking).' alle '.BookingMailData::hour($this->booking);

        return $this->pushMessage(
            'Confermata solo questa seduta',
            "{$trainer} ha confermato la seduta di {$when}, ma non la ripetizione ogni settimana. Puoi prenotare le prossime una alla volta.",
            route('client.bookings'),
            "booking-{$this->booking->id}-repeat",
        );
    }
}
