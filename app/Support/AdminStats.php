<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Enums\GymLinkStatus;
use App\Enums\TrainerProfileStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\City;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * The numbers of "Admin · Statistiche": growth, traffic, channels, funnel,
 * retention and churn, marketplace and demand. From the tables of the app and
 * the history collected by App\Support\Stats (visits and activity only from
 * the day it was switched on: `since` says when).
 *
 * Days and months are Rome days and months. "Last 30 days" includes today;
 * the deltas compare with the 30 days before.
 */
final class AdminStats
{
    public const DAYS = 30;

    private const MONTHS = 12;

    private const COHORT_MONTHS = 6;

    private const CHURN_MONTHS = 6;

    private const TOP = 8;

    /** "Palestre più visitate". */
    private const TOP_GYMS = 5;

    private CarbonImmutable $now;

    /** First day of the 30 days, Rome midnight. */
    private CarbonImmutable $from;

    /** First day of the 30 days before. */
    private CarbonImmutable $previousFrom;

    public function __construct(?CarbonImmutable $now = null)
    {
        $this->now = ($now ?? CarbonImmutable::now())->setTimezone(TrainerSlots::TIMEZONE);
        $this->from = $this->now->startOfDay()->subDays(self::DAYS - 1);
        $this->previousFrom = $this->from->subDays(self::DAYS);
    }

    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        return [
            'since' => DB::table('visitor_days')->min('day'),
            'kpis' => $this->kpis(),
            'daily' => $this->daily(),
            'monthly' => $this->monthly(),
            'channels' => $this->channels(),
            'funnel' => $this->funnel(),
            'cohorts' => $this->cohorts(),
            'churn' => $this->churn(),
            'marketplace' => $this->marketplace(),
            'demand' => $this->demand(),
            'gyms' => $this->gyms(),
        ];
    }

    /**
     * The tiles on top: value of the last 30 days and of the 30 days before.
     *
     * @return list<array{key: string, label: string, value: int, previous: int|null, format: string}>
     */
    private function kpis(): array
    {
        $periods = [[$this->from, $this->now->endOfDay()], [$this->previousFrom, $this->from->subSecond()]];
        $both = fn (callable $count) => array_map(fn (array $period) => (int) $count(...$period), $periods);

        $tile = function (string $key, string $label, array $values, string $format = 'number') {
            return ['key' => $key, 'label' => $label, 'value' => $values[0], 'previous' => $values[1], 'format' => $format];
        };

        return [
            $tile('visitors', 'Visitatori unici', $both(fn ($from, $to) => $this->dayTable('visitor_days', $from, $to)->count())),
            $tile('visits', 'Visite', $both(fn ($from, $to) => $this->dayTable('visit_days', $from, $to)->sum('visits'))),
            $tile('clients', 'Nuovi clienti', $both(fn ($from, $to) => $this->newUsers(UserRole::Client, $from, $to))),
            $tile('trainers', 'Nuovi trainer', $both(fn ($from, $to) => $this->newUsers(UserRole::Trainer, $from, $to))),
            $tile('gyms', 'Nuove palestre', $both(fn ($from, $to) => $this->newUsers(UserRole::Gym, $from, $to))),
            $tile('publishedGyms', 'Palestre approvate', $both(fn ($from, $to) => GymProfile::query()->whereBetween('approved_at', [$from->utc(), $to->utc()])->count())),
            $tile('activeClients', 'Clienti attivi', $both(fn ($from, $to) => $this->activeUsers(UserRole::Client, $from, $to))),
            $tile('activeTrainers', 'Trainer attivi', $both(fn ($from, $to) => $this->activeUsers(UserRole::Trainer, $from, $to))),
            $tile('requests', 'Richieste di prenotazione', $both(fn ($from, $to) => Booking::query()->whereBetween('created_at', [$from->utc(), $to->utc()])->count())),
            $tile('sessions', 'Sedute svolte', $both(fn ($from, $to) => $this->doneSessions($from, $to)->count())),
            $tile('gmv', 'Valore sedute svolte', $both(fn ($from, $to) => $this->doneSessions($from, $to)->sum('price_cents')), 'cents'),
        ];
    }

    /**
     * Day by day, the last 30 days.
     *
     * @return list<array{day: string, visitors: int, visits: int, signups: int, requests: int}>
     */
    private function daily(): array
    {
        $to = $this->now->endOfDay();
        $visitors = $this->dayTable('visitor_days', $this->from, $to)->selectRaw('day, count(*) as total')->groupBy('day')->pluck('total', 'day');
        $visits = $this->dayTable('visit_days', $this->from, $to)->selectRaw('day, sum(visits) as total')->groupBy('day')->pluck('total', 'day');
        $signups = $this->romeDays(User::query()->where('role', '!=', UserRole::Admin)->whereBetween('created_at', [$this->from->utc(), $to->utc()])->pluck('created_at'));
        $requests = $this->romeDays(Booking::query()->whereBetween('created_at', [$this->from->utc(), $to->utc()])->pluck('created_at'));

        $days = [];

        for ($day = $this->from; $day <= $to; $day = $day->addDay()) {
            $key = $day->toDateString();
            $days[] = [
                'day' => $key,
                'visitors' => (int) ($this->dateValue($visitors, $key) ?? 0),
                'visits' => (int) ($this->dateValue($visits, $key) ?? 0),
                'signups' => $signups[$key] ?? 0,
                'requests' => $requests[$key] ?? 0,
            ];
        }

        return $days;
    }

    /**
     * Month by month, the last 12 (the current one is still going).
     *
     * @return list<array{month: string, clients: int, trainers: int, activeClients: int, activeTrainers: int, requests: int, sessions: int, gmvCents: int}>
     */
    private function monthly(): array
    {
        $first = $this->now->startOfMonth()->subMonths(self::MONTHS - 1);
        $users = User::query()
            ->where('role', '!=', UserRole::Admin)
            ->where('created_at', '>=', $first->utc())
            ->get(['role', 'created_at'])
            ->groupBy(fn (User $user) => $user->role->value);
        $clients = $this->romeMonths($users->get(UserRole::Client->value, collect())->pluck('created_at'));
        $trainers = $this->romeMonths($users->get(UserRole::Trainer->value, collect())->pluck('created_at'));
        $requests = $this->romeMonths(Booking::query()->where('created_at', '>=', $first->utc())->pluck('created_at'));
        $done = $this->doneSessions($first, $this->now)->get(['ends_at', 'price_cents']);
        $sessions = $this->romeMonths($done->pluck('ends_at'));

        $months = [];

        for ($month = $first; $month <= $this->now; $month = $month->addMonth()) {
            $key = $month->format('Y-m');
            $end = $month->endOfMonth();
            $months[] = [
                'month' => $key,
                'clients' => $clients[$key] ?? 0,
                'trainers' => $trainers[$key] ?? 0,
                'activeClients' => $this->activeUsers(UserRole::Client, $month, $end),
                'activeTrainers' => $this->activeUsers(UserRole::Trainer, $month, $end),
                'requests' => $requests[$key] ?? 0,
                'sessions' => $sessions[$key] ?? 0,
                'gmvCents' => (int) $done->filter(fn (Booking $booking) => $booking->ends_at->setTimezone(TrainerSlots::TIMEZONE)->format('Y-m') === $key)->sum('price_cents'),
            ];
        }

        return $months;
    }

    /**
     * Where the visits and the new users of the last 30 days came from.
     *
     * @return array{visits: list<array{source: string, count: int}>, signups: list<array{source: string, count: int}>}
     */
    private function channels(): array
    {
        $visits = $this->dayTable('visit_days', $this->from, $this->now->endOfDay())
            ->selectRaw('source, sum(visits) as total')
            ->groupBy('source')
            ->pluck('total', 'source')
            ->map(fn ($total) => (int) $total);

        $signups = User::query()
            ->where('role', '!=', UserRole::Admin)
            ->where('created_at', '>=', $this->from->utc())
            ->get(['acquisition'])
            ->countBy(fn (User $user) => $user->acquisition['source'] ?? 'sconosciuto');

        return ['visits' => $this->top($visits), 'signups' => $this->top($signups)];
    }

    /**
     * Last 30 days, step by step: from the visitors to the sessions done.
     *
     * @return list<array{label: string, count: int}>
     */
    private function funnel(): array
    {
        $to = $this->now->endOfDay();
        $between = [$this->from->utc(), $to->utc()];

        return [
            ['label' => 'Visitatori unici', 'count' => $this->dayTable('visitor_days', $this->from, $to)->count()],
            ['label' => 'Visite a profili trainer', 'count' => (int) $this->dayTable('trainer_profile_views', $this->from, $to)->sum('views')],
            ['label' => 'Nuovi clienti', 'count' => $this->newUsers(UserRole::Client, $this->from, $to)],
            ['label' => 'Clienti con una richiesta', 'count' => Booking::query()->whereBetween('created_at', $between)->distinct()->count('client_id')],
            ['label' => 'Clienti con una seduta confermata', 'count' => Booking::query()->whereBetween('confirmed_at', $between)->distinct()->count('client_id')],
        ];
    }

    /**
     * Clients by month of sign-up: how many of them used the app in the same
     * month and in each of the next ones (only months already started).
     *
     * @return list<array{month: string, size: int, retention: list<float|null>}>
     */
    private function cohorts(): array
    {
        $cohorts = [];
        $first = $this->now->startOfMonth()->subMonths(self::COHORT_MONTHS - 1);

        for ($month = $first; $month <= $this->now; $month = $month->addMonth()) {
            $ids = User::query()
                ->where('role', UserRole::Client)
                ->whereBetween('created_at', [$month->utc(), $month->endOfMonth()->utc()])
                ->pluck('id');

            $retention = [];

            for ($offset = 0; $offset < self::COHORT_MONTHS; $offset++) {
                $active = $month->addMonths($offset);

                if ($active > $this->now || $ids->isEmpty()) {
                    $retention[] = null;

                    continue;
                }

                $retention[] = round($this->activeIds($active, $active->endOfMonth(), $ids)->count() / $ids->count(), 3);
            }

            $cohorts[] = ['month' => $month->format('Y-m'), 'size' => $ids->count(), 'retention' => $retention];
        }

        return $cohorts;
    }

    /**
     * Monthly churn, complete months only: of who was active in the month
     * before, how many didn't come back in the month.
     *
     * @return list<array{month: string, clients: float|null, trainers: float|null, clientsBase: int, trainersBase: int}>
     */
    private function churn(): array
    {
        $rows = [];
        $last = $this->now->startOfMonth()->subMonth();

        for ($month = $last->subMonths(self::CHURN_MONTHS - 1); $month <= $last; $month = $month->addMonth()) {
            $before = $month->subMonth();
            $row = ['month' => $month->format('Y-m')];

            foreach ([UserRole::Client->value => 'clients', UserRole::Trainer->value => 'trainers'] as $role => $key) {
                $base = $this->activeIds($before, $before->endOfMonth(), role: $role);
                $back = $base->isEmpty() ? collect() : $this->activeIds($month, $month->endOfMonth(), $base, $role);
                $row[$key] = $base->isEmpty() ? null : round(1 - $back->count() / $base->count(), 3);
                $row[$key.'Base'] = $base->count();
            }

            $rows[] = $row;
        }

        /** @var list<array{month: string, clients: float|null, trainers: float|null, clientsBase: int, trainersBase: int}> $rows */
        return $rows;
    }

    /**
     * The supply side and how the two sides meet.
     *
     * @return array<string, mixed>
     */
    private function marketplace(): array
    {
        $between = [$this->from->utc(), $this->now->endOfDay()->utc()];
        $views = (int) $this->dayTable('trainer_profile_views', $this->from, $this->now->endOfDay())->sum('views');
        $requests = Booking::query()->whereBetween('created_at', $between)->count();

        // Hours from the request to the trainer's answer, last 30 days.
        $answers = DB::table('booking_events')
            ->join('bookings', 'bookings.id', '=', 'booking_events.booking_id')
            ->whereIn('booking_events.type', ['confirmed', 'declined'])
            ->whereNotNull('booking_events.actor_id')
            ->whereBetween('booking_events.created_at', $between)
            ->get(['booking_events.created_at as answered_at', 'bookings.created_at as requested_at'])
            ->map(fn (object $row) => CarbonImmutable::parse($row->requested_at)->diffInMinutes(CarbonImmutable::parse($row->answered_at)) / 60)
            ->sort()
            ->values();

        $outcomes = Booking::query()->whereBetween('created_at', $between);
        $confirmed = (clone $outcomes)->whereNotNull('confirmed_at')->count();
        $closed = $confirmed + (clone $outcomes)->whereIn('status', [BookingStatus::Declined, BookingStatus::Expired])->count();

        // Clients with a session done, and how many came back for more.
        $perClient = Booking::query()
            ->where('status', BookingStatus::Confirmed)
            ->whereNull('no_show_at')
            ->where('ends_at', '<', now())
            ->whereNotNull('client_id')
            ->selectRaw('client_id, count(*) as total')
            ->groupBy('client_id')
            ->pluck('total');

        return [
            'trainers' => [
                ['label' => 'Registrati', 'count' => TrainerProfile::query()->count()],
                ['label' => 'In verifica', 'count' => TrainerProfile::query()->where('status', TrainerProfileStatus::Review)->count()],
                ['label' => 'Approvati', 'count' => TrainerProfile::query()->where('status', TrainerProfileStatus::Approved)->count()],
                ['label' => 'Visibili nella ricerca', 'count' => TrainerProfile::query()->published()->count()],
            ],
            'responseHoursMedian' => $answers->isEmpty() ? null : round((float) $answers[intdiv($answers->count(), 2)], 1),
            'acceptanceRate' => $closed === 0 ? null : round($confirmed / $closed, 3),
            'viewToRequestRate' => $views === 0 ? null : round($requests / $views, 3),
            'repeatRate' => $perClient->isEmpty() ? null : round($perClient->filter(fn ($total) => $total >= 2)->count() / $perClient->count(), 3),
            'clientsWithSession' => $perClient->count(),
            'cities' => $this->supplyByCity(),
        ];
    }

    /**
     * Demand: the searches of the last 30 days, and what people look for and
     * don't find.
     *
     * @return array<string, mixed>
     */
    private function demand(): array
    {
        // Rows as arrays: city id, discipline slugs, number of results.
        $searches = DB::table('search_logs')
            // The gyms' searches have their own section (gyms()).
            ->where('kind', 'trainer')
            ->where('created_at', '>=', $this->from->utc())
            ->get(['city_id', 'disciplines', 'results'])
            ->map(fn (object $row) => [
                'city' => is_numeric($row->city_id ?? null) ? (int) $row->city_id : null,
                'disciplines' => json_decode((string) ($row->disciplines ?? '[]'), true) ?: [],
                'results' => (int) ($row->results ?? 0),
            ]);
        $cities = City::query()->whereIn('id', $searches->pluck('city')->filter()->unique())->pluck('name', 'id');
        $place = fn (array $search) => $search['city'] === null ? 'Tutta Italia' : ($cities[$search['city']] ?? '—');
        $label = fn (array $search) => $place($search).' · '.implode(', ', $search['disciplines'] ?: ['tutte le discipline']);

        $empty = $searches->filter(fn (array $search) => $search['results'] === 0);

        return [
            'searches' => $searches->count(),
            'emptyRate' => $searches->isEmpty() ? null : round($empty->count() / $searches->count(), 3),
            'empty' => $this->top($empty->countBy($label)),
            'cities' => $this->top($searches->countBy($place)),
        ];
    }

    /**
     * The gyms: how many there are, how much their profiles are opened, what
     * people look for in the gyms' search (last 30 days) and the links with
     * the trainers.
     *
     * @return array<string, mixed>
     */
    private function gyms(): array
    {
        $to = $this->now->endOfDay();

        $searches = DB::table('search_logs')
            ->where('kind', 'gym')
            ->where('created_at', '>=', $this->from->utc())
            ->get(['city_id', 'results']);
        $cities = City::query()->whereIn('id', $searches->pluck('city_id')->filter()->unique())->pluck('name', 'id');
        $place = fn (object $search) => is_numeric($search->city_id ?? null) ? ($cities[(int) $search->city_id] ?? '—') : 'Tutta Italia';
        $empty = $searches->filter(fn (object $search) => (int) ($search->results ?? 0) === 0);

        $views = $this->dayTable('gym_profile_views', $this->from, $to)
            ->selectRaw('gym_profile_id, sum(views) as total')
            ->groupBy('gym_profile_id')
            ->pluck('total', 'gym_profile_id')
            ->map(fn ($total) => (int) $total);
        $names = GymProfile::query()->whereIn('id', $views->keys())->pluck('name', 'id');

        $links = DB::table('gym_trainer')
            ->whereIn('status', [GymLinkStatus::Accepted->value, GymLinkStatus::Pending->value])
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $published = GymProfile::query()->published()->with('city:id,name')->get(['id', 'city_id']);

        return [
            'supply' => [
                ['label' => 'Registrate', 'count' => GymProfile::query()->count()],
                ['label' => 'In verifica', 'count' => GymProfile::query()->where('status', TrainerProfileStatus::Review)->count()],
                ['label' => 'Approvate', 'count' => GymProfile::query()->where('status', TrainerProfileStatus::Approved)->count()],
                ['label' => 'Visibili nella ricerca', 'count' => $published->count()],
            ],
            'views' => (int) $views->sum(),
            'searches' => $searches->count(),
            'emptyRate' => $searches->isEmpty() ? null : round($empty->count() / $searches->count(), 3),
            'searchCities' => $this->top($searches->countBy($place)),
            'cities' => $this->top($published->countBy(fn (GymProfile $gym) => $gym->city->name)),
            'acceptedLinks' => (int) ($links[GymLinkStatus::Accepted->value] ?? 0),
            'pendingLinks' => (int) ($links[GymLinkStatus::Pending->value] ?? 0),
            // The most opened profiles: a deleted gym has no name any more.
            'topViewed' => array_values($views->sortDesc()->take(self::TOP_GYMS)
                ->map(fn (int $count, int|string $id) => ['source' => (string) ($names[(int) $id] ?? '—'), 'count' => $count])
                ->all()),
        ];
    }

    /**
     * Published trainers by city (main city and the others), the top ones.
     *
     * @return list<array{source: string, count: int}>
     */
    private function supplyByCity(): array
    {
        $counts = TrainerProfile::query()
            ->published()
            ->with(['city:id,name', 'otherCities:id,name'])
            ->get()
            ->flatMap(fn (TrainerProfile $profile) => array_unique(array_filter([$profile->city?->name, ...$profile->otherCities->pluck('name')->all()])) ?: ['Solo online'])
            ->countBy();

        return $this->top($counts);
    }

    /**
     * The biggest first; the rest summed as "Altri".
     *
     * @param  Collection<array-key, int>  $counts
     * @return list<array{source: string, count: int}>
     */
    private function top(Collection $counts): array
    {
        $sorted = $counts->sortDesc();
        $rows = array_values($sorted->take(self::TOP)->map(fn (int $count, string|int $source) => ['source' => (string) $source, 'count' => $count])->all());
        $rest = (int) $sorted->skip(self::TOP)->sum();

        if ($rest > 0) {
            $rows[] = ['source' => 'Altri', 'count' => $rest];
        }

        return $rows;
    }

    private function newUsers(UserRole $role, CarbonImmutable $from, CarbonImmutable $to): int
    {
        return User::query()->where('role', $role)->whereBetween('created_at', [$from->utc(), $to->utc()])->count();
    }

    private function activeUsers(UserRole $role, CarbonImmutable $from, CarbonImmutable $to): int
    {
        return $this->activeIds($from, $to, role: $role->value)->count();
    }

    /**
     * Users active between the two Rome days, optionally among some ids and of a role.
     *
     * @param  Collection<int, int>|null  $among
     * @return Collection<int, int>
     */
    private function activeIds(CarbonImmutable $from, CarbonImmutable $to, ?Collection $among = null, ?string $role = null): Collection
    {
        return $this->dayTable('user_activity_days', $from, $to)
            ->when($role !== null, fn ($query) => $query->where('role', $role))
            ->when($among !== null, fn ($query) => $query->whereIn('user_id', $among))
            ->distinct()
            ->pluck('user_id');
    }

    private function dayTable(string $table, CarbonImmutable $from, CarbonImmutable $to): Builder
    {
        return DB::table($table)->whereBetween('day', [$from->toDateString(), $to->toDateString()]);
    }

    /**
     * Confirmed sessions that ended in the period and were not marked "Saltata".
     *
     * @return \Illuminate\Database\Eloquent\Builder<Booking>
     */
    private function doneSessions(CarbonImmutable $from, CarbonImmutable $to): \Illuminate\Database\Eloquent\Builder
    {
        return Booking::query()
            ->where('status', BookingStatus::Confirmed)
            ->whereNull('no_show_at')
            ->whereBetween('ends_at', [$from->utc(), min($to, CarbonImmutable::now())->utc()]);
    }

    /**
     * @param  Collection<int, mixed>  $dates
     * @return array<string, int>
     */
    private function romeDays(Collection $dates): array
    {
        return $dates->filter()->countBy(fn ($date) => CarbonImmutable::parse($date)->setTimezone(TrainerSlots::TIMEZONE)->toDateString())->all();
    }

    /**
     * @param  Collection<int, mixed>  $dates
     * @return array<string, int>
     */
    private function romeMonths(Collection $dates): array
    {
        return $dates->filter()->countBy(fn ($date) => CarbonImmutable::parse($date)->setTimezone(TrainerSlots::TIMEZONE)->format('Y-m'))->all();
    }

    /**
     * SQLite gives "2026-11-06", PostgreSQL may give "2026-11-06 00:00:00".
     *
     * @param  Collection<array-key, mixed>  $values
     */
    private function dateValue(Collection $values, string $day): mixed
    {
        return $values->first(fn ($value, $key) => str_starts_with((string) $key, $day));
    }
}
