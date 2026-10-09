<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Http\Controllers\Concerns\BuildsPlaceholderData;

/**
 * Placeholder data of the admin panel, shown until the real tables exist.
 * TODO: delete once every admin page reads from the database.
 */
trait BuildsAdminPlaceholderData
{
    use BuildsPlaceholderData;

    /**
     * The badges of the admin menu, sent by every admin page.
     *
     * @return array{verificationCount: int, unreadMessages: int, flaggedReviews: int}
     */
    private function adminArea(): array
    {
        return [
            'verificationCount' => 4,
            'unreadMessages' => 3,
            'flaggedReviews' => 1,
        ];
    }

    /**
     * "Attività recente" and "Registro attività": who did what, newest first.
     *
     * @return list<array{id: int, who: string, what: string, at: string}>
     */
    private function activityLog(): array
    {
        $now = $this->romeNow();

        $entries = [
            ['Sistema', 'ha fatto decadere la prenotazione #1044', -1, 13, 0],
            ['Socio', 'ha esportato i dati di Chiara M.', -3, 16, 20],
            ['Socio', 'ha nascosto una recensione su Marco Bianchi', -4, 10, 15],
            ['Alessandro', 'ha chiesto modifiche a Pietro Gallo', -4, 9, 58],
            ['Alessandro', 'ha approvato il profilo di Andrea Conti', -29, 18, 42],
        ];

        return array_map(fn (array $entry, int $index) => [
            'id' => $index + 1,
            'who' => $entry[0],
            'what' => $entry[1],
            'at' => $this->iso($this->at($now, $entry[2], $entry[3], $entry[4])),
        ], $entries, array_keys($entries));
    }
}
