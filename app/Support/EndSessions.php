<?php

namespace App\Support;

use App\Http\Middleware\EnsureSessionCurrent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Logs a user out of their other devices: after a password change or reset,
 * or when Google takes over an account someone else may have made.
 *
 * Each session keeps the users.session_version it was opened with; raising it
 * ends every older session on its next request (EnsureSessionCurrent), with any
 * session driver: Redis in production, where there are no rows to delete. With
 * the database driver (local) the rows go too. A new remember_token makes every
 * "Ricordami" cookie useless.
 * (Laravel's logoutOtherDevices() needs the AuthenticateSession middleware and
 * a password, which accounts made with Google don't have.)
 */
class EndSessions
{
    /** Every session but the current one; the current "Ricordami" cookie keeps working. */
    public static function others(User $user, Request $request): void
    {
        $current = $request->hasSession() ? $request->session()->getId() : null;

        self::deleteRows($user, except: $current);
        self::revoke($user);

        if ($request->hasSession()) {
            EnsureSessionCurrent::stamp($request->session(), $user);
        }

        $guard = Auth::guard('web');

        if (method_exists($guard, 'getRecallerName') && $request->cookies->has($guard->getRecallerName())) {
            // A new cookie with the new token.
            $guard->login($user, remember: true);
        }
    }

    /** Every session: no device stays logged in. */
    public static function all(User $user): void
    {
        self::deleteRows($user);
        self::revoke($user);
    }

    private static function deleteRows(User $user, ?string $except = null): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        DB::connection(config('session.connection'))
            ->table(config()->string('session.table', 'sessions'))
            ->where('user_id', $user->getKey())
            ->when($except !== null, fn ($query) => $query->where('id', '!=', $except))
            ->delete();
    }

    /** A new session version and a new remember_token, saved together. */
    private static function revoke(User $user): void
    {
        $user->forceFill(['session_version' => (int) $user->session_version + 1]);
        $user->setRememberToken(Str::random(60));
        $user->save();
    }
}
