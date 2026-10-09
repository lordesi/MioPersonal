<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/** "Prenotazioni": every booking on the platform, newest first. */
class AdminBookingsController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load the bookings from the database.
        $now = $this->romeNow();

        // id, client, trainer, [days from today, hour, minute], hours, service, status,
        // hours until the request expires (pending only), note.
        $bookings = [
            [1048, 'Luca M.', 'Giulia Rossi', [1, 18, 0], 1, 'Seduta singola · 1 ora', 'pending', 22, null],
            [1047, 'Francesca D.', 'Giulia Rossi', [5, 18, 0], 1, 'Seduta singola · 1 ora', 'pending', 5, null],
            [1046, 'Chiara G.', 'Andrea Conti', [-2, 19, 0], 1, 'Calisthenics · 1 ora', 'confirmed', null, null],
            [1045, 'Paolo R.', 'Giulia Rossi', [-3, 19, 30], 1, 'Seduta online', 'completed', null, null],
            [1044, 'Luca M.', 'Marco Bianchi', [-2, 13, 0], 1, 'Valutazione iniziale', 'expired', null, 'Nessuna risposta in 24 h'],
            [1043, 'Anna B.', 'Giulia Rossi', [-3, 7, 30], 1, 'Seduta singola', 'no_show', null, 'Segnata dal trainer'],
            [1042, 'Marta S.', 'Sara Colombo', [-4, 10, 0], 1, 'Seduta online', 'cancelled', null, 'Dal cliente, 30 h prima'],
            [1041, 'Stefano V.', 'Giulia Rossi', [-5, 9, 0], 2, 'Seduta singola · 2 ore', 'completed', null, null],
        ];

        return Inertia::render('admin/bookings', [
            'adminArea' => $this->adminArea(),
            'bookings' => array_map(fn (array $b) => [
                'id' => $b[0],
                'clientName' => $b[1],
                'trainerName' => $b[2],
                'start' => $this->iso($this->at($now, ...$b[3])),
                'hours' => $b[4],
                'serviceName' => $b[5],
                'status' => $b[6],
                'expiresAt' => $b[7] === null ? null : $this->iso($now->addHours($b[7])),
                'note' => $b[8],
            ], $bookings),
        ]);
    }
}
