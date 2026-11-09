<?php

namespace App\Http\Middleware;

use App\Support\Staging;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only on the staging site: asks for a user and password (STAGING_USER,
 * STAGING_PASSWORD in the .env) and tells search engines to stay away. Without
 * the credentials set, the site stays closed instead of open.
 * Does nothing on the real site and in local.
 */
class ProtectStaging
{
    public function handle(Request $request, Closure $next): Response
    {
        // The health check (/up) of the server must keep working without a password.
        if (! Staging::active() || $request->is('up')) {
            return $next($request);
        }

        $user = (string) config('app.staging_user');
        $password = (string) config('app.staging_password');

        if ($user === '' || $password === '') {
            return response('Staging chiuso: imposta STAGING_USER e STAGING_PASSWORD.', 503);
        }

        $given = hash_equals($user, (string) $request->getUser()) & hash_equals($password, (string) $request->getPassword());

        $response = $given
            ? $next($request)
            : response('Accesso riservato.', 401, ['WWW-Authenticate' => 'Basic realm="MioPersonal staging"']);

        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');

        return $response;
    }
}
