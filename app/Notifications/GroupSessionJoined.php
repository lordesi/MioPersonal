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

/** "Eventi": to the client, the place is confirmed. */
class GroupSessionJoined extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public function __construct(public GroupSession $session)
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
            'Posto confermato',
            $this->session->title.', '.BookingMailData::when($this->session->starts_at),
            route('events.show', $this->session->slug),
            "event-{$this->session->id}",
        );
    }

    public function toMail(User $notifiable): MailMessage
    {
        $session = $this->session;

        return (new MailMessage)
            ->subject("Posto confermato: {$session->title}")
            ->greeting("Ciao {$notifiable->first_name},")
            ->line("Il tuo posto per {$session->title} è confermato: ".BookingMailData::when($session->starts_at).'.')
            ->line('Dove: '.$session->placeLabel().'.')
            ->line($session->price_cents === 0 ? 'È gratis.' : 'Prezzo: '.$session->priceLabel().', da pagare sul posto.')
            ->line('Se non puoi più venire, annulla dalla pagina dell’evento: il posto torna libero per altri.')
            ->action('Vedi l’evento', route('events.show', $session->slug));
    }
}
