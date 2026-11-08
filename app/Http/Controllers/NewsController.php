<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Support\CatalogOptions;
use App\Support\NewsFeed;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Novità": the trainers and gyms that joined MioPersonal in the last
 * NewsFeed::DAYS days, in Italy (/novita) or in a city (/novita/milano).
 */
class NewsController extends Controller
{
    /** The page shows at most this many of each. */
    private const LIMIT = 24;

    public function __invoke(Request $request, ?City $city = null): Response
    {
        // A city the team switched off is like a missing one.
        abort_if($city !== null && ! $city->is_active, 404);

        $place = $city === null ? 'in Italia' : "a {$city->name}";

        return Inertia::render('public/news', [
            'city' => $city === null ? null : ['slug' => $city->slug, 'name' => $city->name],
            'trainers' => NewsFeed::trainers($city, self::LIMIT, $request->user()),
            'gyms' => NewsFeed::gyms($city, self::LIMIT, $request->user()),
            'events' => NewsFeed::events($city, self::LIMIT),
            'cities' => CatalogOptions::cities(),
            'days' => NewsFeed::DAYS,
            'seo' => Seo::page(
                "Nuovi personal trainer e palestre {$place}",
                "Le novità di MioPersonal {$place}: i personal trainer e le palestre arrivati negli ultimi ".NewsFeed::DAYS.' giorni, verificati dal nostro team.',
                canonical: route('news', $city?->slug),
            ),
        ]);
    }
}
