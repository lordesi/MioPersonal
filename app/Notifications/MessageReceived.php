<?php

namespace App\Notifications;

use App\Enums\PushCategory;
use App\Models\Message;
use App\Models\TrainerClient;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * A new message in "Messaggi": only the push, on the devices with
 * "Attiva le notifiche" (no bell, no email: the conversation already shows
 * what is new). Never the text of the message: it would pass through
 * Apple's and Google's services. MessagesController sends at most one every
 * few minutes per conversation.
 */
class MessageReceived extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public function __construct(public TrainerClient $record, public Message $message)
    {
        $this->afterCommit();
    }

    protected function pushCategory(): PushCategory
    {
        return PushCategory::Messages;
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return $this->withPush($notifiable, []);
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        /** @var User $sender */
        $sender = $this->message->sender;
        $trainer = $notifiable->id === $this->record->trainerProfile->user_id;

        $body = match (true) {
            $this->message->isPhoto() => 'Ti ha mandato una foto.',
            $this->message->attachment_kind !== null => 'Ti ha mandato un PDF.',
            default => 'Ti ha scritto un messaggio.',
        };

        return $this->pushMessage(
            $sender->first_name ?: $sender->name,
            $body,
            $trainer
                ? route('trainer.clients', ['con' => $this->record->id, 'chat' => 1])
                : route('client.messages', ['con' => $this->record->id]),
            "chat-{$this->record->id}",
        );
    }
}
