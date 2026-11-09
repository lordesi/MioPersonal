<?php

namespace App\Notifications;

use App\Models\BookingSeries;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * One email (and push) to the client for a whole "sedute fisse" rule, not one
 * for each session: when the trainer sets it ('created'), and when the trainer
 * ends it ('ended', with how many sessions to come were cancelled).
 */
class BookingSeriesNotice extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public const CREATED = 'created';

    public const ENDED = 'ended';

    /**
     * @param  int  $count  sessions made ('created') or cancelled ('ended')
     */
    public function __construct(public BookingSeries $series, public string $kind, public int $count)
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
        return $this->pushMessage($this->title(), $this->body(), route('client.home'), "series-{$this->series->id}");
    }

    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title())
            ->greeting("Ciao {$notifiable->first_name},")
            ->line($this->body())
            ->line($this->kind === self::CREATED
                ? 'Le trovi tutte nelle tue prenotazioni. Puoi annullare una singola seduta quando serve, entro i termini di cancellazione gratuita.'
                : 'Se vuoi riprendere gli allenamenti, puoi prenotare una nuova seduta dal profilo del trainer.')
            ->action('Vai alle tue prenotazioni', route('client.home'));
    }

    private function title(): string
    {
        return $this->kind === self::CREATED
            ? 'Sedute fisse con '.$this->series->trainerProfile->user->name
            : 'Sedute fisse terminate';
    }

    private function body(): string
    {
        $trainer = $this->series->trainerProfile->user->name;
        $label = lcfirst($this->series->label());
        $sessions = $this->count === 1 ? '1 seduta' : "{$this->count} sedute";

        if ($this->kind === self::CREATED) {
            return "{$trainer} ha fissato le vostre sedute: {$label} ({$this->series->service_name}, {$this->series->minutes} minuti). Per ora sono in calendario {$sessions}, le altre si aggiungono di settimana in settimana.";
        }

        $cancelled = $this->count === 0
            ? '.'
            : ": {$sessions} in programma ".($this->count === 1 ? 'è stata annullata' : 'sono state annullate').'.';

        return "{$trainer} ha terminato le sedute fisse ({$label})".$cancelled;
    }
}
