<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Opens a group of pages only to some roles, e.g. `->middleware('role:trainer')`.
 * Anyone else is sent to their own area (UserRole::homeRoute) instead of an error page:
 * a client opening a trainer link by mistake lands on "Le mie prenotazioni".
 * Use it after `auth`. The admin panel keeps its own 403 (EnsureUserIsAdmin).
 */
class EnsureUserHasRole
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $role = $request->user()?->role;

        if ($role instanceof UserRole && ! in_array($role->value, $roles, true)) {
            return to_route($role->homeRoute());
        }

        return $next($request);
    }
}
