<?php

namespace App\Enums;

/** Who cancelled a booking. Saved as text in `bookings.cancelled_by`. */
enum BookingActor: string
{
    case Client = 'client';
    case Trainer = 'trainer';
    /** Automatic, e.g. when the client deletes the account. */
    case System = 'system';
}
