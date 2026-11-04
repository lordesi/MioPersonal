<?php

// Esempio di notifica per "Seduta confermata".
// Copia in app/Notifications/BookingConfirmed.php e adatta i nomi dei campi al vostro modello Booking
// (starts_at, ends_at, service_name, trainer, ...). Le altre tre email di prenotazione si fanno allo stesso modo:
// cambiano solo la vista, l'oggetto e le variabili (vedi la tabella nel README).

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingConfirmed extends Notification implements ShouldQueue // se non usate le code, togliete "implements ShouldQueue"
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking;
        $start = $booking->starts_at->copy()->locale('it');
        $end = $booking->ends_at->copy()->locale('it');
        $trainer = $booking->trainer;

        $data = [
            'trainerName' => $trainer->name,
            'weekday' => $start->isoFormat('ddd'),          // "mer"
            'day' => $start->format('j'),                    // "28"
            'month' => $start->isoFormat('MMM'),             // "ott"
            'time' => $start->format('H:i').'–'.$end->format('H:i'),
            'service' => $booking->service_name,             // "Prima seduta", "Seduta singola", ...
            'place' => $booking->place_label,                // "Online", "Studio · Via Roma 1", ...
            'trainerPhone' => $trainer->share_phone ? $trainer->phone : null,
            'trainerEmail' => $trainer->share_email ? $trainer->email : null,
            'trainerNotes' => $trainer->client_notes,        // "Indicazioni aggiuntive" delle impostazioni
            'cancelUntil' => $start->copy()->subHours(24)->isoFormat('ddd D MMM [alle] HH:mm'),
            'url' => route('client.bookings.show', $booking),
        ];

        return (new MailMessage)
            ->subject('Seduta confermata: '.$data['weekday'].' '.$data['day'].' '.$data['month'].', '.$start->format('H:i'))
            ->view(['emails.booking.confirmed', 'emails.booking.confirmed-text'], $data);
    }
}
