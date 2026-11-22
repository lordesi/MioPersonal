<?php

namespace App\Http\Middleware;

use App\Support\Features;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A part of the site switched off (config/features.php) doesn't exist:
 * "Questa pagina non esiste (più)." on every page of it, e.g.
 * `->middleware('feature:gyms')`.
 */
class EnsureFeatureOn
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        abort_unless(Features::on($feature), 404);

        return $next($request);
    }
}
