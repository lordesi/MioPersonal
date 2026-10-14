<?php

namespace App\Enums;

/** Where a booking is. Saved as text in `bookings.status`. */
enum BookingStatus: string
{
    /** Sent by the client, waiting for the trainer until `expires_at`. */
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    /** Refused by the trainer. */
    case Declined = 'declined';
    case Cancelled = 'cancelled';
    /** The trainer did not answer in time. */
    case Expired = 'expired';

    /**
     * The statuses that take the slot: nobody else can book it.
     *
     * @return list<self>
     */
    public static function active(): array
    {
        return [self::Pending, self::Confirmed];
    }
}
