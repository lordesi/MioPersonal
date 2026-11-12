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

/** "Eventi": to a trainer or a gym invited to organize an event together. */
class GroupSessionHostInvited extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    protected function pushCategory(): PushCategory
    {
        return PushCategory::Events;
    }

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
        return $this->inAppAndPush($notifiable);
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
}
