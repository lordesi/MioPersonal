<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/** "Recensioni": every review, with the ones to check flagged. */
class AdminReviewsController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load the reviews from the database; flag phone numbers, links and emails.
        $now = $this->romeNow();

        // id, author, trainer, rating, text, days ago, warning, hidden.
        $reviews = [
            [1, 'Marta', 'Giulia Rossi', 5, 'Puntuale e preparatissima, in un mese il mal di schiena è migliorato.', 2, null, false],
            [2, 'Paolo R.', 'Giulia Rossi', 4, 'Seduta online ben organizzata, connessione a volte instabile.', 3, null, false],
            [3, 'Utente anonimo', 'Marco Bianchi', 1, 'Pessimo, chiamatemi al 340 000 0000 che vi spiego.', 4, 'Contiene un numero di telefono', true],
            [4, 'Ilaria P.', 'Sara Colombo', 5, 'Molto preparata, sedute online ben organizzate.', 7, null, false],
        ];

        return Inertia::render('admin/reviews', [
            'adminArea' => $this->adminArea(),
            'reviews' => array_map(fn (array $r) => [
                'id' => $r[0],
                'authorName' => $r[1],
                'trainerName' => $r[2],
                'rating' => $r[3],
                'text' => $r[4],
                'createdAt' => $this->iso($now->subDays($r[5])),
                'warning' => $r[6],
                'hidden' => $r[7],
            ], $reviews),
        ]);
    }
}
