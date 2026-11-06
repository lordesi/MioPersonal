<?php

namespace App\Http\Middleware;

use App\Support\Stats;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Counts the pages people open (App\Support\Stats::recordPageView): only
 * pages that opened fine, both the first load and the Inertia navigations.
 * Not the forms sent, files, the sitemap or the errors.
 */
class TrackVisit
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->isMethod('GET') && $response->getStatusCode() === 200 && $this->isPage($response)) {
            Stats::recordPageView($request);
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
