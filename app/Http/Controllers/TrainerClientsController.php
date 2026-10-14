<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Clienti" of the trainer. Empty until bookings are stored (step 5 of
 * docs/database/analisi.md): the clients are the people who booked.
 */
class TrainerClientsController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(): Response
    {
        return Inertia::render('trainer/clients', [
            'trainerArea' => $this->trainerArea(),
            // TODO (step 5): the trainer's clients, packages and notes.
            'clients' => [],
        ]);
    }
}
