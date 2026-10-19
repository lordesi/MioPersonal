<?php

namespace App\Http\Controllers;

use App\Enums\PlaceType;
use App\Models\City;
use App\Models\TrainerProfile;
use App\Support\CatalogOptions;
use App\Support\TrainerCard;
use App\Support\TrainerSlots;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Personal trainer a {città}": /personal-trainer/roma, or /personal-trainer
 * for the whole of Italy. Only approved profiles shown in the search; online-only
 * trainers show up in every city. One query on `trainer_profiles` and its
 * computed fields (see docs/database/analisi.md §4.1).
 */
class TrainerSearchController extends Controller
{
    private const PER_PAGE = 12;

    /** "Disponibilità": the first free slot must be at most this many days from today. */
    private const AVAILABILITY_DAYS = ['oggi' => 0, '3-giorni' => 2, 'settimana' => 6];

    /** "Prezzo a seduta": [min, max] in cents, null = no maximum. */
    private const PRICE_RANGES = [
        'fino-35' => [0, 3500],
        '35-45' => [3500, 4500],
        '45-60' => [4500, 6000],
        'oltre-60' => [6001, null],
    ];

    /**
     * "★ 4,5 e più", in tenths of a star: PostgreSQL compares the integer
     * columns with integers only (4.5 would be an error).
     */
    private const MIN_TOP_RATING_TENTHS = 45;

    public function __invoke(Request $request, ?City $city = null): Response
    {
        // A city the team switched off is like a missing one.
        abort_if($city !== null && ! $city->is_active, 404);

        $disciplines = CatalogOptions::disciplines();
        $filters = $this->filters($request, array_column($disciplines, 'value'));

        $query = TrainerProfile::query()->published()->with(TrainerCard::RELATIONS);
        $this->filter($query, $filters, $city);
        $this->sort($query, $filters['ordina'], $city, $filters['modalita']);

        $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina');

        // A page after the last one (old link): show the last one.
        if ($page->currentPage() > $page->lastPage()) {
            $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina', $page->lastPage());
        }

        $favoriteIds = TrainerCard::favoriteIds($request->user());

        return Inertia::render('public/search', [
            'city' => $city === null ? null : ['slug' => $city->slug, 'name' => $city->name],
            'trainers' => $page->getCollection()->map(fn (TrainerProfile $profile) => [
                ...TrainerCard::from($profile),
                // The heart is full for the trainers the client saved.
                'favorite' => in_array($profile->id, $favoriteIds, true),
            ])->values()->all(),
            'total' => $page->total(),
            'pagination' => ['currentPage' => $page->currentPage(), 'lastPage' => $page->lastPage()],
            'filters' => $filters,
            'disciplines' => $disciplines,
            'cities' => CatalogOptions::cities(),
        ]);
    }

    /**
     * The filters in the URL. Unknown values are ignored instead of showing an error.
     *
     * @param  list<string>  $disciplineSlugs
     * @return array<string, string|null>
     */
    private function filters(Request $request, array $disciplineSlugs): array
    {
        $allowed = [
            'disciplina' => $disciplineSlugs,
            'modalita' => ['presenza', 'online'],
            'disponibilita' => array_keys(self::AVAILABILITY_DAYS),
            'prezzo' => array_keys(self::PRICE_RANGES),
            'valutazione' => ['4-5'],
            'domicilio' => ['1'],
            'ordina' => ['slot', 'prezzo', 'valutazione'],
        ];

        $filters = [];

        foreach ($allowed as $name => $values) {
            $value = $request->string($name)->value();
            $filters[$name] = in_array($value, $values, true) ? $value : null;
        }

        return $filters;
    }

    /**
     * @param  Builder<TrainerProfile>  $query
     * @param  array<string, string|null>  $filters
     */
    private function filter(Builder $query, array $filters, ?City $city): void
    {
        if ($filters['disciplina'] !== null) {
            $query->whereHas('disciplines', fn (Builder $discipline) => $discipline->where('slug', $filters['disciplina']));
        }

        // Online sessions work from anywhere: the city only counts in person.
        if ($city !== null && $filters['modalita'] !== 'online') {
            $query->where(fn (Builder $inCity) => $inCity
                ->where('city_id', $city->id)
                ->orWhereHas('otherCities', fn (Builder $other) => $other->whereKey($city->id))
                ->orWhere(fn (Builder $onlineOnly) => $onlineOnly->where('trains_online', true)->where('trains_in_person', false)));
        }

        match ($filters['modalita']) {
            'presenza' => $query->where('trains_in_person', true),
            'online' => $query->where('trains_online', true),
            default => null,
        };

        if ($filters['disponibilita'] !== null) {
            $lastDay = now(TrainerSlots::TIMEZONE)->startOfDay()->addDays(self::AVAILABILITY_DAYS[$filters['disponibilita']])->endOfDay();
            $query->whereNotNull('next_free_slot_at')->where('next_free_slot_at', '<=', $lastDay->utc());
        }

        if ($filters['prezzo'] !== null) {
            [$min, $max] = self::PRICE_RANGES[$filters['prezzo']];
            $query->where('price_from_cents', '>=', $min)
                ->when($max !== null, fn (Builder $price) => $price->where('price_from_cents', '<=', $max));
        }

        if ($filters['valutazione'] !== null) {
            // The average is rating_sum / rating_count: compared without dividing, in tenths.
            $query->where('rating_count', '>', 0)->whereRaw('rating_sum * 10 >= ? * rating_count', [self::MIN_TOP_RATING_TENTHS]);
        }

        if ($filters['domicilio'] !== null) {
            $query->whereHas('places', fn (Builder $place) => $place->where('type', PlaceType::Home));
        }
    }

    /**
     * "Più pertinenti" (no sort): in a city, its own trainers before the online-only
     * ones, then the most reviewed. Trainers without free slots go last.
     *
     * @param  Builder<TrainerProfile>  $query
     */
    private function sort(Builder $query, ?string $sort, ?City $city, ?string $mode): void
    {
        match ($sort) {
            'slot' => $query->orderByRaw('next_free_slot_at is null')->orderBy('next_free_slot_at'),
            'prezzo' => $query->orderBy('price_from_cents'),
            'valutazione' => $query->orderByRaw('case when rating_count = 0 then 0 else rating_sum * 1.0 / rating_count end desc'),
            default => $city !== null && $mode !== 'online'
                ? $query->orderByRaw('case when trains_in_person then 0 else 1 end')->orderByDesc('rating_count')
                : $query->orderByDesc('rating_count'),
        };

        $query->orderBy('id');
    }
}
