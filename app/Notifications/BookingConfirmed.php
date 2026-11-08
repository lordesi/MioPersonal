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
 * The email to the client when the session is confirmed: by the trainer from
 * "Richieste", or at once by "Conferma automatica".
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
        return $this->mailAndPush($notifiable);
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        $booking = $this->booking;

        return $this->pushMessage(
            'Seduta confermata',
            'Con '.$booking->trainerProfile->user->name.' · '.BookingMailData::day($booking).' alle '.BookingMailData::hour($booking),
            route('client.home'),
            "booking-{$booking->id}",
        );
    }

    /** Sent to the client's account: resources/views/mail/booking/confirmed. */
    public function toMail(User $notifiable): MailMessage
    {
        $booking = $this->booking;
        $trainer = $booking->trainerProfile;
        $day = BookingMailData::day($booking);
        // A friend invited to the session doesn't cancel it: only the booker does.
        $cancelUntil = $notifiable->id === $booking->client_id ? $booking->freeCancellationEndsAt() : now();

        return (new MailMessage)
            ->subject("Seduta confermata: {$day}, ".BookingMailData::hour($booking))
            ->view(['mail.booking.confirmed', 'mail.booking.confirmed-text'], [
                'card' => BookingMailData::card($booking, "con {$trainer->user->name}"),
                'day' => $day,
                'trainerName' => $trainer->user->name,
                // Only what the trainer chose to show in the settings.
                'contacts' => [
                    'Telefono' => $trainer->show_phone ? BookingMailData::phone($trainer->user->phone) : null,
                    'Email' => $trainer->show_email ? $trainer->user->email : null,
                ],
                'arrivalNotes' => $trainer->arrival_notes,
                'cancelUntil' => $cancelUntil->isFuture() ? BookingMailData::when($cancelUntil) : null,
                'url' => route('client.home'),
            ]);
    }
}
