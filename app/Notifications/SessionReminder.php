<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use App\Support\TrainerSlots;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * The reminders of a confirmed session (App\Actions\Bookings\SendSessionReminders):
 * - DAY_BEFORE, to the client and to the trainer: the bell inside the site and
 *   the push on their devices, never an email (the free plan of the mail
 *   provider has a daily limit);
 * - SOON, to the client only and only as a push: in the bell it is read too late.
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

        // The last reminder is only a push: in the bell it would be read too late.
        return $this->kind === self::SOON
            ? $this->withPush($notifiable, [])
            : $this->inAppAndPush($notifiable);
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
