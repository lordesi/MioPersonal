<?php

namespace App\Enums;

/** "Anni di esperienza" of the registration. Saved as text in `trainer_profiles.experience`. */
enum TrainerExperience: string
{
    case LessThanTwo = 'lt2';
    case TwoToFive = '2to5';
    case FiveToTen = '5to10';
    case MoreThanTen = 'gt10';

    /** On the public profile, e.g. "Da 2 a 5 anni di esperienza". */
    public function profileLabel(): string
    {
        return match ($this) {
            self::LessThanTwo => 'Meno di 2 anni di esperienza',
            self::TwoToFive => 'Da 2 a 5 anni di esperienza',
            self::FiveToTen => 'Da 5 a 10 anni di esperienza',
            self::MoreThanTen => 'Più di 10 anni di esperienza',
        };
    }
}
