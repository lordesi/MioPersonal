<?php

namespace App\Enums;

/** "Da quanto ti alleni" of "Completa il tuo profilo", shown to the client's trainers. */
enum TrainingExperience: string
{
    case Never = 'never';
    case UnderOneYear = 'under_1';
    case OneToThree = '1_3';
    case ThreeToFive = '3_5';
    case OverFive = 'over_5';

    public function label(): string
    {
        return match ($this) {
            self::Never => 'Mai allenato',
            self::UnderOneYear => 'Meno di 1 anno',
            self::OneToThree => '1–3 anni',
            self::ThreeToFive => '3–5 anni',
            self::OverFive => 'Più di 5 anni',
        };
    }
}
