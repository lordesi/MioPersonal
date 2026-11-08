<?php

namespace App\Enums;

/** A place taken in an event (group_session_registrations.status). */
enum RegistrationStatus: string
{
    case Registered = 'registered';
    /** The client gave it back. */
    case Cancelled = 'cancelled';
    /** The organizer took it back. */
    case Removed = 'removed';
}
