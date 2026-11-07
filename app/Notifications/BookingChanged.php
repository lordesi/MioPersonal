<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\User;
use App\Notifications\Concerns\SendsPush;
use App\Support\BookingMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * A confirmed session changes, and the other side gets an email:
 * - 'cancelled-by-trainer' → the client (with the trainer's message);
 * - 'cancelled-by-client'  → the trainer;
 * - 'proposed'             → the client: the trainer proposes another time;
 * - 'accepted' / 'declined' → the trainer: the client's answer to the proposal.
 *
 * Queued, and sent only once the change is saved (afterCommit).
 */
class BookingChanged extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    public function __construct(public Booking $booking, public string $kind)
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

    /** The title of the email, and its time: "Luca Moretti ha annullato la seduta" · "mer 28 ott alle 18:00". */
    public function toWebPush(User $notifiable): WebPushMessage
    {
        $text = $this->text();

        return $this->pushMessage(
            $text['title'],
            BookingMailData::day($this->booking).' alle '.BookingMailData::hour($this->booking),
            $text['url'],
            "booking-{$this->booking->id}",
        );
    }

    /** resources/views/mail/booking/changed. */
    public function toMail(User $notifiable): MailMessage
    {
        $text = $this->text();

        return (new MailMessage)
            ->subject($text['subject'])
            ->view(['mail.booking.changed', 'mail.booking.changed-text'], [
                ...$text,
                'card' => BookingMailData::card($this->booking, $text['who']),
                'cancelled' => str_starts_with($this->kind, 'cancelled'),
                'day' => BookingMailData::day($this->booking),
                'toTrainer' => in_array($this->kind, ['cancelled-by-client', 'accepted', 'declined'], true),
            ]);
    }

    /**
     * @return array{subject: string, label: string, title: string, intro: string, details: array<string, string|null>, note: string|null, button: string, url: string, who: string}
     */
    private function text(): array
    {
        $booking = $this->booking;
        $trainer = $booking->trainerProfile->user->name;
        $client = $booking->client->name ?? 'Il cliente';
        $day = BookingMailData::day($booking);
        $hour = BookingMailData::hour($booking);
        $proposal = $booking->proposal();
        $proposedWhen = $proposal === null ? '' : BookingMailData::when($proposal['start']);
        // The trainer's emails: back to the calendar.
        $forTrainer = [
            'details' => [],
            'note' => null,
            'button' => 'Apri il calendario',
            'url' => route('trainer.calendar'),
            'who' => $client,
        ];

        return match ($this->kind) {
            'cancelled-by-trainer' => [
                'subject' => "Seduta annullata: {$day}, {$hour}",
                'label' => 'Annullata',
                'title' => "{$trainer} ha annullato la seduta",
                'intro' => 'Ci dispiace: la seduta qui sotto non si terrà.'.($booking->client_package_id !== null ? ' La seduta torna disponibile nel tuo pacchetto.' : ''),
                'details' => ['Messaggio' => $booking->cancel_note],
                'note' => 'Puoi prenotare un altro orario dal profilo del trainer.',
                'button' => 'Prenota un altro orario',
                'url' => route('trainers.show', $booking->trainerProfile->slug),
                'who' => "con {$trainer}",
            ],
            'cancelled-by-client' => [
                ...$forTrainer,
                'subject' => "{$client} ha annullato la seduta di {$day}, {$hour}",
                'label' => 'Annullata',
                'title' => "{$client} ha annullato la seduta",
                'intro' => 'Lo slot è di nuovo libero e prenotabile da altri clienti.',
            ],
            'proposed' => [
                'subject' => "{$trainer} propone di spostare la seduta di {$day}",
                'label' => 'Nuovo orario proposto',
                'title' => "{$trainer} propone un altro orario",
                'intro' => "Al posto di {$day} alle {$hour} propone {$proposedWhen}. Finché non rispondi resta valido l’orario di adesso.",
                'details' => ['Nuovo orario' => $proposedWhen],
                'note' => 'Se il nuovo orario non ti va bene puoi tenere quello di adesso, oppure annullare gratis.',
                'button' => 'Rispondi',
                'url' => route('client.home'),
                'who' => "con {$trainer}",
            ],
            'accepted' => [
                ...$forTrainer,
                'subject' => "{$client} ha accettato il nuovo orario: {$day}, {$hour}",
                'label' => 'Spostata',
                'title' => "{$client} ha accettato il nuovo orario",
                'intro' => 'La seduta è stata spostata: qui sotto trovi il nuovo orario.',
            ],
            default => [
                ...$forTrainer,
                'subject' => "{$client} tiene l’orario di {$day}, {$hour}",
                'label' => 'Orario confermato',
                'title' => "{$client} preferisce l’orario di adesso",
                'intro' => 'La seduta resta com’era: qui sotto trovi l’orario.',
            ],
        };
    }
}
