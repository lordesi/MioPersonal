<?php

namespace App\Enums;

/** What the client did, in "Segna un allenamento". Few on purpose: no exercises. */
enum ActivityKind: string
{
    case Strength = 'strength';
    case Running = 'running';
    case Walking = 'walking';
    case Cycling = 'cycling';
    case Swimming = 'swimming';
    case YogaPilates = 'yoga_pilates';
    case Sport = 'sport';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Strength => 'Forza',
            self::Running => 'Corsa',
            self::Walking => 'Camminata',
            self::Cycling => 'Bici',
            self::Swimming => 'Nuoto',
            self::YogaPilates => 'Yoga o pilates',
            self::Sport => 'Sport',
            self::Other => 'Altro',
        };
    }
}
