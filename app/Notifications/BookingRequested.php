<?php

namespace App\Notifications;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The email to the trainer when a client books: a request to answer, or a
 * booking already confirmed by "Conferma automatica".
 *
 * Queued, so the booking page doesn't wait for the mail server, and sent only
 * once the booking is saved (afterCommit).
 */
class BookingRequested extends Notification implements ShouldQueue
{
    use Queueable;

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
        return ['mail'];
    }

    /** Sent to the trainer's account. */
    public function toMail(User $notifiable): MailMessage
    {
        $booking = $this->booking;
        $client = $booking->client->name ?? 'Un cliente';

        $mail = (new MailMessage)
            ->subject($this->alreadyConfirmed ? 'Nuova prenotazione confermata' : 'Nuova richiesta di prenotazione')
            ->greeting("Ciao {$notifiable->first_name}!")
            ->line($this->alreadyConfirmed
                ? "{$client} ha prenotato una seduta con te. Con la conferma automatica è già confermata."
                : "{$client} ha chiesto una seduta con te.")
            ->line("Servizio: {$booking->service_name}")
            ->line('Quando: '.self::rome($booking->starts_at));

        if ($booking->place_label !== '') {
            $mail->line("Dove: {$booking->place_label}");
        }

        if ($this->alreadyConfirmed) {
            $mail->action('Vedi la tua giornata', route('trainer.today'));
        } else {
            $mail->line('Rispondi entro '.self::rome($booking->expires_at).': dopo, la richiesta scade e lo slot torna libero.')
                ->action('Rispondi alla richiesta', route('trainer.requests'));
        }

        return $mail->salutation('Il team di MioPersonal');
    }

    /** "lunedì 3 novembre alle 18:00": dates are saved in UTC, shown in Rome. */
    private static function rome(?CarbonInterface $date): string
    {
        return (string) $date?->timezone('Europe/Rome')->locale('it')->isoFormat('dddd D MMMM [alle] HH:mm');
    }
}
