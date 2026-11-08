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
 * event, moves it or gives the place back, or when a lesson that was called
 * off takes place again.
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
        return $this->mailAndPush($notifiable);
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
        $mail = (new MailMessage)
            ->subject("{$this->title()}: {$session->title}")
            ->greeting("Ciao {$notifiable->first_name},");

        match ($this->kind) {
            self::CANCELLED => $mail->line("{$session->title} di {$when} è stato annullato dall’organizzatore."),
            self::MOVED => $mail->line("{$session->title} ha un nuovo orario: {$when}. Il tuo posto resta confermato.")
                ->line('Se non puoi più venire, annulla dalla pagina dell’evento.'),
            self::REMOVED => $mail->line("L’organizzatore ha annullato la tua iscrizione a {$session->title} di {$when}."),
            default => $mail->line("{$session->title} di {$when} si farà: il tuo posto è ancora confermato."),
        };

        if ($this->kind === self::CANCELLED && filled($session->cancel_note)) {
            $mail->line('Il messaggio:')->line((string) $session->cancel_note);
        }

        return $mail->action('Vedi l’evento', route('events.show', $session->slug));
    }
}
