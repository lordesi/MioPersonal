<?php

namespace App\Enums;

/** "Il tuo livello" of "Completa il tuo profilo", shown to the client's trainers. */
enum FitnessLevel: string
{
    case Beginner = 'beginner';
    case Intermediate = 'intermediate';
    case Advanced = 'advanced';

    public function label(): string
    {
        return match ($this) {
            self::Beginner => 'Principiante',
            self::Intermediate => 'Intermedio',
            self::Advanced => 'Avanzato',
        };
    }
}
