<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Symfony\Component\HttpFoundation\Response;

/**
 * A limit per IP on the forms that create accounts or send "Reimposta la
 * password": each one emails an address typed by whoever fills it in.
 *
 * Fortify registers its routes (register.store, password.email) without a
 * throttle, so the limit is applied here, by route name: it works with
 * route:cache too. The limiters are in AppServiceProvider::configureRateLimiting.
 */
class ThrottleSignups
{
    /** Route name => named rate limiter. */
    private const LIMITERS = [
        'register.store' => 'signups',
        'trainer.register.store' => 'signups',
        'google.register.store' => 'signups',
        'password.email' => 'password-reset-links',
    ];

    public function __construct(private ThrottleRequests $throttle) {}

    public function handle(Request $request, Closure $next): Response
    {
        $limiter = $request->isMethod('POST') ? self::LIMITERS[$request->route()?->getName()] ?? null : null;

        if ($limiter === null) {
            return $next($request);
        }

        return $this->throttle->handle($request, $next, $limiter);
    }
}
