<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * The parts of the site that can be switched off (config/features.php):
 * gyms, their courses, events. The dependencies are decided here only:
 * no courses without the gyms.
 */
final class Features
{
    public const GYMS = 'gyms';

    public const COURSES = 'courses';

    public const EVENTS = 'events';

    public static function gyms(): bool
    {
        return config('features.gyms') === true;
    }

    /** The gyms' courses: also off when the gyms are. */
    public static function courses(): bool
    {
        return self::gyms() && config('features.courses') === true;
    }

    /** The events of the trainers (and of the gyms, when these are on too). */
    public static function events(): bool
    {
        return config('features.events') === true;
    }

    /** A misspelled name (e.g. in `->middleware('feature:…')`) is a bug, not a part switched off. */
    public static function on(string $feature): bool
    {
        return match ($feature) {
            self::GYMS => self::gyms(),
            self::COURSES => self::courses(),
            self::EVENTS => self::events(),
            default => throw new InvalidArgumentException("Unknown feature \"{$feature}\" (config/features.php)."),
        };
    }

    /**
     * For the pages (the shared prop `features`, lib/features.ts).
     *
     * @return array{gyms: bool, courses: bool, events: bool}
     */
    public static function all(): array
    {
        return [
            self::GYMS => self::gyms(),
            self::COURSES => self::courses(),
            self::EVENTS => self::events(),
        ];
    }
}
