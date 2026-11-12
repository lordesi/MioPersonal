<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Accounts from before the usernames got one automatically: at the first
 * page they open, they confirm it (or pick another) once, then it is locked.
 * Only pages are redirected: forms and JSON calls go on as usual.
 */
class EnsureUsernameChosen
{
    /** Where an account without a confirmed username can still go. */
    private const ALLOWED_ROUTES = ['username.*', 'logout', 'verification.*', 'account.deletion*'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User
            || $user->hasChosenUsername()
            || ! $request->isMethod('GET')
            || $request->expectsJson()
            || $request->routeIs(...self::ALLOWED_ROUTES)) {
            return $next($request);
        }

        // Back to this page after "Conferma username".
        redirect()->setIntendedUrl($request->fullUrl());

        return redirect()->route('username.show');
    }
}
