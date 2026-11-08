<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
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
        return $this->mailAndPush($notifiable);
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

    public function toMail(User $notifiable): MailMessage
    {
        $booking = $this->booking;
        $day = BookingMailData::day($booking);
        $hour = BookingMailData::hour($booking);
        $free = $booking->freeSeats();

        return (new MailMessage)
            ->subject("{$this->guest->first_name} partecipa alla seduta di {$day}, {$hour}")
            ->greeting("Ciao {$notifiable->first_name},")
            ->line("{$this->guest->name} ha accettato il tuo invito: vi allenate insieme {$day} alle {$hour} con {$booking->trainerProfile->user->name}.")
            ->line($free > 0
                ? ($free === 1 ? 'Resta 1 posto libero per un altro amico.' : "Restano {$free} posti liberi per altri amici.")
                : 'Tutti i posti della seduta sono presi.')
            ->action('Vedi la seduta', route('client.home'));
    }
}
