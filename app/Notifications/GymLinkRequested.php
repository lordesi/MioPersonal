<?php

namespace App\Notifications;

use App\Enums\GymLinkSide;
use App\Models\GymTrainerLink;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * To the side that has to answer: a trainer asks to join the gym, or the gym
 * invites a trainer. The bell inside the site and the push, no email.
 */
class GymLinkRequested extends Notification
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
        $fromTrainer = $this->link->initiated_by === GymLinkSide::Trainer;

        return $this->pushMessage(
            $fromTrainer ? "{$trainer} vuole allenare da {$gym->name}" : "{$gym->name} ti invita tra i suoi trainer",
            // Not the message the person wrote: it would pass through the push services.
            $fromTrainer
                ? 'Se accetti, compare nel profilo della palestra e i clienti possono prenotarlo da voi.'
                : 'Se accetti, la palestra compare nel tuo profilo e i clienti possono prenotarti lì.',
            route($fromTrainer ? 'gym.trainers' : 'trainer.gyms'),
            "gym-link-{$this->link->id}",
        );
    }
}
