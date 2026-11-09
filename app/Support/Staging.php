<?php

namespace App\Support;

/**
 * The test copy of the site (APP_ENV=staging, e.g. staging.miopersonal.it):
 * fake data, behind a password, hidden from search engines, and no real
 * email can leave it. See docs/staging.md.
 */
final class Staging
{
    public const ENVIRONMENT = 'staging';

    public static function active(): bool
    {
        return app()->environment(self::ENVIRONMENT);
    }

    /**
     * Whatever the .env says, the staging site only writes emails in the log:
     * a real address in the fake data (or a copied database) never gets a message.
     */
    public static function trapMail(): void
    {
        if (! self::active()) {
            return;
        }

        if (! in_array(config('mail.default'), ['log', 'array'], true)) {
            config(['mail.default' => 'log']);
        }
    }
}
