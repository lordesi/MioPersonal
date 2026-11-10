<?php

namespace App\Notifications;

use App\Models\GroupSession;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * "Eventi": to the clients with a place, when the organizer cancels the
 * event, moves it or gives the place back (email, bell and push), or when a
 * lesson that was called off takes place again (bell and push).
 */
class GroupSessionChanged extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public const CANCELLED = 'cancelled';

    public const MOVED = 'moved';

    public const REMOVED = 'removed';

    public const RESTORED = 'restored';

    public function __construct(public GroupSession $session, public string $kind)
    {
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        // "Si farà" only tells the place is still there: bell and push, no email.
        return $this->kind === self::RESTORED ? $this->inAppAndPush($notifiable) : $this->mailAndPush($notifiable);
    }

    private function title(): string
    {
        return match ($this->kind) {
            self::CANCELLED => 'Evento annullato',
            self::MOVED => 'Nuovo orario',
            self::REMOVED => 'Iscrizione annullata',
            default => 'Si farà',
        };
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        return $this->pushMessage(
            $this->title(),
            $this->session->title.', '.BookingMailData::when($this->session->starts_at),
            route('events.show', $this->session->slug),
            "event-{$this->session->id}",
        );
    }

    public function toMail(User $notifiable): MailMessage
    {
        $session = $this->session;
        $when = BookingMailData::when($session->starts_at);
        $paragraphs = match ($this->kind) {
            self::CANCELLED => ["{$session->title} di {$when} è stato annullato dall’organizzatore."],
            self::MOVED => ["{$session->title} ha un nuovo orario: {$when}. Il tuo posto resta confermato.", 'Se non puoi più venire, annulla dalla pagina dell’evento.'],
            self::REMOVED => ["L’organizzatore ha annullato la tua iscrizione a {$session->title} di {$when}."],
            default => ["{$session->title} di {$when} si farà: il tuo posto è ancora confermato."],
        };

        return (new MailMessage)
            ->subject("{$this->title()}: {$session->title}")
            ->view(['mail.notice', 'mail.notice-text'], [
                'title' => $this->title(),
                'label' => 'Evento',
                'paragraphs' => $paragraphs,
                'items' => [],
                'details' => [],
                'body' => $this->kind === self::CANCELLED && filled($session->cancel_note)
                    ? "Il messaggio dell’organizzatore:\n".$session->cancel_note
                    : null,
                'button' => 'Vedi l’evento',
                'url' => route('events.show', $session->slug),
                'footer' => 'Ricevi questa email perché avevi un posto a questo evento su MioPersonal.',
            ]);
    }
}
