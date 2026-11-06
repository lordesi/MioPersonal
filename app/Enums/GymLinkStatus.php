<?php

namespace App\Enums;

/** A trainer in a gym (gym_trainer.status): asked, agreed or said no. */
enum GymLinkStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Declined = 'declined';
}
