<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Inertia\Inertia;
use Inertia\Response;

class ClientBookingsController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load the logged-in client's bookings, packages and favorites from the database.
        $now = $this->romeNow();
        $upcomingStart = $this->at($now, 3, 10);

        return Inertia::render('client/bookings', [
            'upcoming' => [
                [
                    'id' => 1,
                    'trainerName' => 'Chiara Galli',
                    'trainerHref' => route('trainers.show', 'chiara-galli', false),
                    'trainerPhone' => '+390000000000',
                    'trainerEmail' => 'chiara.galli@example.com',
                    'discipline' => 'Yoga',
                    'start' => $this->iso($upcomingStart),
                    'hours' => 1,
                    'placeLabel' => 'Al parco, CityLife',
                    'status' => 'confirmed',
                    'freeCancellationUntil' => $this->iso($upcomingStart->subDay()),
                ],
            ],
            'pending' => [
                [
                    'id' => 2,
                    'trainerName' => 'Giulia Rossi',
                    'trainerFirstName' => 'Giulia',
                    'trainerHref' => route('trainers.show', 'giulia-rossi', false),
                    'start' => $this->iso($this->at($now, 1, 18)),
                    'hours' => 1,
                    'serviceName' => 'Seduta singola',
                    'status' => 'pending',
                    'expiresAt' => $this->iso($now->addHours(23)),
                ],
                [
                    'id' => 3,
                    'trainerName' => 'Marco Bianchi',
                    'trainerFirstName' => 'Marco',
                    'trainerHref' => route('trainers.show', 'marco-bianchi', false),
                    'start' => $this->iso($this->at($now, 2, 13)),
                    'hours' => 1,
                    'serviceName' => 'Valutazione iniziale',
                    'status' => 'expired',
                    'expiresAt' => null,
                ],
            ],
            'packages' => [
                [
                    'id' => 1,
                    'name' => 'Pacchetto 10 sedute',
                    'trainerName' => 'Giulia Rossi',
                    'trainerHref' => route('trainers.show', 'giulia-rossi', false),
                    'used' => 4,
                    'total' => 10,
                    'validUntil' => $now->endOfYear()->toDateString(),
                ],
            ],
            'favorites' => [
                [
                    'name' => 'Giulia Rossi',
                    'href' => route('trainers.show', 'giulia-rossi', false),
                    'nextSlotStart' => $this->iso($this->at($now, 1, 18)),
                ],
                [
                    'name' => 'Andrea Conti',
                    'href' => route('trainers.show', 'andrea-conti', false),
                    'nextSlotStart' => $this->iso($now->addHours(2)->startOfHour()),
                ],
                [
                    'name' => 'Chiara Galli',
                    'href' => route('trainers.show', 'chiara-galli', false),
                    'nextSlotStart' => $this->iso($this->at($now, 3, 9)),
                ],
            ],
            'past' => [
                [
                    'id' => 4,
                    'trainerName' => 'Luca Ferrari',
                    'trainerHref' => route('trainers.show', 'luca-ferrari', false),
                    'start' => $this->iso($this->at($now, -5, 18)),
                    'serviceName' => 'Seduta singola',
                    'review' => null,
                ],
                [
                    'id' => 5,
                    'trainerName' => 'Sara Colombo',
                    'trainerHref' => route('trainers.show', 'sara-colombo', false),
                    'start' => $this->iso($this->at($now, -12, 19)),
                    'serviceName' => 'Seduta online',
                    'review' => [
                        'rating' => 5,
                        'text' => 'Molto preparata, sedute online ben organizzate.',
                    ],
                ],
            ],
        ]);
    }
}
