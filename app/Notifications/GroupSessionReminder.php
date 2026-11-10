<?php

namespace App\Notifications;

use App\Models\GroupSession;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * "Eventi": to the clients with a place, the day before and 2 hours before
 * (the times of SessionReminder).
 */
class GroupSessionReminder extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public function __construct(public GroupSession $session, public string $kind) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        // The one 2 hours before is only a push: in the bell it would be read too late.
        return $this->kind === SessionReminder::SOON
            ? $this->withPush($notifiable, [])
            : $this->inAppAndPush($notifiable);
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        return $this->pushMessage(
            ($this->kind === SessionReminder::SOON ? 'Tra poco: ' : 'Domani: ').$this->session->title,
            BookingMailData::when($this->session->starts_at).' · '.$this->session->placeLabel(),
            route('events.show', $this->session->slug),
            "event-{$this->session->id}",
        );
    }
}
