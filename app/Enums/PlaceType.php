<?php

namespace App\Enums;

/** Where a trainer works. Saved as text in `trainer_places.type`. */
enum PlaceType: string
{
    case Studio = 'studio';
    case Home = 'home';
    case Park = 'park';
    case Online = 'online';

    /** Title of the "Dove si allena" rows of the public profile. */
    public function label(): string
    {
        return match ($this) {
            self::Studio => 'Studio',
            self::Home => 'A domicilio',
            self::Park => 'Al parco',
            self::Online => 'Online',
        };
    }
}
