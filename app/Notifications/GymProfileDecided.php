<?php

namespace App\Notifications;

use App\Enums\TrainerReviewDecision;
use App\Models\GymProfileReview;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The email to the gym after the team's decision in "Admin · Verifica ·
 * Palestre": approved, changes requested or rejected (with the team's message).
 */
class GymProfileDecided extends Notification
{
    use Queueable;

    public function __construct(
        public GymProfileReview $review,
        public string $profileUrl,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)->greeting('Ciao!');

        $mail = match ($this->review->decision) {
            TrainerReviewDecision::Approved => $mail
                ->subject('La tua palestra è online')
                ->line('Abbiamo controllato il profilo della palestra: ora compare nella ricerca di MioPersonal. Aggiungi abbonamenti e promozioni e invita i tuoi trainer.')
                ->action('Vedi il profilo della palestra', $this->profileUrl),
            TrainerReviewDecision::Changes => $mail
                ->subject('Manca poco: sistema il profilo della palestra')
                ->line('Prima di pubblicare il profilo ti chiediamo di sistemare alcuni punti:')
                ->lines(array_map(fn (string $reason) => "• {$reason}", $this->review->reasons ?? []))
                ->action('Modifica il profilo', route('gym.register')),
            default => $mail
                ->subject('Il profilo della palestra non è stato approvato')
                ->line('Abbiamo controllato il profilo della palestra e non possiamo pubblicarlo.'),
        };

        if (filled($this->review->message_to_gym)) {
            $mail->line('Il messaggio del team:')->line((string) $this->review->message_to_gym);
        }

        return $mail->salutation('Il team di MioPersonal');
    }
}
