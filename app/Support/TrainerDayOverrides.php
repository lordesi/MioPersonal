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
     * "Salva modifiche" of "Disponibilità": the days of "Per settimana" and
     * "Ferie e chiusure" changed on the page. `$days` get their own ranges
     * ([] = closed), the `$reset` dates go back to the weekly hours; the past
     * ones are deleted.
     *
     * @param  list<array{date: string, hours: array<mixed>, note?: string|null}>  $days
     * @param  list<string>  $reset
     */
    public static function apply(TrainerProfile $profile, array $days, array $reset): void
    {
        $now = now();
        $rows = array_map(fn (array $day) => [
            'trainer_profile_id' => $profile->id,
            'date' => $day['date'],
            'hours' => json_encode(WorkingRanges::normalize($day['hours'])),
            'note' => blank($day['note'] ?? null) ? null : trim((string) $day['note']),
            'created_at' => $now,
            'updated_at' => $now,
        ], $days);
        $dates = array_values(array_unique([...$reset, ...array_column($days, 'date')]));

        DB::transaction(function () use ($profile, $rows, $dates) {
            $profile->dayOverrides()->whereIn('date', $dates)->delete();
            self::deletePast($profile);
            TrainerDayOverride::query()->insert($rows);
        });
    }

    /**
     * The changes from today on, in blocks of days in a row with the same note
     * and both closed or both open, with the bookings already in those days
     * (they stay valid: the page says so).
     *
     * @return list<array{from: string, to: string, closed: bool, note: string|null, days: list<array{date: string, hours: list<array{start: int, end: int}>}>, bookings: int}>
     */
    public static function blocks(TrainerProfile $profile): array
    {
        $today = CarbonImmutable::now(TrainerSlots::TIMEZONE)->startOfDay();
        $overrides = $profile->dayOverrides()->where('date', '>=', $today->toDateString())->get();

        $bookings = self::bookingDays($profile, $today);
        $blocks = [];
        $previous = null;

        foreach ($overrides as $override) {
            $day = ['date' => $override->date->toDateString(), 'hours' => WorkingRanges::forPage(WorkingRanges::normalize($override->hours))];

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
