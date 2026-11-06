<?php

namespace App\Enums;

/** Where a trainer works. Saved as text in `trainer_places.type`. */
enum PlaceType: string
{
    /** A studio typed by hand (name and address): "Studio privato". */
    case Studio = 'studio';
    case Home = 'home';
    case Park = 'park';
    case Online = 'online';
    /**
     * A gym of MioPersonal (gym_profile_id). Never chosen in a form: the row
     * is made when the gym and the trainer agree (App\Actions\Gym\GymLinks).
     */
    case Gym = 'gym';

    /** Title of the "Dove si allena" rows of the public profile. */
    public function label(): string
    {
        return match ($this) {
            self::Studio => 'Studio privato',
            self::Home => 'A domicilio',
            self::Park => 'Al parco',
            self::Online => 'Online',
            self::Gym => 'In palestra',
        };
    }
}
