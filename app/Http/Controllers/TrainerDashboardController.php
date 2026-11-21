<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Controllers\Concerns\BuildsTrainerArea;
use App\Models\Booking;
use App\Models\ClientPackage;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Support\TrainerBookingRequests;
use App\Support\TrainerPastSessions;
use App\Support\TrainerSessions;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Home", the trainer's dashboard: the requests to answer ("Da confermare"),
 * the week with the sessions of the chosen day (`?giorno=2026-11-17`), the
 * next session, the numbers of a period (`?periodo=7`, or `dal` and `al`) and
 * the active packages. A new trainer sees an empty dashboard.
 */
class TrainerDashboardController extends Controller
{
    use BuildsTrainerArea;

    /** The periods of "Statistiche": days back from today, today included. */
    public const PERIODS = ['oggi' => 1, '7' => 7, '30' => 30];

    /** The default period of "Statistiche". */
    public const DEFAULT_PERIOD = '7';

    /** "Intervallo personalizzato": at most a year. */
    public const MAX_RANGE_DAYS = 366;

    /** How far the week strip goes, back and forward. */
    public const MAX_MONTHS = 12;

    public function __invoke(Request $request): Response
    {
        /** @var User $trainer */
        $trainer = $request->user();
        $profile = $trainer->trainerProfile;
        $today = $this->romeNow()->startOfDay();
        $day = $this->day($request, $today);

        return Inertia::render('trainer/today', [
            'firstName' => Str::before($trainer->name, ' '),
            'trainerArea' => $this->trainerArea(),
            // Rome dates, "2026-11-17": the strip marks today and the chosen day.
            'today' => $today->toDateString(),
            'day' => $day->toDateString(),
            'minDate' => $today->subMonths(self::MAX_MONTHS)->toDateString(),
            'maxDate' => $today->addMonths(self::MAX_MONTHS)->toDateString(),
            // "Sposta": the free times, only when the dialog asks.
            'rescheduleSlots' => Inertia::optional(fn () => TrainerSessions::rescheduleSlots($profile, $request->integer('sposta'))),
            // No profile yet (registration not sent): nothing to show.
            ...($profile === null ? self::empty($day, $request) : $this->dashboard($profile, $day, $request)),
        ]);
    }

    /** `?giorno=` within MAX_MONTHS from today, otherwise today. */
    private function day(Request $request, CarbonImmutable $today): CarbonImmutable
    {
        $value = $request->string('giorno')->toString();

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return $today;
        }

        $day = CarbonImmutable::createFromFormat('!Y-m-d', $value, 'Europe/Rome');

        if ($day === null || $day->format('Y-m-d') !== $value) {
            return $today;
        }

