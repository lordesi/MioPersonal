<?php

namespace App\Enums;

/** "Sesso" of "Completa il tuo profilo": no answer = null ("Preferisco non dirlo"). */
enum Sex: string
{
    case Female = 'female';
    case Male = 'male';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Female => 'Donna',
            self::Male => 'Uomo',
            self::Other => 'Altro',
        };
    }
}
