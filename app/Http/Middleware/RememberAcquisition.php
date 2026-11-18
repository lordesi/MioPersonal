<?php

namespace App\Http\Middleware;

use App\Support\Stats;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * On the first page of a session, keeps in the session the channel the visit
 * came from (Stats::rememberAcquisition), for whoever signs up later. Only
 * pages that opened fine: not the forms sent, files, the sitemap or the errors.
 * The visits themselves are counted by Cloudflare Web Analytics.
 */
class RememberAcquisition
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->isMethod('GET') && $response->getStatusCode() === 200 && $this->isPage($response)) {
            Stats::rememberAcquisition($request);
        }

        return $response;
    }

    private function isPage(Response $response): bool
    {
        // The answer decides, not the request: an Inertia page, or an HTML page.
        return $response->headers->has('X-Inertia')
            || str_starts_with((string) $response->headers->get('Content-Type'), 'text/html');
    }
}
