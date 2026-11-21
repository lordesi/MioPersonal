<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * How long the server took for a page, in the browser's DevTools (Network →
 * the request → Timing): `app` is all of PHP, from public/index.php to the
 * response, `db` the time spent in the queries (with how many they were).
 *
 * The time of a click is this plus the network: with these numbers we can
 * tell a slow page from a slow connection, on the real site (docs/velocita.md).
 * Only durations and a count: nothing about the data or the code.
 */
class ServerTiming
{
    public function handle(Request $request, Closure $next): Response
    {
        $queries = 0;
        $queryMs = 0.0;

        DB::listen(function (QueryExecuted $query) use (&$queries, &$queryMs) {
            $queries++;
            $queryMs += $query->time;
        });

        $response = $next($request);

        $start = defined('LARAVEL_START') ? LARAVEL_START : $request->server('REQUEST_TIME_FLOAT', microtime(true));
        $appMs = (microtime(true) - (float) $start) * 1000;

        $response->headers->set('Server-Timing', sprintf(
            'app;dur=%.1f;desc="PHP", db;dur=%.1f;desc="%d query"',
            $appMs,
            $queryMs,
            $queries,
        ), false);

        return $response;
    }
}
