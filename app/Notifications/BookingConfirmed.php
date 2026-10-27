<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The email to the client when the session is confirmed: by the trainer from
 * "Richieste", or at once by "Conferma automatica".
 *
 * Queued, and sent only once the confirmation is saved (afterCommit).
 */
class BookingConfirmed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking)
    {
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /** Sent to the client's account. */
    public function toMail(User $notifiable): MailMessage
    {
        $booking = $this->booking;
        $trainer = $booking->trainerProfile;

        $mail = (new MailMessage)
            ->subject('Prenotazione confermata')
            ->greeting("Ciao {$notifiable->first_name}!")
            ->line("{$trainer->user->name} ha confermato la tua seduta.")
            ->line("Servizio: {$booking->service_name}")
            ->line('Quando: '.self::rome($booking->starts_at));

        if ($booking->place_label !== '') {
            $mail->line("Dove: {$booking->place_label}");
        }

        return $mail
            ->line("Cancellazione gratuita fino a {$trainer->free_cancellation_hours} ore prima.")
            ->action('Le mie prenotazioni', route('client.home'))
            ->salutation('Il team di MioPersonal');
    }

    /** "lunedì 3 novembre alle 18:00": dates are saved in UTC, shown in Rome. */
    private static function rome(CarbonInterface $date): string
    {
        return $date->timezone('Europe/Rome')->locale('it')->isoFormat('dddd D MMMM [alle] HH:mm');
    }
}
