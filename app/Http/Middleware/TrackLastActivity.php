<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\Stats;
use App\Support\TrainerSlots;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Saves when a logged-in user last used the web app (`users.last_active_at`),
 * for "Trainer attivi" in Admin · Panoramica, and the day in
 * `user_activity_days` (App\Support\Stats). At most once every few minutes
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

        if ($user instanceof User && $this->isDue($user->last_active_at)) {
            // A direct query: it doesn't touch `updated_at` and fires no model events.
            DB::table('users')->where('id', $user->id)->update(['last_active_at' => now()]);
            // The day in the history of the active users (once a day).
            Stats::recordActivity($user);
        }

        return $next($request);
    }

    /** Every few minutes, and always on a new Rome day (just after midnight too). */
    private function isDue(?CarbonInterface $lastActiveAt): bool
    {
        return $lastActiveAt === null
            || $lastActiveAt->lt(now()->subMinutes(self::EVERY_MINUTES))
            || $lastActiveAt->setTimezone(TrainerSlots::TIMEZONE)->toDateString() !== now(TrainerSlots::TIMEZONE)->toDateString();
    }
}
