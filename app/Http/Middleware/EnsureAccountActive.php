<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * On every page: a suspended account, or one the team is deleting, is logged
 * out at once (also with a session already open or "Ricordami"). Who asked to
 * delete their own account can only see "Account in eliminazione", to take it
 * back or log out.
 */
class EnsureAccountActive
{
    /** Where a pending self-deletion can still go. */
    private const DELETION_ROUTES = ['account.deletion', 'account.deletion.cancel', 'logout'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $next($request);
        }

        if ($user->isBlocked()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors(['email' => self::blockedMessage($user)]);
        }

        if ($user->hasPendingSelfDeletion() && ! $request->routeIs(...self::DELETION_ROUTES)) {
            return redirect()->route('account.deletion');
        }

        return $next($request);
    }

    /** Also the login error (FortifyServiceProvider). */
    public static function blockedMessage(User $user): string
    {
        $contact = config('mail.contact_address');

        return $user->suspended_at !== null
            ? "Il tuo account è sospeso. Per informazioni scrivi a {$contact}."
            : "Il tuo account è in eliminazione. Per informazioni scrivi a {$contact}.";
    }
}
