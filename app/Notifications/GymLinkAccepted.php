<?php

namespace App\Notifications;

use App\Enums\GymLinkSide;
use App\Models\GymTrainerLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** To the side that asked: the other one said yes. */
class GymLinkAccepted extends Notification
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
        $trainer = $this->link->trainerProfile;
        $mail = (new MailMessage)->greeting('Ciao!');

        if ($this->link->initiated_by === GymLinkSide::Trainer) {
            $mail->subject("{$gym->name} ha accettato la tua richiesta")
                ->line("Ora {$gym->name} compare nel tuo profilo e i clienti possono prenotarti lì.")
                ->action('Vedi il profilo della palestra', route('gyms.show', $gym->slug));
        } else {
            $mail->subject("{$trainer->user->name} ha accettato il tuo invito")
                ->line("Ora {$trainer->user->name} compare tra i trainer di {$gym->name}.")
                ->action('Vedi i trainer della palestra', route('gym.trainers'));
        }

        return $mail->salutation('Il team di MioPersonal');
    }
}
