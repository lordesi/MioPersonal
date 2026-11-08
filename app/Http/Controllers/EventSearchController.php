<?php

namespace App\Http\Controllers;

use App\Enums\GroupSessionPlace;
use App\Enums\GroupSessionType;
use App\Models\City;
use App\Models\Discipline;
use App\Models\GroupSession;
use App\Support\CatalogOptions;
use App\Support\GroupSessionCard;
use App\Support\Seo;
use App\Support\TrainerSlots;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Eventi": the next events of trainers and gyms, in Italy (/eventi) or in a
 * city (/eventi/milano, with the online ones), soonest first. Filters in the
 * query: quando (oggi, weekend, settimana, mese), tipo, disciplina.
 */
class EventSearchController extends Controller
{
    public const WHEN = ['oggi', 'weekend', 'settimana', 'mese'];

    private const LIMIT = 48;

    public function __invoke(Request $request, ?City $city = null): Response
    {
        abort_if($city !== null && ! $city->is_active, 404);

        $when = in_array($request->query('quando'), self::WHEN, true) ? (string) $request->query('quando') : null;
        $type = GroupSessionType::tryFrom((string) $request->query('tipo'));
        $type = $type !== null && in_array($type, GroupSessionType::choosable(), true) ? $type : null;
        $discipline = filled($request->query('disciplina'))
            ? Discipline::query()->active()->where('slug', (string) $request->query('disciplina'))->first()
            : null;

        $query = GroupSession::query()
            ->listed()
            ->upcoming()
            ->when($city !== null, fn (Builder $query) => $query->where(fn (Builder $here) => $here
                ->where('city_id', $city?->id)
                ->orWhere('place', GroupSessionPlace::Online)))
            ->when($type !== null, fn (Builder $query) => $query->where('type', $type))
            ->when($discipline !== null, fn (Builder $query) => $query->where('discipline_id', $discipline?->id))
            ->when($when !== null, fn (Builder $query) => $this->between($query, (string) $when));

        $total = (clone $query)->count();
        $place = $city === null ? 'in Italia' : "a {$city->name}";
        $filtered = $when !== null || $type !== null || $discipline !== null;

        return Inertia::render('public/events', [
            'city' => $city === null ? null : ['slug' => $city->slug, 'name' => $city->name],
            'events' => GroupSessionCard::many(GroupSessionCard::load($query)->orderBy('starts_at')->limit(self::LIMIT)->get()),
            'total' => $total,
            'filters' => [
                'quando' => $when,
                'tipo' => $type?->value,
                'disciplina' => $discipline?->slug,
            ],
            'types' => GroupSessionType::options(),
            'disciplines' => CatalogOptions::disciplines(),
            'cities' => CatalogOptions::cities(),
            'seo' => Seo::page(
                "Eventi fitness {$place}: workshop, open day e allenamenti di gruppo",
                "I prossimi eventi di personal trainer e palestre {$place}: workshop, open day e allenamenti di gruppo. Prenota il tuo posto su MioPersonal.",
                // The filtered lists are the same page for the search engines.
                index: ! $filtered,
                canonical: route('events.search', $city?->slug),
            ),
        ]);
    }

    /**
     * @param  Builder<GroupSession>  $query
     */
    private function between(Builder $query, string $when): void
    {
        $now = CarbonImmutable::now(TrainerSlots::TIMEZONE);

        [$from, $to] = match ($when) {
            'oggi' => [$now, $now->endOfDay()],
            // From Saturday (or now, on the weekend) to Sunday night.
            'weekend' => [$now->isWeekend() ? $now : $now->next(CarbonImmutable::SATURDAY), $now->endOfWeek(CarbonImmutable::SUNDAY)],
            'settimana' => [$now, $now->addDays(7)],
            default => [$now, $now->addDays(30)],
        };

        $query->whereBetween('starts_at', [$from->utc(), $to->utc()]);
    }
}
