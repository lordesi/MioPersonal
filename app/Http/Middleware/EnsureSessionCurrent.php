<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Session\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ends a session opened before App\Support\EndSessions raised the user's
 * session_version (a password change or reset, Google taking over an account):
 * the other devices go back to the login on their next request.
 *
 * The version is written in the session at every login (AppServiceProvider,
 * Login event). A session without it counts as version 0, the starting value:
 * the sessions opened before this check existed end too, at the first revoke.
 */
class EnsureSessionCurrent
{
    public const KEY = 'session_version';

    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user !== null && $request->hasSession()
            && (int) $request->session()->get(self::KEY, 0) !== (int) $user->session_version) {
            Auth::guard('web')->logoutCurrentDevice();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw new AuthenticationException('Unauthenticated.', ['web'], route('login'));
        }

        return $next($request);
    }

    /** The session is the user's current one. */
    public static function stamp(Session $session, User $user): void
    {
        $session->put(self::KEY, (int) $user->session_version);
    }
}