        return $day->betweenIncluded($today->subMonths(self::MAX_MONTHS), $today->addMonths(self::MAX_MONTHS)) ? $day : $today;
    }

    /**
     * @return array<string, mixed>
     */
    private static function empty(CarbonImmutable $day, Request $request): array
    {
        $monday = $day->startOfWeek(CarbonImmutable::MONDAY);
        $period = self::period($request);

        return [
            'next' => null,
            'requests' => [],
            'week' => collect(range(0, 6))->map(fn (int $i) => ['date' => $monday->addDays($i)->toDateString(), 'count' => 0])->all(),
            'daySessions' => [],
            'packages' => [],
            'stats' => [
                ...$period,
                'views' => 0,
                'viewsBefore' => 0,
                'sessions' => 0,
                'sessionsBefore' => 0,
                'hours' => 0,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function dashboard(TrainerProfile $profile, CarbonImmutable $day, Request $request): array
    {
        $next = $profile->bookings()
            ->where('status', BookingStatus::Confirmed)
            ->where('ends_at', '>', now())
            ->with(TrainerSessions::WITH)
            ->orderBy('starts_at')
            ->first();

        return [
            // The one going on now, or the next one.
            'next' => $next === null ? null : TrainerSessions::row($next),
            // "Da confermare": all of them, the ones expiring first on top.
            'requests' => TrainerBookingRequests::rows(TrainerBookingRequests::query($profile)->get(), $profile),
            'week' => $this->week($profile, $day),
            'daySessions' => $this->daySessions($profile, $day),
            'packages' => $this->packages($profile),
            'stats' => $this->stats($profile, self::period($request)),
        ];
    }

    /**
     * The 7 days, Monday to Sunday, of the chosen day, with how many sessions
     * each has (confirmed, over or not, and waiting for an answer).
     *
     * @return list<array{date: string, count: int}>
     */
    private function week(TrainerProfile $profile, CarbonImmutable $day): array
    {
        $monday = $day->startOfWeek(CarbonImmutable::MONDAY);

        $counts = $this->dayQuery($profile, $monday, $monday->addDays(7))
            ->get(['starts_at'])
            ->countBy(fn (Booking $booking) => $booking->starts_at->timezone('Europe/Rome')->toDateString());

        return array_values(collect(range(0, 6))
            ->map(function (int $i) use ($monday, $counts) {
                $date = $monday->addDays($i)->toDateString();

                return ['date' => $date, 'count' => (int) ($counts[$date] ?? 0)];
            })
            ->all());
    }

    /**
     * The sessions of the chosen day, in the format of TrainerDaySession
     * (resources/js/types/trainer.ts): the session, which of the package it
     * is, the phone for "Chiama" and, once over, "Effettuata" or "Saltata".
     *
     * @return list<array<string, mixed>>
     */
    private function daySessions(TrainerProfile $profile, CarbonImmutable $day): array
    {
        return array_values($this->dayQuery($profile, $day, $day->addDay())
            ->with(TrainerSessions::WITH)
            ->orderBy('starts_at')
            ->get()
            ->map(fn (Booking $booking) => [
                ...TrainerSessions::row($booking),
                'package' => TrainerPastSessions::packageProgress($booking),
                'phone' => $booking->client->phone ?? $booking->trainerClient?->phone,
                'over' => $booking->status === BookingStatus::Confirmed && $booking->ends_at->lessThanOrEqualTo(now()),
                'canChangeNoShow' => $booking->canChangeNoShow(),
            ])
            ->all());
    }

    /**
     * Confirmed (over or not) and waiting for an answer, from `$from` to `$until` (Rome).
     *
     * @return HasMany<Booking, TrainerProfile>
     */
    private function dayQuery(TrainerProfile $profile, CarbonImmutable $from, CarbonImmutable $until)
    {
        return $profile->bookings()
            ->active()
            ->where('starts_at', '>=', $from->utc())
            ->where('starts_at', '<', $until->utc());
    }

    /**
     * The period of "Statistiche": `?periodo=oggi|7|30`, or `dal` and `al`
     * (Rome dates, at most MAX_RANGE_DAYS, not after today).
     *
     * @return array{period: string, from: string, to: string}
     */
    private static function period(Request $request): array
    {
        $today = CarbonImmutable::now('Europe/Rome')->startOfDay();
        $period = $request->string('periodo')->toString();

        if ($period === 'intervallo') {
            $from = self::date($request->string('dal')->toString());
            $to = self::date($request->string('al')->toString());

            if ($from !== null && $to !== null) {
                $to = $to->greaterThan($today) ? $today : $to;
                $from = $from->greaterThan($to) ? $to : $from;
                $from = $from->diffInDays($to) >= self::MAX_RANGE_DAYS ? $to->subDays(self::MAX_RANGE_DAYS - 1) : $from;

                return ['period' => 'intervallo', 'from' => $from->toDateString(), 'to' => $to->toDateString()];
            }
        }

        $period = array_key_exists($period, self::PERIODS) ? $period : self::DEFAULT_PERIOD;

        return [
            'period' => $period,
            'from' => $today->subDays(self::PERIODS[$period] - 1)->toDateString(),
            'to' => $today->toDateString(),
        ];
    }

    private static function date(string $value): ?CarbonImmutable
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return null;
        }

        $date = CarbonImmutable::createFromFormat('!Y-m-d', $value, 'Europe/Rome');

        return $date !== null && $date->format('Y-m-d') === $value ? $date : null;
    }

    /**
     * "Visite al profilo" and "Sedute prenotate" (confirmed sessions starting
     * in the period) with the same numbers of the period just before, for
     * the change in percent.
     *
     * @param  array{period: string, from: string, to: string}  $period
     * @return array<string, mixed>
     */
    private function stats(TrainerProfile $profile, array $period): array
    {
        $from = CarbonImmutable::parse($period['from'], 'Europe/Rome');
        $to = CarbonImmutable::parse($period['to'], 'Europe/Rome');
        $days = (int) $from->diffInDays($to) + 1;
        $beforeFrom = $from->subDays($days);
        $beforeTo = $from->subDay();

        $views = fn (CarbonImmutable $a, CarbonImmutable $b) => (int) DB::table('trainer_profile_views')
            ->where('trainer_profile_id', $profile->id)
            ->whereBetween('day', [$a->toDateString(), $b->toDateString()])
            ->sum('views');

        $sessions = fn (CarbonImmutable $a, CarbonImmutable $b) => $profile->bookings()
            ->where('status', BookingStatus::Confirmed)
            ->where('starts_at', '>=', $a->utc())
            ->where('starts_at', '<', $b->addDay()->utc())
            ->get(['starts_at', 'ends_at']);

        $now = $sessions($from, $to);

        return [
            ...$period,
            'views' => $views($from, $to),
            'viewsBefore' => $views($beforeFrom, $beforeTo),
            'sessions' => $now->count(),
            'sessionsBefore' => $sessions($beforeFrom, $beforeTo)->count(),
            // "21 h di allenamento".
            'hours' => round($now->sum(fn (Booking $booking) => $booking->starts_at->diffInMinutes($booking->ends_at)) / 60, 1),
        ];
    }

    /**
     * "Pacchetti attivi": bought and not all done yet, with the next session.
     *
     * @return list<array<string, mixed>>
     */
    private function packages(TrainerProfile $profile): array
    {
        /** @var Collection<int, ClientPackage> $packages */
        $packages = $profile->clientPackages()
            ->bought()
            // Deleted accounts: nobody to show.
            ->whereNotNull('client_id')
            ->withSessionCounts()
            ->with(['client', 'bookings' => fn ($bookings) => $bookings->active()->where('ends_at', '>', now())->orderBy('starts_at')])
            ->oldest('bought_at')
            ->get();

        return array_values($packages
            ->filter(fn (ClientPackage $package) => ($package->done_count ?? 0) < $package->sessions_total)
            // The ones about to end first: time to propose the next one.
            ->sortBy(fn (ClientPackage $package) => $package->sessions_total - ($package->done_count ?? 0))
            ->map(function (ClientPackage $package) {
                /** @var Booking|null $next */
                $next = $package->bookings->first();

                return [
                    'id' => $package->id,
                    'clientId' => $package->client_id,
                    'clientName' => $package->client->name ?? '',
                    'name' => $package->name,
                    'total' => $package->sessions_total,
                    'done' => $package->done_count ?? 0,
                    'booked' => $package->bookedCount(),
                    'nextStart' => $next === null ? null : $this->iso($next->starts_at),
                ];
            })
            ->all());
    }
}
