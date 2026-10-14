<?php

/*
| "Password dimenticata?". `sent` is also shown for an email that has no
| account (see App\Http\Responses\FailedPasswordResetLinkResponse), so
| nobody can find out who is signed up.
*/

return [
    'reset' => 'Password aggiornata: ora puoi accedere.',
    'sent' => 'Se l\'email è registrata, ti abbiamo inviato un link per reimpostare la password. Controlla anche lo spam.',
    'throttled' => 'Ti abbiamo appena inviato un link: attendi un minuto prima di riprovare.',
    'token' => 'Questo link non è più valido. Richiedine uno nuovo.',
    'user' => 'Se l\'email è registrata, ti abbiamo inviato un link per reimpostare la password. Controlla anche lo spam.',
];
