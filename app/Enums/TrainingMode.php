<?php

namespace App\Enums;

/** "Come preferisci allenarti" of Completa profilo. Saved as text in `client_preferences.mode`. */
enum TrainingMode: string
{
    case InPerson = 'in_person';
    case Online = 'online';
    case Both = 'both';
}
