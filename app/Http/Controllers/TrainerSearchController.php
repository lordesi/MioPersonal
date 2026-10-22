<?php

namespace App\Http\Controllers;

use App\Enums\PlaceType;
use App\Enums\TrainingGoal;
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
 *
 * Disciplines and goals can be more than one (?disciplina=crossfit,calisthenics):
 * the trainer must have all of them. When nobody matches, the page also gets
 * some similar profiles (see suggestions()).
 *
 * @phpstan-type Filters array{disciplina: list<string>, obiettivo: list<string>, modalita: string|null, disponibilita: string|null, prezzo: string|null, valutazione: string|null, domicilio: string|null, preferiti: string|null, ordina: string|null}
 */
class TrainerSearchController extends Controller
{
    private const PER_PAGE = 12;

    /** "Disponibilità": the first free slot must be at most this many days from today. */
    private const AVAILABILITY_DAYS = ['oggi' => 0, '3-giorni' => 2, 'settimana' => 6];

    /**
     * "Prezzo a seduta": [min, max] in cents, both included, null = no maximum.
     * The ranges don't overlap: 35 € is "Fino a 35 €", 50 € is "35–50 €".
     */
    private const PRICE_RANGES = [
        'fino-35' => [0, 3500],
        '35-50' => [3501, 5000],
        '50-75' => [5001, 7500],
        '75-100' => [7501, 10000],
        'oltre-100' => [10001, null],
    ];

    /**
     * "★ 3+ / 4+ / 4,5+": the minimum average in tenths of a star. PostgreSQL
     * compares the integer columns with integers only (4.5 would be an error).
     */
    private const RATING_MIN_TENTHS = ['3' => 30, '4' => 40, '4-5' => 45];

    /** The filters left out by the second step of suggestions(). */
    private const MINOR_FILTERS = ['disponibilita', 'prezzo', 'valutazione', 'domicilio', 'preferiti'];

    public function __invoke(Request $request, ?City $city = null): Response
    {
        // A city the team switched off is like a missing one.
        abort_if($city !== null && ! $city->is_active, 404);

        $disciplines = CatalogOptions::disciplines();
        $filters = $this->filters($request, array_column($disciplines, 'value'));

        // The client's saved trainers: for the full hearts and the "Preferiti" filter.
        $favoriteIds = TrainerCard::favoriteIds($request->user());

        $query = TrainerProfile::query()->published()->with(TrainerCard::RELATIONS);
        $this->filter($query, $filters, $city, $favoriteIds);
        $this->sort($query, $filters['ordina'], $city, $filters['modalita']);

        $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina');

        // A page after the last one (old link): show the last one.
        if ($page->currentPage() > $page->lastPage()) {
            $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina', $page->lastPage());
        }

        return Inertia::render('public/search', [
            'city' => $city === null ? null : ['slug' => $city->slug, 'name' => $city->name],
            'trainers' => $this->cards($page->getCollection(), $favoriteIds),
            'total' => $page->total(),
            'pagination' => ['currentPage' => $page->currentPage(), 'lastPage' => $page->lastPage()],
            'filters' => $filters,
            'suggestions' => $page->total() === 0 ? $this->suggestions($filters, $city, $favoriteIds) : null,
            'disciplines' => $disciplines,
            'cities' => CatalogOptions::cities(),
        ]);
    }

    /**
     * The filters in the URL. Unknown values are ignored instead of showing an error.
     *
     * @param  list<string>  $disciplineSlugs
     * @return Filters
     */
    private function filters(Request $request, array $disciplineSlugs): array
    {
        $allowed = [
            'modalita' => ['presenza', 'online'],
            'disponibilita' => array_keys(self::AVAILABILITY_DAYS),
            'prezzo' => array_keys(self::PRICE_RANGES),
            // PHP turns the keys '3' and '4' into numbers: back to text, like the URL.
            'valutazione' => array_map('strval', array_keys(self::RATING_MIN_TENTHS)),
            'domicilio' => ['1'],
            'preferiti' => ['1'],
            'ordina' => ['slot', 'prezzo', 'valutazione'],
        ];

        $filters = [
            'disciplina' => $this->listFilter($request, 'disciplina', $disciplineSlugs),
            'obiettivo' => $this->listFilter($request, 'obiettivo', array_column(TrainingGoal::cases(), 'value')),
        ];

        foreach ($allowed as $name => $values) {
            $value = $request->string($name)->value();
            $filters[$name] = in_array($value, $values, true) ? $value : null;
        }

        /** @var Filters $filters */
        return $filters;
    }

    /**
     * A filter with more values, separated by commas: "crossfit,calisthenics".
     * Only the allowed ones, once each, in the order of the URL.
     *
     * @param  list<string>  $allowed
     * @return list<string>
     */
    private function listFilter(Request $request, string $name, array $allowed): array
    {
        $value = $request->query($name);
        $values = is_string($value) ? explode(',', $value) : [];

        return array_values(array_unique(array_intersect($values, $allowed)));
    }

