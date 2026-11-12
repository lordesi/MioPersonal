<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Discipline;
use App\Models\GroupSession;
use App\Models\GymProfile;
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

        $gymUrls = $this->gymUrls();
        $urls = [['loc' => route('home'), 'lastmod' => null]];

        // The pages on MioPersonal itself: what it is, how to reach us, how to join.
        foreach (['how-it-works', 'contact.show', 'trainer.register', 'gym.register'] as $page) {
            $urls[] = ['loc' => route($page), 'lastmod' => null];
        }

        // "Novità" of all of Italy, once there is someone: the city pages are often empty, not listed.
        if ($profiles->isNotEmpty() || $gymUrls !== []) {
            $urls[] = ['loc' => route('news'), 'lastmod' => null];
        }

        $urls = [...$urls, ...$gymUrls, ...$this->eventUrls()];

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

    /**
     * "Eventi" (Italy and every city with an event) and the events to come.
     *
     * @return list<array{loc: string, lastmod: CarbonInterface|null}>
     */
    private function eventUrls(): array
    {
        $events = GroupSession::query()
            ->listed()
            ->upcoming()
            ->with('city:id,slug,is_active')
            ->orderBy('starts_at')
            ->limit(1000)
            ->get(['id', 'slug', 'city_id', 'updated_at']);

        if ($events->isEmpty()) {
            return [];
        }

        $urls = [['loc' => route('events.search'), 'lastmod' => null]];

        foreach ($events->filter(fn (GroupSession $event) => $event->city !== null && $event->city->is_active)->pluck('city.slug')->unique()->sort() as $city) {
            $urls[] = ['loc' => route('events.search', $city), 'lastmod' => null];
        }

        foreach ($events as $event) {
            $urls[] = ['loc' => route('events.show', $event->slug), 'lastmod' => $event->updated_at];
        }

        return $urls;
    }

    /**
     * The gyms' search (Italy and every city with a gym) and the published gyms.
     *
     * @return list<array{loc: string, lastmod: CarbonInterface|null}>
     */
    private function gymUrls(): array
    {
        $gyms = GymProfile::query()
            ->published()
            ->whereHas('city', fn ($city) => $city->active())
            ->with('city:id,slug')
            ->orderBy('id')
            ->get(['id', 'slug', 'city_id', 'updated_at']);

        if ($gyms->isEmpty()) {
            return [];
        }

        $urls = [['loc' => route('gyms.search'), 'lastmod' => null]];

        foreach ($gyms->pluck('city.slug')->unique()->sort() as $city) {
            $urls[] = ['loc' => route('gyms.search', $city), 'lastmod' => null];
        }

        foreach ($gyms as $gym) {
            $urls[] = ['loc' => route('gyms.show', $gym->slug), 'lastmod' => $gym->updated_at];
        }

        return $urls;
    }
}
