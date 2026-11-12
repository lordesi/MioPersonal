<?php

namespace App\Support;

use App\Enums\BookingStatus;
use App\Enums\GroupSessionStatus;
use App\Models\Booking;
use App\Models\GroupSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * A client's training, the only source of the numbers of "Panoramica" (and
 * of the "Progressi" a trainer sees when the client shares them): sessions
 * done, courses and events attended. Weeks are ISO weeks (Monday first) in
 * Europe/Rome, like the dates in the calendar.
 *
 * The "Saltata" mark is only for the trainer: the client still sees the
 * session as done (ClientBookingData::isDone).
 */
final class ClientProgress
{
    public const TIMEZONE = 'Europe/Rome';

    /** The bars of "La tua attività". */
    public const CHART_WEEKS = 12;

    /** "Ultimi allenamenti". */
    private const RECENT = 5;

    /**
     * @param  Collection<int, array{date: string, source: string, label: string, discipline: string, trainerProfileId: int|null}>  $entries  the most recent first
     */
    private function __construct(
        public readonly Collection $entries,
        public readonly CarbonImmutable $today,
        public readonly ?int $goal,
    ) {}

    public static function for(User $client, ?CarbonInterface $now = null): self
    {
        $now = CarbonImmutable::instance($now ?? now());
        $day = fn (CarbonInterface $date) => $date->copy()->setTimezone(self::TIMEZONE)->format('Y-m-d');

        $sessions = Booking::query()
            ->where(fn (Builder $mine) => $mine
                ->where('client_id', $client->id)
                ->orWhere(fn (Builder $joined) => $joined->withGuest($client)))
            ->where('status', BookingStatus::Confirmed)
            ->where('ends_at', '<=', $now)
            ->with(['trainerProfile.user', 'trainerProfile.disciplines'])
            ->get()
            ->map(fn (Booking $booking) => [
                'date' => $day($booking->starts_at),
                'source' => 'session',
                'label' => 'Seduta con '.$booking->trainerProfile->user->first_name,
                'discipline' => $booking->trainerProfile->disciplines->first()->name ?? $booking->service_name,
                'trainerProfileId' => $booking->trainer_profile_id,
            ]);

        $events = GroupSession::query()
            ->whereHas('activeRegistrations', fn (Builder $registration) => $registration->where('user_id', $client->id))
            ->where('status', GroupSessionStatus::Published)
            ->where('ends_at', '<=', $now)
            ->with('discipline')
            ->get()
            ->map(fn (GroupSession $event) => [
                'date' => $day($event->starts_at),
                'source' => 'event',
                'label' => $event->title,
                'discipline' => $event->discipline->name ?? $event->title,
                'trainerProfileId' => null,
            ]);

        $entries = $sessions->toBase()->concat($events->toBase())
            ->sortByDesc('date')
            ->values();

        return new self(
            $entries,
            CarbonImmutable::parse($day($now), self::TIMEZONE),
            $client->clientPreference?->sessions_per_week,
        );
    }

    /** The Monday of the week of a Y-m-d day. */
    public static function weekOf(string $date): string
    {
        return CarbonImmutable::parse($date, self::TIMEZONE)->startOfWeek(CarbonInterface::MONDAY)->format('Y-m-d');
    }

    public function total(): int
    {
        return $this->entries->count();
    }

    public function thisWeek(): int
    {
        return $this->countsByWeek()->get($this->today->startOfWeek(CarbonInterface::MONDAY)->format('Y-m-d'), 0);
    }

    public function thisMonth(): int
    {
        $month = $this->today->format('Y-m');

        return $this->entries->filter(fn (array $entry) => str_starts_with($entry['date'], $month))->count();
    }

    /**
     * Weeks in a row with the goal reached (one training without a goal). The
     * current week counts once reached: until Sunday it doesn't break the row.
     */
    public function streak(): int
    {
        $counts = $this->countsByWeek();
        $target = max(1, $this->goal ?? 1);
        $week = $this->today->startOfWeek(CarbonInterface::MONDAY);

        if ($counts->get($week->format('Y-m-d'), 0) < $target) {
            $week = $week->subWeek();
        }

        $streak = 0;

        while ($counts->get($week->format('Y-m-d'), 0) >= $target) {
            $streak++;
            $week = $week->subWeek();
        }

        return $streak;
    }

    /**
     * The trainings of the last weeks, the current one last.
     *
     * @return list<array{start: string, count: int}>
     */
    public function weeks(int $count = self::CHART_WEEKS): array
    {
        $counts = $this->countsByWeek();
        $monday = $this->today->startOfWeek(CarbonInterface::MONDAY);

        return array_map(function (int $ago) use ($counts, $monday) {
            $start = $monday->subWeeks($ago)->format('Y-m-d');

            return ['start' => $start, 'count' => $counts->get($start, 0)];
        }, range($count - 1, 0));
    }

    /**
     * ClientProgressSummary, for the frontend.
     *
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        return [
            'thisWeek' => $this->thisWeek(),
            'thisMonth' => $this->thisMonth(),
            'total' => $this->total(),
            'goal' => $this->goal,
            'streak' => $this->streak(),
            'weeks' => $this->weeks(),
            'recent' => array_values($this->entries
                ->take(self::RECENT)
                ->map(fn (array $entry) => [
                    'date' => $entry['date'],
                    'source' => $entry['source'],
                    'label' => $entry['label'],
                ])->all()),
        ];
    }

    /**
     * @return Collection<string, int> Monday => trainings
     */
    private function countsByWeek(): Collection
    {
        return $this->entries->countBy(fn (array $entry) => self::weekOf($entry['date']));
    }
}
