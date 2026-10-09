<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Inertia\Inertia;
use Inertia\Response;

class TrainerReviewsController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load the trainer's reviews from the database.
        $now = $this->romeNow();

        return Inertia::render('trainer/reviews', [
            'trainerArea' => $this->trainerArea(),
            'summary' => ['average' => 4.9, 'count' => 23],
            'reviews' => [
                [
                    'id' => 1,
                    'authorName' => 'Marta',
                    'rating' => 5,
                    'serviceName' => 'Seduta singola',
                    'date' => $this->iso($this->at($now, -2, 19)),
                    'text' => 'Puntuale e preparatissima. In un mese ho una routine che riesco a seguire.',
                    'reply' => null,
                ],
                [
                    'id' => 2,
                    'authorName' => 'Stefano',
                    'rating' => 5,
                    'serviceName' => 'Pacchetto 10 sedute',
                    'date' => $this->iso($this->at($now, -50, 19)),
                    'text' => 'Allenamenti al parco sempre diversi. Ottima per chi riparte da zero.',
                    'reply' => 'Grazie Stefano, ci vediamo al parco per la prossima!',
                ],
                [
                    'id' => 3,
                    'authorName' => 'Ilaria',
                    'rating' => 4,
                    'serviceName' => 'Seduta online',
                    'date' => $this->iso($this->at($now, -80, 19)),
                    'text' => 'Le sedute online funzionano bene, servirebbe un po\' più di materiale da seguire tra una seduta e l\'altra.',
                    'reply' => 'Grazie del consiglio: da settembre mando una scheda dopo ogni seduta.',
                ],
            ],
        ]);
    }
}
