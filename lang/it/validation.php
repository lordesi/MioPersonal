<?php

/*
| Only the messages used by the app's forms. Anything missing falls back
| to lang/en (APP_FALLBACK_LOCALE).
*/

return [
    'accepted' => 'Devi accettare :attribute.',
    'confirmed' => 'La conferma di :attribute non corrisponde.',
    'current_password' => 'La password non è corretta.',
    'email' => 'Inserisci un’email valida, es. nome@esempio.it.',
    'in' => 'Scegli una delle opzioni per :attribute.',
    'max' => [
        'string' => ':Attribute può avere al massimo :max caratteri.',
    ],
    'min' => [
        'string' => ':Attribute deve avere almeno :min caratteri.',
    ],
    'password' => [
        'letters' => 'La password deve contenere almeno una lettera.',
        'mixed' => 'La password deve contenere almeno una maiuscola e una minuscola.',
        'numbers' => 'La password deve contenere almeno un numero.',
        'symbols' => 'La password deve contenere almeno un simbolo.',
        'uncompromised' => 'Questa password è comparsa in una fuga di dati: scegline un\'altra.',
    ],
    'regex' => 'Controlla il formato di :attribute.',
    'required' => 'Compila il campo :attribute.',
    'string' => ':Attribute deve essere un testo.',
    'unique' => 'Esiste già un account con questa :attribute.',

    'custom' => [
        'phone' => [
            'regex' => 'Inserisci un cellulare di 10 cifre, es. 333 000 0000.',
        ],
    ],

    'attributes' => [
        'current_password' => 'password attuale',
        'email' => 'email',
        'first_name' => 'nome',
        'last_name' => 'cognome',
        'message' => 'messaggio',
        'name' => 'nome',
        'password' => 'password',
        'phone' => 'telefono',
        'role' => 'Sei',
        'terms' => 'i Termini e l\'Informativa privacy',
        'topic' => 'Argomento',
    ],
];
