<?php

namespace App\Notifications;

use App\Enums\BookingStatus;
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
 * The notification (bell inside the site, and the push with a device) to the
 * trainer when a client books: a request to answer, or a booking already
 * confirmed by "Conferma automatica". No email: it would use the daily limit
 * of the mail provider for every single booking.
 *
 * Queued, and sent only once the booking is saved (afterCommit).
 */
class BookingRequested extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    protected function pushCategory(): PushCategory
    {
        return PushCategory::Requests;
    }

    /** Decided now: the trainer may answer before the queue sends the email. */
    public bool $alreadyConfirmed;

    public function __construct(public Booking $booking)
    {
        $this->alreadyConfirmed = $booking->status === BookingStatus::Confirmed;
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return $this->inAppAndPush($notifiable);
    }

    /** The first one to get right: the sooner the trainer answers, the more sessions are confirmed. */
    public function toWebPush(User $notifiable): WebPushMessage
    {
        $booking = $this->booking;
        $client = $booking->client?->publicName() ?? 'Un cliente';
        $when = BookingMailData::day($booking).' alle '.BookingMailData::hour($booking);

        return $this->pushMessage(
            $this->alreadyConfirmed ? 'Nuova prenotazione' : 'Nuova richiesta da confermare',
            "{$client} · {$when}".($booking->repeat_weekly ? ' · chiede di ripeterla ogni settimana' : ''),
            route($this->alreadyConfirmed ? 'trainer.today' : 'trainer.requests'),
            "booking-{$booking->id}",
        );
    }
}
