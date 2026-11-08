<?php

namespace App\Enums;

/** group_sessions.status: on the calendar, or called off by the organizer. */
enum GroupSessionStatus: string
{
    case Published = 'published';
    case Cancelled = 'cancelled';
}
