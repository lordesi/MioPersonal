<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Saves when a logged-in user last used the web app (`users.last_active_at`),
 * for "Trainer attivi" in Admin · Panoramica. At most once every few minutes
 * per user, so the database is not written on every page.
 */
class TrackLastActivity
{
    /** How often the date is written again. */
    public const EVERY_MINUTES = 5;

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && ($user->last_active_at === null || $user->last_active_at->lt(now()->subMinutes(self::EVERY_MINUTES)))) {
            // A direct query: it doesn't touch `updated_at` and fires no model events.
            DB::table('users')->where('id', $user->id)->update(['last_active_at' => now()]);
        }

        return $next($request);
    }
}
