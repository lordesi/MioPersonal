<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security headers on every page:
 * - no other site can show ours in a frame (clickjacking: an invisible frame
 *   that makes the user click "Annulla prenotazione" or "Elimina account");
 * - the browser doesn't guess file types, and other sites get only our domain
 *   as referrer, not the full address;
 * - camera and microphone off; the position only for us (lib/geo.ts, "vicino a me");
 * - pages of logged-in users are never cached (by the browser or a CDN);
 * - in production over HTTPS, the browser keeps using HTTPS (HSTS).
 *
 * A full Content-Security-Policy is for later: it has to be tried with Vite and SSR.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $headers = $response->headers;

        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('Content-Security-Policy', "frame-ancestors 'none'");
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()');

        if ($request->user() !== null) {
            $headers->set('Cache-Control', 'no-store, private');
        }

        if (app()->isProduction() && $request->isSecure()) {
            $headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }
}
