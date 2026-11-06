<?php

namespace App\Enums;

/** "Quanto ti muovi oggi" of "Completa il tuo profilo", shown to the client's trainers. */
enum ActivityLevel: string
{
    case Sedentary = 'sedentary';
    case Light = 'light';
    case Active = 'active';
    case VeryActive = 'very_active';

    public function label(): string
    {
        return match ($this) {
            self::Sedentary => 'Sedentario',
            self::Light => 'Poco attivo',
            self::Active => 'Attivo',
            self::VeryActive => 'Molto attivo',
        };
    }
}
