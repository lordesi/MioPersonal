<?php

namespace App\Support\Socialite;

use Laravel\Socialite\Two\GoogleProvider;

/**
 * "Collega Google Calendar": a Google login that lets the app make its own
 * calendar and write events only on it (`calendar.app.created`): the
 * trainer's other calendars stay out of reach. Offline, to keep working
 * when the trainer is not on the site.
 */
class GoogleCalendarProvider extends GoogleProvider
{
    public const SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';

    /**
     * "Blocca gli orari occupati", optional and asked only when the trainer
     * turns it on: the list of their calendars and when they're busy on them
     * (never titles or details).
     */
    public const BUSY_SCOPES = [
        'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
        'https://www.googleapis.com/auth/calendar.freebusy',
    ];

    /** @var list<string> */
    protected $scopes = ['openid', 'email', self::SCOPE];

    /**
     * @return array<string, mixed>
     */
    protected function getCodeFields($state = null): array
    {
        // The refresh token comes only with the consent screen.
        return [...parent::getCodeFields($state), 'access_type' => 'offline', 'prompt' => 'consent'];
    }
}
