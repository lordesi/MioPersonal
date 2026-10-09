<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/** "Utenti": clients and trainers, with suspension and data deletion. */
class AdminUsersController extends Controller
{
    use BuildsAdminPlaceholderData;

    public function __invoke(): Response
    {
        // TODO: load the users, their bookings and reviews from the database.
        $now = $this->romeNow();

        // id, name, email, days since sign-up, bookings.
        $clients = [
            [11, 'Luca Moretti', 'luca.m@esempio.it', 6, 3],
            [12, 'Chiara M.', 'chiara.m@esempio.it', 10, 1],
            [13, 'Francesca D.', 'francesca.d@esempio.it', 4, 1],
            [14, 'Anna B.', 'anna.b@esempio.it', 26, 24],
        ];

        // id, name, email, days since sign-up, profile status, reviews, rating.
        $trainers = [
            [21, 'Giulia Rossi', 'giulia.r@esempio.it', 37, 'approved', 23, 4.9],
            [22, 'Marco Bianchi', 'marco.b@esempio.it', 35, 'approved', 31, 4.8],
            [23, 'Andrea Conti', 'andrea.c@esempio.it', 29, 'approved', 14, 4.6],
            [24, 'Marco Ferri', 'marco.f@esempio.it', 6, 'review', 0, null],
        ];

        return Inertia::render('admin/users', [
            'adminArea' => $this->adminArea(),
            'clients' => array_map(fn (array $c) => [
                'id' => $c[0],
                'name' => $c[1],
                'email' => $c[2],
                'joinedAt' => $this->iso($now->subDays($c[3])),
                'bookingCount' => $c[4],
                'suspended' => false,
            ], $clients),
            'trainers' => array_map(fn (array $t) => [
                'id' => $t[0],
                'name' => $t[1],
                'email' => $t[2],
                'joinedAt' => $this->iso($now->subDays($t[3])),
                'profileStatus' => $t[4],
                'reviewCount' => $t[5],
                'rating' => $t[6],
                'suspended' => false,
            ], $trainers),
        ]);
    }
}
