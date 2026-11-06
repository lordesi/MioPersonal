<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Logs a user out of their other devices: after a password change or reset,
 * or when Google takes over an account someone else may have made.
 *
 * Sessions live in the database (config/session.php), so their rows are
 * deleted; a new remember_token makes every "Ricordami" cookie useless.
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
        self::newRememberToken($user);

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
        self::newRememberToken($user);
    }

    private static function deleteRows(User $user, ?string $except = null): void
    {
        DB::connection(config('session.connection'))
            ->table(config()->string('session.table', 'sessions'))
            ->where('user_id', $user->getKey())
            ->when($except !== null, fn ($query) => $query->where('id', '!=', $except))
            ->delete();
    }

    private static function newRememberToken(User $user): void
    {
        $user->setRememberToken(Str::random(60));
        $user->save();
    }
}
