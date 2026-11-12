<?php

namespace App\Http\Controllers;

use App\Enums\GymAmenity;
use App\Models\City;
use App\Models\GymProfile;
use App\Support\CatalogOptions;
use App\Support\GymCard;
use App\Support\Seo;
use App\Support\Stats;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Palestre a {città}": /palestre/milano, or /palestre for the whole of
 * Italy. Only approved gyms shown in the search; same shape as
 * TrainerSearchController (see docs/database/analisi.md §4.1).
 *
 * "Servizi" can be more than one (?servizi=piscina,sauna): the gym must have
 * all of them. "Budget mensile" reads the cheapest plan over one month.
 *
 * "Preferiti" (?preferiti=1): only the gyms the client saved.
 *
 * @phpstan-type Filters array{nome: string|null, servizi: list<string>, prezzo: string|null, promo: string|null, preferiti: string|null, ordina: string|null}
 */
class GymSearchController extends Controller
{
    private const PER_PAGE = 12;

    /** "Budget mensile": [min, max] in cents, both included, null = no maximum. */
    public const PRICE_RANGES = [
        'fino-30' => [0, 3000],
        '30-50' => [3001, 5000],
        '50-80' => [5001, 8000],
        'oltre-80' => [8001, null],
    ];

    private const SORTS = ['prezzo', 'trainer'];

    private const NAME_MAX_LENGTH = 100;

    public function __invoke(Request $request, ?City $city = null): Response
    {
        abort_if($city !== null && ! $city->is_active, 404);

        $filters = $this->filters($request);
        $favoriteIds = GymCard::favoriteIds($request->user());

        $query = GymProfile::query()->published()->with(GymCard::RELATIONS)->withCount('trainers');
        $this->filter($query, $filters, $city, $favoriteIds);
        $this->sort($query, $filters['ordina']);

        $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina');

        if ($page->currentPage() > $page->lastPage()) {
            $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina', $page->lastPage());
        }

        if ($page->currentPage() === 1) {
            Stats::recordSearch(
                $request,
                $city,
                [],
                [],
                array_keys(array_filter(Arr::except($filters, ['servizi']), fn ($value) => $value !== null)),
                $page->total(),
                'gym',
            );
        }

        return Inertia::render('public/gym-search', [
            'city' => $city === null ? null : ['slug' => $city->slug, 'name' => $city->name],
            // Merged: "Carica altre palestre" (phones) adds the next page below.
            'gyms' => Inertia::merge(GymCard::many($page->getCollection(), $favoriteIds)),
            'total' => $page->total(),
            'pagination' => ['currentPage' => $page->currentPage(), 'lastPage' => $page->lastPage()],
            'filters' => $filters,
            'suggestions' => $page->total() === 0 ? $this->suggestions($filters, $city, $favoriteIds) : null,
            'amenities' => GymAmenity::options(),
            'cities' => CatalogOptions::citiesWithCoordinates(),
            'seo' => $this->seo($filters, $city, $page),
        ]);
    }

    /**
     * The filters of the URL; unknown values are dropped.
     *
     * @return Filters
     */
    private function filters(Request $request): array
    {
        $amenities = array_column(GymAmenity::options(), 'value');
        $list = fn (string $name) => array_values(array_unique(array_intersect(
            array_filter(explode(',', (string) $request->query($name, ''))),
            $amenities,
        )));
        $name = trim(mb_substr((string) $request->query('nome', ''), 0, self::NAME_MAX_LENGTH));
        $price = (string) $request->query('prezzo', '');
        $sort = (string) $request->query('ordina', '');

        return [
            'nome' => $name === '' ? null : $name,
            'servizi' => $list('servizi'),
            'prezzo' => array_key_exists($price, self::PRICE_RANGES) ? $price : null,
            'promo' => $request->query('promo') === '1' ? '1' : null,
            'preferiti' => $request->query('preferiti') === '1' ? '1' : null,
            'ordina' => in_array($sort, self::SORTS, true) ? $sort : null,
        ];
    }

    /**
     * @param  Builder<GymProfile>  $query
     * @param  Filters  $filters
     * @param  list<int>  $favoriteIds
     */
    private function filter(Builder $query, array $filters, ?City $city, array $favoriteIds): void
    {
        if ($city !== null) {
            $query->where('city_id', $city->id);
        }

        if ($filters['nome'] !== null) {
            foreach (preg_split('/\s+/', mb_strtolower($filters['nome'])) ?: [] as $word) {
                $query->whereRaw("lower(name) like ? escape '\\'", ['%'.addcslashes($word, '%_\\').'%']);
            }
        }

        foreach ($filters['servizi'] as $amenity) {
            $query->whereJsonContains('amenities', $amenity);
        }

        if ($filters['prezzo'] !== null) {
            [$min, $max] = self::PRICE_RANGES[$filters['prezzo']];
            $query->where('monthly_from_cents', '>=', $min)
                ->when($max !== null, fn (Builder $price) => $price->where('monthly_from_cents', '<=', $max));
        }

        if ($filters['promo'] !== null) {
            $query->whereHas('activePromotions');
        }

        if ($filters['preferiti'] !== null) {
            $query->whereIn('gym_profiles.id', $favoriteIds);
        }
    }

