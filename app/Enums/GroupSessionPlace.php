<?php

namespace App\Enums;

/** Where an event takes place (group_sessions.place). */
enum GroupSessionPlace: string
{
    /** In a gym of MioPersonal: gym_profile_id. */
    case Gym = 'gym';
    /** An address written by the organizer (a park, a studio). */
    case Address = 'address';
    case Online = 'online';

    public function label(): string
    {
        return match ($this) {
            self::Gym => 'In palestra',
            self::Address => 'A un indirizzo',
            self::Online => 'Online',
        };
    }
}
