<?php

namespace App\Notifications;

use App\Enums\GymLinkSide;
use App\Models\GymTrainerLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * To the side that has to answer: a trainer asks to join the gym, or the gym
 * invites a trainer.
 */
class GymLinkRequested extends Notification
{
    use Queueable;

    public function __construct(public GymTrainerLink $link) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $gym = $this->link->gymProfile;
        $trainer = $this->link->trainerProfile->user->name;
        $mail = (new MailMessage)->greeting('Ciao!');

        if ($this->link->initiated_by === GymLinkSide::Trainer) {
            $mail->subject("{$trainer} vuole allenare da {$gym->name}")
                ->line("{$trainer} ha chiesto di comparire tra i trainer di {$gym->name} su MioPersonal.")
                ->line('Se accetti, il trainer compare nel profilo della palestra e i clienti possono prenotarlo da voi.');
        } else {
            $mail->subject("{$gym->name} ti invita tra i suoi trainer")
                ->line("{$gym->name} ({$gym->city->name}) ti ha invitato a comparire tra i suoi trainer su MioPersonal.")
                ->line('Se accetti, la palestra compare nel tuo profilo e i clienti possono prenotarti lì.');
        }

        if (filled($this->link->message)) {
            $mail->line('Il messaggio:')->line((string) $this->link->message);
        }

        $route = $this->link->initiated_by === GymLinkSide::Trainer ? 'gym.trainers' : 'trainer.gyms';

        return $mail->action('Rispondi', route($route))->salutation('Il team di MioPersonal');
    }
}
