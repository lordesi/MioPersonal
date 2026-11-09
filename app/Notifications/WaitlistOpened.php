<?php

namespace App\Notifications;

use App\Models\GroupSession;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Models\WaitlistEntry;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * "Si è liberato un posto": to who asked "Avvisami se si libera", for a full
 * event or for a day a trainer was full. Nothing is booked for them: the first
 * who books gets it, and the one told keeps the turn for a few hours.
 */
class WaitlistOpened extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    /**
     * @param  string|null  $date  Y-m-d, for a trainer's day
     */
    public function __construct(public GroupSession|TrainerProfile $subject, public ?string $date = null)
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
        return $this->pushMessage($this->title(), $this->body(), $this->url(), $this->tag());
    }

    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title())
            ->greeting("Ciao {$notifiable->first_name},")
            ->line($this->body())
            ->line('Non ti prenotiamo noi: chi arriva prima, prende il posto. Hai qualche ora di precedenza sugli altri in lista.')
            ->action($this->subject instanceof GroupSession ? 'Prenota il posto' : 'Scegli lo slot', $this->url());
    }

    private function title(): string
    {
        return $this->subject instanceof GroupSession ? 'Si è liberato un posto' : 'Si è liberato uno slot';
    }

    private function body(): string
    {
        $hold = WaitlistEntry::HOLD_HOURS;

        if ($this->subject instanceof GroupSession) {
            return "{$this->subject->title}, ".BookingMailData::when($this->subject->starts_at).": c’è un posto libero. Hai {$hold} ore di precedenza.";
        }

        $day = CarbonImmutable::parse((string) $this->date, TrainerSlots::TIMEZONE)->locale('it')->isoFormat('dddd D MMMM');

        return "{$this->subject->user->name} ha uno slot libero {$day}. Hai {$hold} ore di precedenza.";
    }

    private function url(): string
    {
        return $this->subject instanceof GroupSession
            ? route('events.show', $this->subject->slug)
            : route('trainers.show', ['slug' => $this->subject->slug]).'#prenota';
    }

    private function tag(): string
    {
        return $this->subject instanceof GroupSession
            ? "waitlist-event-{$this->subject->id}"
            : "waitlist-trainer-{$this->subject->id}-{$this->date}";
    }
}