    /**
     * @param  Builder<TrainerProfile>  $query
     * @param  Filters  $filters
     * @param  list<int>  $favoriteIds
     * @param  bool  $matchAll  false = at least one of the disciplines and one of the goals (suggestions)
     */
    private function filter(Builder $query, array $filters, ?City $city, array $favoriteIds, bool $matchAll = true): void
    {
        $disciplines = $filters['disciplina'];
        $goals = $filters['obiettivo'];

        if ($disciplines !== []) {
            // All of them: among the chosen disciplines the trainer has as many as were chosen.
            $query->whereHas(
                'disciplines',
                fn (Builder $discipline) => $discipline->whereIn('slug', $disciplines),
                '>=',
                $matchAll ? count($disciplines) : 1,
            );
        }

        if ($goals !== []) {
            // One goal at a time (the tests' SQLite can't look for a whole list at once).
            $query->where(function (Builder $chosen) use ($goals, $matchAll) {
                foreach ($goals as $goal) {
                    $chosen->whereJsonContains('goals', $goal, $matchAll ? 'and' : 'or');
                }
            });
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
            $query->where('rating_count', '>', 0)->whereRaw('rating_sum * 10 >= ? * rating_count', [self::RATING_MIN_TENTHS[$filters['valutazione']]]);
        }

        if ($filters['domicilio'] !== null) {
            $query->whereHas('places', fn (Builder $place) => $place->where('type', PlaceType::Home));
        }

        // "Preferiti": only the saved trainers. Guests have none, so no results.
        if ($filters['preferiti'] !== null) {
            $query->whereIn('trainer_profiles.id', $favoriteIds);
        }
    }

    /**
     * No trainer matches every filter: up to 12 similar profiles, from the
     * closest. Each step leaves out more and the first one that finds
     * somebody wins; the city and the mode always stay.
     *  - some: at least one of the chosen disciplines and goals;
     *  - fewer-filters: like "some", without availability, price, rating, home and favorites;
     *  - city: every trainer of the city (or of Italy).
     * The trainers with more of the chosen disciplines and goals come first.
     *
     * @param  Filters  $filters
     * @param  list<int>  $favoriteIds
     * @return array{step: string, trainers: list<array<string, mixed>>}|null
     */
    private function suggestions(array $filters, ?City $city, array $favoriteIds): ?array
    {
        $fewer = $filters;

        foreach (self::MINOR_FILTERS as $name) {
            $fewer[$name] = null;
        }

        $steps = [
            'some' => count($filters['disciplina']) > 1 || count($filters['obiettivo']) > 1 ? $filters : null,
            'fewer-filters' => $fewer !== $filters ? $fewer : null,
            'city' => $filters['disciplina'] !== [] || $filters['obiettivo'] !== [] ? [...$fewer, 'disciplina' => [], 'obiettivo' => []] : null,
        ];

        foreach (array_filter($steps) as $step => $relaxed) {
            $query = TrainerProfile::query()->published();
            $this->filter($query, $relaxed, $city, $favoriteIds, matchAll: false);
            $this->sort($query, $relaxed['ordina'], $city, $relaxed['modalita']);

            $ids = $this->closestIds($query, $relaxed);

            if ($ids !== []) {
                // Loaded with everything the cards need, back in the order of $ids.
                $trainers = TrainerProfile::query()->with(TrainerCard::RELATIONS)->findMany($ids)
                    ->sortBy(fn (TrainerProfile $profile) => array_search($profile->id, $ids, true));

                return ['step' => $step, 'trainers' => $this->cards($trainers, $favoriteIds)];
            }
        }

        return null;
    }

    /**
     * The first 12 trainers of the query, those with more of the chosen
     * disciplines and goals first; with the same number, the query's order.
     * Counted here in PHP: only the id, the goals and the count are read.
     *
     * @param  Builder<TrainerProfile>  $query
     * @param  Filters  $filters
     * @return list<int>
     */
    private function closestIds(Builder $query, array $filters): array
    {
        $query->select(['trainer_profiles.id', 'trainer_profiles.goals'])
            ->withCount(['disciplines as matching_disciplines' => fn (Builder $discipline) => $discipline->whereIn('slug', $filters['disciplina'])]);

        // A discipline counts more than a goal (there are 5 goals at most).
        $points = fn (TrainerProfile $profile) => (int) $profile->getAttribute('matching_disciplines') * 10
            + count(array_intersect($profile->goals ?? [], $filters['obiettivo']));

        // PHP keeps the order of the trainers with the same points.
        return array_values($query->get()->sortByDesc($points)->take(self::PER_PAGE)->pluck('id')->all());
    }

    /**
     * The trainer cards, with the full heart for the trainers the client saved.
     *
     * @param  iterable<TrainerProfile>  $profiles
     * @param  list<int>  $favoriteIds
     * @return list<array<string, mixed>>
     */
    private function cards(iterable $profiles, array $favoriteIds): array
    {
        $cards = [];

        foreach ($profiles as $profile) {
            $cards[] = [...TrainerCard::from($profile), 'favorite' => in_array($profile->id, $favoriteIds, true)];
        }

        return $cards;
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
