<?php

namespace App\Notifications;

use App\Enums\TrainerReviewDecision;
use App\Models\TrainerProfileReview;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The email to the trainer after the team's decision in "Admin · Verifica":
 * approved, changes requested or rejected (with the team's message).
 */
class TrainerProfileDecided extends Notification
{
    use Queueable;

    public function __construct(
        public TrainerProfileReview $review,
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
                ->subject('Il tuo profilo è online')
                ->line('Abbiamo controllato il tuo profilo: ora compare nella ricerca di MioPersonal e i clienti possono prenotare.')
                ->action('Vedi il tuo profilo', $this->profileUrl),
            TrainerReviewDecision::Changes => $mail
                ->subject('Manca poco: sistema il tuo profilo')
                ->line('Prima di pubblicare il profilo ti chiediamo di sistemare alcuni punti:')
                ->lines(array_map(fn (string $reason) => "• {$reason}", $this->review->reasons ?? []))
                ->action('Modifica il profilo', route('trainer.register')),
            default => $mail
                ->subject('Il tuo profilo non è stato approvato')
                ->line('Abbiamo controllato il tuo profilo e non possiamo pubblicarlo.'),
        };

        if (filled($this->review->message_to_trainer)) {
            $mail->line('Il messaggio del team:')->line((string) $this->review->message_to_trainer);
        }

        return $mail->salutation('Il team di MioPersonal');
    }
}
