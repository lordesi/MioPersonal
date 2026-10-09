<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPlaceholderData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/** "Messaggi": what people wrote from the Contatti page. */
class AdminMessagesController extends Controller
{
    use BuildsAdminPlaceholderData;

    /** Privacy requests must be answered within this many days (GDPR). */
    private const PRIVACY_DEADLINE_DAYS = 30;

    public function __invoke(): Response
    {
        // TODO: load the messages from the database once the Contatti form saves them.
        $now = $this->romeNow();

        // id, name, email, role, topic, hours ago, subject, text, status, privacy request.
        $messages = [
            [1, 'Chiara M.', 'chiara.m@esempio.it', 'Cliente', 'Privacy e dati', 2, 'Cancellazione account', 'Ciao, vorrei cancellare il mio account e tutti i miei dati. Grazie.', 'new', true],
            [2, 'Sofia Bassi', 'sofia.b@esempio.it', 'Personal trainer', 'Verifica e approvazione', 5, 'Quanto ci vuole per l’approvazione?', 'Ho inviato il profilo due giorni fa, è tutto a posto? Posso già ricevere prenotazioni?', 'new', false],
            [3, 'Luca M.', 'luca.m@esempio.it', 'Cliente', 'Una prenotazione', 26, 'Prenotazione decaduta', 'La mia prenotazione con Marco Bianchi è sparita, ma lui mi aveva detto di sì a voce.', 'in-progress', false],
            [4, 'Andrea T.', 'andrea.t@esempio.it', 'Altro', 'Collaborazioni', 28, 'Collaborazione con una palestra', 'Gestisco una palestra in zona Isola, possiamo sentirci per inserire i nostri trainer?', 'new', false],
            [5, 'Giulia Rossi', 'giulia.r@esempio.it', 'Personal trainer', 'Il mio profilo', 72, 'Cambio foto', 'Come cambio la foto principale della galleria?', 'closed', false],
        ];

        return Inertia::render('admin/messages', [
            'adminArea' => $this->adminArea(),
            'privacyDeadlineDays' => self::PRIVACY_DEADLINE_DAYS,
            'messages' => array_map(fn (array $m) => [
                'id' => $m[0],
                'name' => $m[1],
                'email' => $m[2],
                'roleLabel' => $m[3],
                'topicLabel' => $m[4],
                'receivedAt' => $this->iso($now->subHours($m[5])),
                'subject' => $m[6],
                'text' => $m[7],
                'status' => $m[8],
                'isPrivacyRequest' => $m[9],
            ], $messages),
        ]);
    }
}
