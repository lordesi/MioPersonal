<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;
use Inertia\Inertia;
use Inertia\Response;

class TrainerClientsController extends Controller
{
    use BuildsPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load the trainer's clients, packages and notes from the database.
        $now = $this->romeNow();

        $client = fn (int $id, string $name, string $email, int $sessions, int $lastDays, ?array $next, ?array $package, string $note) => [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'sessions' => $sessions,
            'lastSession' => $this->iso($this->at($now, $lastDays, 8)),
            'nextSession' => $next ? $this->iso($this->at($now, ...$next)) : null,
            'package' => $package ? ['name' => 'Pacchetto 10', 'left' => $package[0], 'total' => $package[1]] : null,
            'note' => $note,
        ];

        return Inertia::render('trainer/clients', [
            'trainerArea' => $this->trainerArea(),
            'clients' => [
                $client(1, 'Roberto C.', 'roberto@example.com', 7, 0, [1, 12], [3, 10], 'Preferisce lo studio, arriva sempre 10 minuti prima.'),
                $client(2, 'Anna B.', 'anna@example.com', 23, 0, [6, 7], null, 'Allenamento al parco anche con la pioggia leggera.'),
                $client(3, 'Marta S.', 'marta@example.com', 9, -4, [7, 9], null, 'Citofono «Studio 3B».'),
                $client(4, 'Stefano V.', 'stefano@example.com', 12, -7, [7, 18], [6, 10], ''),
                $client(5, 'Paolo R.', 'paolo@example.com', 4, -5, [0, 19, 30], null, 'Solo online, link Meet nel calendario.'),
                $client(6, 'Ilaria P.', 'ilaria@example.com', 6, -5, [2, 18], null, ''),
            ],
        ]);
    }
}
