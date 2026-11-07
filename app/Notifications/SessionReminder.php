<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use App\Support\TrainerSlots;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * The reminders of a confirmed session (App\Actions\Bookings\SendSessionReminders):
 * - DAY_BEFORE, to the client and to the trainer: the push on their devices,
 *   the email only to who has no device (the free plan of the mail provider
 *   has a daily limit: every app installed saves emails);
 * - SOON, to the client only and only as a push: an email 2 hours before is
 *   read too late.
 * Nothing to who turned off "Promemoria prima delle sedute".
 */
class SessionReminder extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public const DAY_BEFORE = 'day-before';

    public const SOON = 'soon';

    /** The day-before reminder goes out this long before the start. */
    public const DAY_BEFORE_HOURS = 24;

    /** The last reminder, for the client. */
    public const SOON_HOURS = 2;

    public function __construct(public Booking $booking, public string $kind) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        if (! $notifiable instanceof User || ! $notifiable->wantsReminders()) {
            return [];
        }

        $push = $this->withPush($notifiable, []);

        if ($this->kind === self::SOON || $push !== []) {
            return $push;
        }

        return ['mail'];
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        $booking = $this->booking;
        $hour = BookingMailData::hour($booking);
        $tag = "reminder-{$booking->id}";

        if ($this->isTrainer($notifiable)) {
            $client = $booking->client?->publicName() ?? 'un cliente';

            return $this->pushMessage(
                ucfirst($this->dayWord()).": seduta con {$client}",
                "Alle {$hour} · {$booking->service_name}",
                route('trainer.today'),
                $tag,
            );
        }

        $trainer = $booking->trainerProfile->user->name;
        $place = $booking->place_label === '' ? '' : " · {$booking->place_label}";

        return $this->kind === self::SOON
            ? $this->pushMessage("Tra poco ti alleni con {$trainer}", "Alle {$hour}{$place}", route('client.home'), $tag)
            : $this->pushMessage(ucfirst($this->dayWord())." ti alleni con {$trainer}", "Alle {$hour}{$place}", route('client.home'), $tag);
    }

    /** resources/views/mail/booking/reminder: the day-before reminder to who has no device. */
    public function toMail(User $notifiable): MailMessage
    {
        $booking = $this->booking;
        $day = BookingMailData::day($booking);
        $hour = BookingMailData::hour($booking);
        $toTrainer = $this->isTrainer($notifiable);
        $trainerName = $booking->trainerProfile->user->name;
        $clientName = $booking->client->name ?? 'un cliente';
        $cancelUntil = $booking->freeCancellationEndsAt();
        $title = $toTrainer
            ? ucfirst($this->dayWord())." hai una seduta con {$clientName}"
            : ucfirst($this->dayWord())." ti alleni con {$trainerName}";

        return (new MailMessage)
            ->subject("Promemoria: {$day} alle {$hour}")
            ->view(['mail.booking.reminder', 'mail.booking.reminder-text'], [
                'title' => $title,
                'intro' => 'Ti ricordiamo la seduta qui sotto.',
                'card' => BookingMailData::card($booking, $toTrainer ? $clientName : "con {$trainerName}"),
                'day' => $day,
                'details' => $toTrainer ? [] : ['Indicazioni' => $booking->trainerProfile->arrival_notes],
                'button' => $toTrainer ? 'Apri la panoramica' : 'Vedi la prenotazione',
                'url' => route($toTrainer ? 'trainer.today' : 'client.home'),
                'note' => $toTrainer ? null : ($cancelUntil->isFuture()
                    ? 'Se non puoi più venire, annulla gratis entro '.BookingMailData::when($cancelUntil).': lo slot torna libero per altri.'
                    : 'Se non puoi più venire, avvisa il trainer il prima possibile.'),
                'toTrainer' => $toTrainer,
            ]);
    }

    private function isTrainer(User $notifiable): bool
    {
        return $notifiable->id === $this->booking->trainerProfile->user_id;
    }

    /** "domani", or "oggi" when the reminder left late (the scheduler was down). */
    private function dayWord(): string
    {
        $start = $this->booking->starts_at->timezone(TrainerSlots::TIMEZONE);

        return $start->isSameDay(now(TrainerSlots::TIMEZONE)) ? 'oggi' : 'domani';
    }
}
