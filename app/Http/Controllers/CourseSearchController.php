<?php

namespace App\Http\Controllers;

use App\Enums\CourseLevel;
use App\Models\City;
use App\Models\Discipline;
use App\Models\GymCourse;
use App\Support\CatalogOptions;
use App\Support\CourseCard;
use App\Support\Seo;
use App\Support\Stats;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Corsi a {città}": /corsi/milano, or /corsi for the whole of Italy. The
 * active courses with at least one weekly lesson of the gyms in the search;
 * same shape as GymSearchController.
 *
 * "Giorno" (?giorno=lun) and "Fascia" (?fascia=sera) look at the same lesson:
 * a course matches when one of its lessons is on that day in that time.
 *
 * @phpstan-type Filters array{disciplina: string|null, giorno: string|null, fascia: string|null, livello: string|null}
 */
class CourseSearchController extends Controller
{
    private const PER_PAGE = 12;

    /** ?giorno=: ISO weekday of the lessons. */
    public const DAYS = ['lun' => 1, 'mar' => 2, 'mer' => 3, 'gio' => 4, 'ven' => 5, 'sab' => 6, 'dom' => 7];

    /** ?fascia=: the start of a lesson, [from, to) in "HH:MM:SS". */
    public const TIMES = [
        'mattina' => ['00:00:00', '12:00:00'],
        'pranzo' => ['12:00:00', '15:00:00'],
        'pomeriggio' => ['15:00:00', '18:00:00'],
        'sera' => ['18:00:00', '24:00:00'],
    ];

    public function __invoke(Request $request, ?City $city = null): Response
    {
        abort_if($city !== null && ! $city->is_active, 404);

        $filters = $this->filters($request);
        $query = GymCourse::query()->with(CourseCard::RELATIONS);
        $this->filter($query, $filters, $city);
        // The courses with more lessons first, then the newest.
        $query->withCount('lessons')->orderByDesc('lessons_count')->orderByDesc('gym_courses.id');

        $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina');

        if ($page->currentPage() > $page->lastPage()) {
            $page = $query->paginate(self::PER_PAGE, ['*'], 'pagina', $page->lastPage());
        }

        if ($page->currentPage() === 1) {
            Stats::recordSearch(
                $request,
                $city,
                array_filter([$filters['disciplina']]),
                [],
                array_keys(array_filter($filters, fn ($value, $name) => $value !== null && $name !== 'disciplina', ARRAY_FILTER_USE_BOTH)),
                $page->total(),
                'course',
            );
        }

        return Inertia::render('public/course-search', [
            'city' => $city === null ? null : ['slug' => $city->slug, 'name' => $city->name],
            // Merged: "Carica altri corsi" (phones) adds the next page below.
            'courses' => Inertia::merge(CourseCard::many($page->getCollection())),
            'total' => $page->total(),
            'pagination' => ['currentPage' => $page->currentPage(), 'lastPage' => $page->lastPage()],
            'filters' => $filters,
            // Nothing found with the filters: the other courses here.
            'suggestions' => $page->total() === 0 && array_filter($filters) !== [] ? $this->suggestions($city) : [],
            'disciplines' => CatalogOptions::disciplines(),
            'levels' => CourseLevel::options(),
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
        $pick = fn (string $name, array $allowed) => in_array($value = (string) $request->query($name, ''), $allowed, true) ? $value : null;
        $discipline = (string) $request->query('disciplina', '');

        return [
            'disciplina' => $discipline !== '' && Discipline::query()->active()->where('slug', $discipline)->exists() ? $discipline : null,
            'giorno' => $pick('giorno', array_keys(self::DAYS)),
            'fascia' => $pick('fascia', array_keys(self::TIMES)),
            'livello' => $pick('livello', array_column(CourseLevel::options(), 'value')),
        ];
    }

    /**
     * @param  Builder<GymCourse>  $query
     * @param  Filters  $filters
     */
    private function filter(Builder $query, array $filters, ?City $city): void
    {
        $query->where('is_active', true)
            ->whereHas('gymProfile', fn (Builder $gym) => $gym->published()
                ->when($city !== null, fn (Builder $here) => $here->where('city_id', $city?->id)))
            ->whereHas('lessons', function (Builder $lesson) use ($filters) {
                if ($filters['giorno'] !== null) {
                    $lesson->where('weekday', self::DAYS[$filters['giorno']]);
                }

                if ($filters['fascia'] !== null) {
                    [$from, $to] = self::TIMES[$filters['fascia']];
                    $lesson->where('starts_at', '>=', $from)->where('starts_at', '<', $to);
                }
            });

        if ($filters['disciplina'] !== null) {
            $query->whereHas('discipline', fn (Builder $discipline) => $discipline->where('slug', $filters['disciplina']));
        }

        if ($filters['livello'] !== null) {
            $query->where('level', $filters['livello']);
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function suggestions(?City $city): array
    {
        $query = GymCourse::query()->with(CourseCard::RELATIONS);
        $this->filter($query, ['disciplina' => null, 'giorno' => null, 'fascia' => null, 'livello' => null], $city);

        return CourseCard::many($query->orderByDesc('gym_courses.id')->limit(self::PER_PAGE)->get());
    }

    /**
     * Indexed: Italy or a city without filters, when there are courses.
     *
     * @param  Filters  $filters
     * @param  LengthAwarePaginator<int, GymCourse>  $page
     * @return array<string, mixed>
     */
    private function seo(array $filters, ?City $city, LengthAwarePaginator $page): array
    {
        $indexable = $page->total() > 0 && array_filter($filters) === [];
        $place = $city === null ? 'in Italia' : "a {$city->name}";
        $title = "Corsi in palestra {$place}";
        $total = $page->total();
        $count = $total === 1 ? '1 corso' : "{$total} corsi";
        $description = $total === 0
            ? "Cerca corsi in palestra {$place} su MioPersonal: pilates, yoga, spinning, functional e altro, con orari e istruttori."
            : "{$count} in palestra {$place}: orari della settimana, livello e istruttore. Chiedi alla palestra per iscriverti.";

        $listUrl = route('courses.search', $city?->slug);
        $crumbs = ['Home' => route('home'), 'Corsi' => route('courses.search')];
        if ($city !== null) {
            $crumbs["Corsi a {$city->name}"] = $listUrl;
        }

        return Seo::page(
            title: $page->currentPage() > 1 ? "{$title} (pagina {$page->currentPage()})" : $title,
            description: $description,
            index: $indexable,
            canonical: $listUrl.($page->currentPage() > 1 ? '?pagina='.$page->currentPage() : ''),
            jsonLd: [Seo::breadcrumbs($crumbs)],
        );
    }
}
