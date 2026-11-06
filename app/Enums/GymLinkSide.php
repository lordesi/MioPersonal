<?php

namespace App\Enums;

/** Who asked first (gym_trainer.initiated_by): the other side answers. */
enum GymLinkSide: string
{
    /** The gym invited the trainer. */
    case Gym = 'gym';
    /** The trainer asked to join the gym. */
    case Trainer = 'trainer';

    public function other(): self
    {
        return $this === self::Gym ? self::Trainer : self::Gym;
    }
}
