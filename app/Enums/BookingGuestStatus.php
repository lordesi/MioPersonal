<?php

namespace App\Enums;

/** A friend invited to a session. Saved as text in `booking_guests.status`. */
enum BookingGuestStatus: string
{
    case Joined = 'joined';
    /** The guest said they won't come. */
    case Left = 'left';
    /** The booker took them off. */
    case Removed = 'removed';
}
