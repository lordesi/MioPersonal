<?php

namespace App\Notifications;

use App\Enums\TrainerReviewDecision;
use App\Models\TrainerProfileReview;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * After the team's decision in "Admin · Verifica": approved, changes requested
 * or rejected (with the team's message). The email always (it is what the
 * trainer waits for, even without opening the site), the bell and the push too.
 */
class TrainerProfileDecided extends Notification
{
    use Queueable, SendsPush;

    public function __construct(
        public TrainerProfileReview $review,
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

        return $this->pushMessage($text['subject'], $text['paragraphs'][0], $text['url'], "trainer-review-{$this->review->id}");
    }

    /** resources/views/mail/notice. */
    public function toMail(User $notifiable): MailMessage
    {
        $text = $this->text();

        return (new MailMessage)
            ->subject($text['subject'])
            ->view(['mail.notice', 'mail.notice-text'], [
                'title' => $text['subject'],
                'label' => 'Verifica profilo',
                'paragraphs' => $text['paragraphs'],
                'items' => $text['items'],
                'details' => [],
                'body' => filled($this->review->message_to_trainer) ? "Il messaggio del team:\n".$this->review->message_to_trainer : null,
                'button' => $text['button'],
                'url' => $text['url'],
                'footer' => 'Ricevi questa email perché hai un profilo trainer su MioPersonal.',
            ]);
    }

    /**
     * @return array{subject: string, paragraphs: list<string>, items: list<string>, button: string|null, url: string}
     */
    private function text(): array
    {
        return match ($this->review->decision) {
            TrainerReviewDecision::Approved => [
                'subject' => 'Il tuo profilo è online',
                'paragraphs' => ['Abbiamo controllato il tuo profilo: ora compare nella ricerca di MioPersonal e i clienti possono prenotare.'],
                'items' => [],
                'button' => 'Vedi il tuo profilo',
                'url' => $this->profileUrl,
            ],
            TrainerReviewDecision::Changes => [
                'subject' => 'Manca poco: sistema il tuo profilo',
                'paragraphs' => ['Prima di pubblicare il profilo ti chiediamo di sistemare alcuni punti:'],
                'items' => $this->review->reasons ?? [],
                'button' => 'Modifica il profilo',
                'url' => route('trainer.register'),
            ],
            default => [
                'subject' => 'Il tuo profilo non è stato approvato',
                'paragraphs' => ['Abbiamo controllato il tuo profilo e non possiamo pubblicarlo.'],
                'items' => [],
                'button' => null,
                'url' => route('trainer.register'),
            ],
        };
    }
}
