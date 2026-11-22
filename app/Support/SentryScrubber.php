<?php

namespace App\Support;

use Illuminate\Database\QueryException;
use PDOException;
use Sentry\Breadcrumb;
use Sentry\Event;
use Sentry\EventHint;

/**
 * Before an error goes to Sentry (config/sentry.php, before_send): the values
 * of the database queries come out. A QueryException's message has the query
 * with its values filled in, and PostgreSQL adds them in the DETAIL ("Key
 * (email)=(giulia@example.com) already exists"): an email or a phone would
 * reach Sentry, against what the privacy policy says. What is left is enough
 * to debug: the SQLSTATE code and the query with its "?".
 */
class SentryScrubber
{
    public static function beforeSend(Event $event, ?EventHint $hint = null): ?Event
    {
        $queries = [];

        for ($exception = $hint?->exception; $exception !== null; $exception = $exception->getPrevious()) {
            if ($exception instanceof QueryException) {
                $queries[] = $exception->getSql();
            }
        }

        foreach ($event->getExceptions() as $bag) {
            $type = $bag->getType();

            if (is_a($type, QueryException::class, true)) {
                $sql = $queries[0] ?? null;
                $bag->setValue(self::sqlState($bag->getValue()).($sql === null ? '' : " (SQL: {$sql})"));
            } elseif (is_a($type, PDOException::class, true)) {
                $bag->setValue(self::sqlState($bag->getValue()));
            }
        }

        // The same message logged as a breadcrumb (the log of the error).
        $event->setBreadcrumb(array_map(
            fn (Breadcrumb $breadcrumb) => str_contains((string) $breadcrumb->getMessage(), 'SQLSTATE[')
                ? $breadcrumb->withMessage(self::sqlState((string) $breadcrumb->getMessage()))
                : $breadcrumb,
            $event->getBreadcrumbs(),
        ));

        return $event;
    }

    /** "SQLSTATE[23505]: Unique violation: … Key (email)=(…)" → "SQLSTATE[23505] (details removed)". */
    public static function sqlState(string $message): string
    {
        return preg_match('/SQLSTATE\[(\w+)\]/', $message, $match) === 1
            ? "SQLSTATE[{$match[1]}] (details removed)"
            : 'Database error (details removed)';
    }
}
