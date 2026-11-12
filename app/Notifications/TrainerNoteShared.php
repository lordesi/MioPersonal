<?php

namespace App\Notifications;

use App\Models\TrainerClient;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * "Nota per il cliente": to the client, when the trainer writes or changes
 * it. The bell and the push only, no email; the note itself stays in the
 * site (the push passes through Apple's and Google's services).
 */
class TrainerNoteShared extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public function __construct(public TrainerClient $record)
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
        $trainer = $this->record->trainerProfile->user->first_name;

        return $this->pushMessage(
            "{$trainer} ti ha lasciato una nota",
            'La trovi nella tua Panoramica.',
            route('client.home'),
            "trainer-note-{$this->record->id}",
        );
    }
}
