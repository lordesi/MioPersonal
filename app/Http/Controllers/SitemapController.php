<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Discipline;
use App\Models\TrainerProfile;
use Carbon\CarbonInterface;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

/**
 * /sitemap.xml: the pages search engines should know, the same ones the pages
 * mark as indexed (see the `seo` prop of TrainerSearchController and
 * TrainerProfileController). No page without trainers: the cities and the
 * "discipline in a city" pages with at least one trainer working there in
 * person, and the published profiles.
 *
 * Computed again at most once an hour.
 */
class SitemapController extends Controller
{
    public const CACHE_KEY = 'sitemap.xml';

    private const CACHE_SECONDS = 3600;

    public function __invoke(): Response
    {
        $xml = Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, fn () => view('sitemap', [
            'urls' => $this->urls(),
        ])->render());

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    /**
     * @return list<array{loc: string, lastmod: CarbonInterface|null}>
     */
    private function urls(): array
    {
        $profiles = TrainerProfile::query()
            ->published()
            ->with(['otherCities:id', 'disciplines:id,slug'])
            ->orderBy('id')
            ->get(['id', 'slug', 'city_id', 'updated_at']);

        $urls = [['loc' => route('home'), 'lastmod' => null]];

        if ($profiles->isEmpty()) {
            return $urls;
        }

        $activeCities = City::query()->active()->pluck('slug', 'id');
        $activeDisciplines = Discipline::query()->active()->pluck('slug', 'id');

        // Every discipline, and every city with its disciplines, that has a trainer.
        $disciplines = [];
        $cities = [];
        foreach ($profiles as $profile) {
            $slugs = $profile->disciplines->pluck('slug', 'id')->intersectByKeys($activeDisciplines)->values()->all();
            $disciplines = [...$disciplines, ...$slugs];

            foreach (array_filter([$profile->city_id, ...$profile->otherCities->pluck('id')->all()]) as $cityId) {
                if (isset($activeCities[$cityId])) {
                    $cities[$activeCities[$cityId]] = [...$cities[$activeCities[$cityId]] ?? [], ...$slugs];
                }
            }
        }

        $urls[] = ['loc' => route('trainers.search'), 'lastmod' => null];
        foreach (array_unique($disciplines) as $discipline) {
            $urls[] = ['loc' => route('trainers.search', ['disciplina' => $discipline]), 'lastmod' => null];
        }

        ksort($cities);
        foreach ($cities as $city => $cityDisciplines) {
            $urls[] = ['loc' => route('trainers.search', $city), 'lastmod' => null];
            foreach (array_unique($cityDisciplines) as $discipline) {
                $urls[] = ['loc' => route('trainers.search', [$city, 'disciplina' => $discipline]), 'lastmod' => null];
            }
        }

        foreach ($profiles as $profile) {
            $urls[] = ['loc' => route('trainers.show', $profile->slug), 'lastmod' => $profile->updated_at];
        }

        return $urls;
    }
}
