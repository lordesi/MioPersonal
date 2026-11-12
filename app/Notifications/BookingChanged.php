<?php

namespace App\Notifications;

use App\Enums\BookingActor;
use App\Enums\PushCategory;
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
 * - 'accepted' / 'declined' → the trainer: the client's answer to the proposal;
 * - 'guest-cancelled' → the friends invited ("Invita un amico"): the session won't take place;
 * - 'guest-moved'     → the friends invited: the booker accepted another time.
 *
 * Queued, and sent only once the change is saved (afterCommit).
 */
class BookingChanged extends Notification implements ShouldQueue
{
    use Queueable, SendsPush;

    protected function pushCategory(): PushCategory
    {
        return PushCategory::Bookings;
    }

    public function __construct(public Booking $booking, public string $kind)
    {
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return $this->sendsMail() ? $this->mailAndPush($notifiable) : $this->inAppAndPush($notifiable);
    }

    /**
     * Email only for what the client has to know even without opening the site
     * (the session won't take place, or another time is proposed). The answers
     * to the trainer are in the bell and the push (daily limit of the mail provider).
     */
    private function sendsMail(): bool
    {
        return in_array($this->kind, ['cancelled-by-trainer', 'proposed', 'guest-cancelled', 'guest-moved'], true);
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
                'cancelled' => str_starts_with($this->kind, 'cancelled') || $this->kind === 'guest-cancelled',
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
                'url' => route('client.bookings'),
                'who' => "con {$trainer}",
            ],
            'guest-cancelled' => [
                'subject' => "Seduta annullata: {$day}, {$hour}",
                'label' => 'Annullata',
                'title' => $booking->cancelled_by === BookingActor::Trainer
                    ? "{$trainer} ha annullato la seduta"
                    : "{$client} ha annullato la seduta",
                'intro' => 'La seduta a cui partecipavi non si terrà.',
                'details' => ['Messaggio' => $booking->cancelled_by === BookingActor::Trainer ? $booking->cancel_note : null],
                'note' => 'Puoi prenotare una seduta tutta tua dal profilo del trainer.',
                'button' => 'Vedi il trainer',
                'url' => route('trainers.show', $booking->trainerProfile->slug),
                'who' => "con {$trainer}",
            ],
            'guest-moved' => [
                'subject' => "La seduta con {$trainer} si sposta: {$day}, {$hour}",
                'label' => 'Spostata',
                'title' => 'La seduta ha un nuovo orario',
                'intro' => "{$client} ha accettato il nuovo orario proposto da {$trainer}: qui sotto trovi quello nuovo.",
                'details' => [],
                'note' => null,
                'button' => 'Le mie prenotazioni',
                'url' => route('client.bookings'),
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
