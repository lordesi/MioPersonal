<?php

namespace App\Notifications;

use App\Enums\TrainerReviewDecision;
use App\Models\GymProfileReview;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * After the team's decision in "Admin · Verifica · Palestre": approved, changes
 * requested or rejected (with the team's message). The email always, the bell
 * and the push too.
 */
class GymProfileDecided extends Notification
{
    use Queueable, SendsPush;

    public function __construct(
        public GymProfileReview $review,
        public string $profileUrl,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return $this->mailAndPush($notifiable);
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        $text = $this->text();

        return $this->pushMessage($text['subject'], $text['paragraphs'][0], $text['url'], "gym-review-{$this->review->id}");
    }

    /** resources/views/mail/notice. */
    public function toMail(User $notifiable): MailMessage
    {
        $text = $this->text();

        return (new MailMessage)
            ->subject($text['subject'])
            ->view(['mail.notice', 'mail.notice-text'], [
                'title' => $text['subject'],
                'label' => 'Verifica palestra',
                'paragraphs' => $text['paragraphs'],
                'items' => $text['items'],
                'details' => [],
                'body' => filled($this->review->message_to_gym) ? "Il messaggio del team:\n".$this->review->message_to_gym : null,
                'button' => $text['button'],
                'url' => $text['url'],
                'footer' => 'Ricevi questa email perché hai il profilo di una palestra su MioPersonal.',
            ]);
    }

    /**
     * @return array{subject: string, paragraphs: list<string>, items: list<string>, button: string|null, url: string}
     */
    private function text(): array
    {
        return match ($this->review->decision) {
            TrainerReviewDecision::Approved => [
                'subject' => 'La tua palestra è online',
                'paragraphs' => ['Abbiamo controllato il profilo della palestra: ora compare nella ricerca di MioPersonal. Aggiungi abbonamenti e promozioni e invita i tuoi trainer.'],
                'items' => [],
                'button' => 'Vedi il profilo della palestra',
                'url' => $this->profileUrl,
            ],
            TrainerReviewDecision::Changes => [
                'subject' => 'Manca poco: sistema il profilo della palestra',
                'paragraphs' => ['Prima di pubblicare il profilo ti chiediamo di sistemare alcuni punti:'],
                'items' => $this->review->reasons ?? [],
                'button' => 'Modifica il profilo',
                'url' => route('gym.register'),
            ],
            default => [
                'subject' => 'Il profilo della palestra non è stato approvato',
                'paragraphs' => ['Abbiamo controllato il profilo della palestra e non possiamo pubblicarlo.'],
                'items' => [],
                'button' => null,
                'url' => route('gym.register'),
            ],
        };
    }
}
