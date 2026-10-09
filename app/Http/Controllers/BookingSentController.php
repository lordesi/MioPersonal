<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Inertia\Inertia;
use Inertia\Response;

/** "Prenotazione inviata": shown to the client right after sending a booking request. */
class BookingSentController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(string $booking): Response
    {
        // TODO: load the logged-in client's booking from the database (404 if it is someone else's).
        abort_unless($booking === '1', 404);

        return Inertia::render('client/booking-sent', [
            'booking' => [
                'id' => 1,
                'status' => 'pending',
                'start' => $this->iso($this->at($this->romeNow(), 1, 18)),
                'hours' => 1,
                'serviceName' => 'Seduta singola',
                'placeLabel' => 'Studio · Città Studi',
                'priceCents' => 4500,
                'confirmWithinHours' => 24,
                'freeCancellationHours' => 24,
                'trainer' => [
                    'name' => 'Giulia Rossi',
                    'firstName' => 'Giulia',
                    'href' => route('trainers.show', 'giulia-rossi', false),
                    'subtitle' => 'Functional e Pilates · Città Studi',
                ],
            ],
        ]);
    }
}
