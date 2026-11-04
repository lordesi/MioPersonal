<?php

namespace App\Notifications;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Support\BookingMailData;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The email to the trainer when a client books: a request to answer, or a
 * booking already confirmed by "Conferma automatica".
 *
 * Queued, so the booking page doesn't wait for the mail server, and sent only
 * once the booking is saved (afterCommit).
 */
class BookingRequested extends Notification implements ShouldQueue
{
    use Queueable;

    /** Decided now: the trainer may answer before the queue sends the email. */
    public bool $alreadyConfirmed;

    public function __construct(public Booking $booking)
    {
        $this->alreadyConfirmed = $booking->status === BookingStatus::Confirmed;
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /** Sent to the trainer's account: resources/views/mail/booking/new-request. */
    public function toMail(User $notifiable): MailMessage
    {
        $booking = $this->booking;
        $client = $booking->client->name ?? 'Un cliente';
        $day = BookingMailData::day($booking);
        $hour = BookingMailData::hour($booking);

        return (new MailMessage)
            ->subject(($this->alreadyConfirmed ? 'Nuova prenotazione' : 'Nuova richiesta').": {$client}, {$day} alle {$hour}")
            ->view(['mail.booking.new-request', 'mail.booking.new-request-text'], [
                'card' => BookingMailData::card($booking, $client),
                'day' => $day,
                'clientName' => $client,
                'isNewClient' => $this->isNewClient(),
                'clientNote' => $booking->client_note,
                'alreadyConfirmed' => $this->alreadyConfirmed,
                'expiresAt' => $booking->expires_at === null ? null : BookingMailData::when($booking->expires_at),
                'url' => route($this->alreadyConfirmed ? 'trainer.today' : 'trainer.requests'),
            ]);
    }

    /** "· nuovo cliente": never had a confirmed session with this trainer. */
    private function isNewClient(): bool
    {
        return $this->booking->client_id !== null && Booking::query()
            ->where('client_id', $this->booking->client_id)
            ->where('trainer_profile_id', $this->booking->trainer_profile_id)
            ->where('status', BookingStatus::Confirmed)
            ->whereKeyNot($this->booking->id)
            ->doesntExist();
    }
}
