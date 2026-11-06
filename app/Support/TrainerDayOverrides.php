<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\TrainerDayOverride;
use App\Models\TrainerProfile;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * "Giorni e settimane diverse" of "Disponibilità": the days with their own
 * hours (or closed) instead of the weekly ones. TrainerSlots::days() reads
 * them; this class saves them and groups them for the page.
 */
final class TrainerDayOverrides
{
    /**
     * Every date from `$from` to `$to` gets the hours of its weekday (0 =
     * Monday … 6 = Sunday), or none when closed. The days already changed in
     * that period are replaced; the past ones are deleted.
     *
     * @param  array<int|string, list<int|string>>|null  $hours  null = closed
     */
    public static function save(TrainerProfile $profile, CarbonImmutable $from, CarbonImmutable $to, ?array $hours, ?string $note): void
    {
        $rows = [];
        $now = now();

        for ($date = $from; $date <= $to; $date = $date->addDay()) {
            $dayHours = $hours === null ? [] : array_map(intval(...), $hours[$date->dayOfWeekIso - 1] ?? []);
            $dayHours = array_values(array_unique($dayHours));
            sort($dayHours);

            $rows[] = [
                'trainer_profile_id' => $profile->id,
                'date' => $date->toDateString(),
                'hours' => json_encode($dayHours),
                'note' => $note === null || trim($note) === '' ? null : trim($note),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::transaction(function () use ($profile, $from, $to, $rows) {
            self::clear($profile, $from, $to);
            self::deletePast($profile);
            TrainerDayOverride::query()->insert($rows);
        });
    }

    /** Back to the weekly hours for these days. */
    public static function clear(TrainerProfile $profile, CarbonImmutable $from, CarbonImmutable $to): void
    {
        $profile->dayOverrides()->whereBetween('date', [$from->toDateString(), $to->toDateString()])->delete();
    }

    /**
     * The changes from today on, in blocks of days in a row with the same note
     * and both closed or both open, with the bookings already in those days
     * (they stay valid: the page says so).
     *
     * @return list<array{from: string, to: string, closed: bool, note: string|null, days: list<array{date: string, hours: list<int>}>, bookings: int}>
     */
    public static function blocks(TrainerProfile $profile): array
    {
        $today = CarbonImmutable::now(TrainerSlots::TIMEZONE)->startOfDay();
        $overrides = $profile->dayOverrides()->where('date', '>=', $today->toDateString())->get();

        $bookings = self::bookingDays($profile, $today);
        $blocks = [];
        $previous = null;

        foreach ($overrides as $override) {
            $day = ['date' => $override->date->toDateString(), 'hours' => array_map(intval(...), $override->hours)];

            $continues = $previous instanceof TrainerDayOverride
                && $previous->date->addDay()->isSameDay($override->date)
                && $previous->note === $override->note
                && ($previous->hours === []) === ($override->hours === []);

            // $previous is set: the block of the day before exists.
            if ($continues) {
                $index = count($blocks) - 1;
                $blocks[$index]['to'] = $day['date'];
                $blocks[$index]['days'][] = $day;
            } else {
                $blocks[] = [
                    'from' => $day['date'],
                    'to' => $day['date'],
                    'closed' => $override->hours === [],
                    'note' => $override->note,
                    'days' => [$day],
                    'bookings' => 0,
                ];
            }

            $previous = $override;
        }

        return array_map(fn (array $block) => [
            ...$block,
            'bookings' => $bookings->filter(fn (string $day) => $day >= $block['from'] && $day <= $block['to'])->count(),
        ], $blocks);
    }

    private static function deletePast(TrainerProfile $profile): void
    {
        $profile->dayOverrides()->where('date', '<', CarbonImmutable::now(TrainerSlots::TIMEZONE)->toDateString())->delete();
    }

    /**
     * The Rome day of each booking still taking time, from today on.
     *
     * @return Collection<int, string>
     */
    private static function bookingDays(TrainerProfile $profile, CarbonImmutable $today): Collection
    {
        return $profile->bookings()
            ->active()
            ->where('starts_at', '>=', $today->utc())
            ->pluck('starts_at')
            ->map(fn ($start) => CarbonImmutable::parse($start)->setTimezone(TrainerSlots::TIMEZONE)->toDateString())
            ->values();
    }
}
