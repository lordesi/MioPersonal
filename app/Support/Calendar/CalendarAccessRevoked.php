<?php

namespace App\Support\Calendar;

use RuntimeException;

/**
 * Google no longer lets the app write on the trainer's calendar: they have to
 * link it again. $permissionOnly: the account is still linked, only that one
 * permission is missing (e.g. "Blocca gli orari occupati" taken off on Google).
 */
class CalendarAccessRevoked extends RuntimeException
{
    public function __construct(string $message, public readonly bool $permissionOnly = false)
    {
        parent::__construct($message);
    }
}
