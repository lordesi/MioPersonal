<?php

namespace App\Http\Middleware;

use App\Models\GymProfile;
use App\Models\TrainerProfile;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A link from before the usernames ("/trainer/giulia-rossi-2"), on a QR code
 * or a story already shared: 301 to the same page with the current username,
 * the query string included. Unknown links go on to the usual 404.
 *
 * Use: ->middleware('legacy-slug:trainer') or 'legacy-slug:gym'.
 */
class RedirectLegacySlug
{
    public function handle(Request $request, Closure $next, string $type): Response
    {
        $route = $request->route();
        $slug = $route->parameter('slug');
        $model = $type === 'gym' ? GymProfile::class : TrainerProfile::class;

        if (is_string($slug) && ! $model::query()->where('slug', $slug)->exists() && ($current = $model::currentSlug($slug)) !== null) {
            $url = route($route->getName(), [...$route->parameters(), 'slug' => $current]);
            $query = $request->getQueryString();

            return redirect($query === null ? $url : "{$url}?{$query}", 301);
        }

        return $next($request);
    }
}
