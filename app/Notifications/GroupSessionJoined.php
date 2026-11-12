<?php

namespace App\Notifications;

use App\Enums\PushCategory;
use App\Models\GroupSession;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/** "Eventi": to the client, the place is confirmed. */
class GroupSessionJoined extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    protected function pushCategory(): PushCategory
    {
        return PushCategory::Events;
    }

    public function __construct(public GroupSession $session)
    {
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return $this->inAppAndPush($notifiable);
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
}
