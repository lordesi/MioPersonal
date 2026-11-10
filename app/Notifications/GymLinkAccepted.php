<?php

namespace App\Notifications;

use App\Enums\GymLinkSide;
use App\Models\GymTrainerLink;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/** To the side that asked: the other one said yes. The bell inside the site and the push, no email. */
class GymLinkAccepted extends Notification
{
    use Queueable, SendsPush;

    public function __construct(public GymTrainerLink $link) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return $this->inAppAndPush($notifiable);
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        $gym = $this->link->gymProfile;
        $trainer = $this->link->trainerProfile->user->name;
        $tag = "gym-link-{$this->link->id}";

        if ($this->link->initiated_by === GymLinkSide::Trainer) {
            return $this->pushMessage(
                "{$gym->name} ha accettato la tua richiesta",
                "Ora {$gym->name} compare nel tuo profilo e i clienti possono prenotarti lì.",
                route('gyms.show', $gym->slug),
                $tag,
            );
        }

        return $this->pushMessage(
            "{$trainer} ha accettato il tuo invito",
            "Ora {$trainer} compare tra i trainer di {$gym->name}.",
            route('gym.trainers'),
            $tag,
        );
    }
}
