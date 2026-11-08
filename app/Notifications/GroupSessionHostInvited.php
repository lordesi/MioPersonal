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

/** "Eventi": to a trainer or a gym invited to organize an event together. */
class GroupSessionHostInvited extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    /** @param  string  $route  the "Eventi" page of the area of the one invited */
    public function __construct(public GroupSession $session, public string $from, public string $route)
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
            "{$this->from} ti invita a organizzare",
            $this->session->title.', '.BookingMailData::when($this->session->starts_at),
            route($this->route),
            "event-{$this->session->id}-host",
        );
    }

    public function toMail(User $notifiable): MailMessage
    {
        $session = $this->session;

        return (new MailMessage)
            ->subject("{$this->from} ti invita a organizzare {$session->title}")
            ->greeting('Ciao!')
            ->line("{$this->from} ti ha invitato tra gli organizzatori di {$session->title}, ".BookingMailData::when($session->starts_at).'.')
            ->line('Se accetti, l’evento compare anche nel tuo profilo e puoi vedere gli iscritti.')
            ->action('Rispondi', route($this->route))
            ->salutation('Il team di MioPersonal');
    }
}