    /**
     * Default: with a cover first, then the gyms with more trainers, then the
     * newest. "Prezzo": the cheapest monthly price first, gyms without plans last.
     *
     * @param  Builder<GymProfile>  $query
     */
    private function sort(Builder $query, ?string $sort): void
    {
        match ($sort) {
            'prezzo' => $query->orderByRaw('monthly_from_cents IS NULL')->orderBy('monthly_from_cents'),
            'trainer' => $query->orderByDesc('trainers_count'),
            default => $query
                ->orderByDesc(DB::table('gym_photos')->selectRaw('count(*)')
                    ->whereColumn('gym_photos.gym_profile_id', 'gym_profiles.id')->where('is_cover', true))
                ->orderByDesc('trainers_count'),
        };

        $query->orderByDesc('gym_profiles.id');
    }

    /**
     * No gym matches: first without name, budget and promotions, then every
     * gym of the city (or of Italy). The first step that finds some wins.
     *
     * @param  Filters  $filters
     * @param  list<int>  $favoriteIds
     * @return array{step: string, gyms: list<array<string, mixed>>}|null
     */
    private function suggestions(array $filters, ?City $city, array $favoriteIds): ?array
    {
        $fewer = [...$filters, 'nome' => null, 'prezzo' => null, 'promo' => null, 'preferiti' => null];
        $steps = [
            'fewer-filters' => $fewer !== $filters ? $fewer : null,
            'city' => $filters['servizi'] !== [] ? [...$fewer, 'servizi' => []] : null,
        ];

        foreach (array_filter($steps) as $step => $relaxed) {
            $query = GymProfile::query()->published()->with(GymCard::RELATIONS)->withCount('trainers');
            $this->filter($query, $relaxed, $city, $favoriteIds);
            $this->sort($query, $relaxed['ordina']);
            $gyms = $query->limit(self::PER_PAGE)->get();

            if ($gyms->isNotEmpty()) {
                return ['step' => $step, 'gyms' => GymCard::many($gyms, $favoriteIds)];
            }
        }

        return null;
    }

    /**
     * Indexed: Italy or a city without filters, when there are gyms.
     *
     * @param  Filters  $filters
     * @param  LengthAwarePaginator<int, GymProfile>  $page
     * @return array<string, mixed>
     */
    private function seo(array $filters, ?City $city, LengthAwarePaginator $page): array
    {
        $active = array_filter($filters, fn ($value) => $value !== null && $value !== []);
        $indexable = $page->total() > 0 && $active === [];
        $place = $city === null ? 'in Italia' : "a {$city->name}";
        $title = "Palestre {$place}";
        $total = $page->total();
        $count = $total === 1 ? '1 palestra' : "{$total} palestre";
        $description = $total === 0
            ? "Cerca palestre {$place} su MioPersonal: servizi, orari, abbonamenti, promozioni e personal trainer."
            : "{$count} {$place}: confronta servizi, orari, abbonamenti e promozioni e trova i personal trainer che allenano lì.";

        $listUrl = route('gyms.search', $city?->slug);
        $canonical = $listUrl.($page->currentPage() > 1 ? '?pagina='.$page->currentPage() : '');

        $crumbs = ['Home' => route('home'), 'Palestre' => route('gyms.search')];
        if ($city !== null) {
            $crumbs["Palestre a {$city->name}"] = $listUrl;
        }

        $jsonLd = [Seo::breadcrumbs($crumbs)];
        if ($indexable) {
            $jsonLd[] = [
                '@type' => 'ItemList',
                'itemListElement' => array_values($page->getCollection()->map(fn (GymProfile $gym, int $index) => [
                    '@type' => 'ListItem',
                    'position' => ($page->currentPage() - 1) * $page->perPage() + $index + 1,
                    'url' => route('gyms.show', $gym->slug),
                    'name' => $gym->name,
                ])->all()),
            ];
        }

        return Seo::page(
            title: $page->currentPage() > 1 ? "{$title} (pagina {$page->currentPage()})" : $title,
            description: $description,
            index: $indexable,
            canonical: $canonical,
            jsonLd: $jsonLd,
        );
    }
}
