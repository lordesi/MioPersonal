<?php

namespace App\Http\Controllers;

use App\Support\Stats;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * A page prefetched by Inertia (the pointer on a link) was shown: the
 * browser sends back its `pendingVisit` token (resources/js/lib/prefetch.ts)
 * and the views and searches of that page are counted now (Stats::record()).
 */
class PendingVisitController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $token = $request->input('token');

        if (is_string($token) && strlen($token) <= 4096) {
            Stats::recordPending($request, $token);
        }

        // Nothing to show either way: an old or reused token is just not counted.
        return response()->noContent();
    }
}
