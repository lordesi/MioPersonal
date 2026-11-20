<?php

namespace App\Support;

/**
 * The working hours of a day as ranges in minutes from midnight, on the
 * half hour: [450, 720] is 07:30–12:00. The page sends them as
 * {"start": 450, "end": 720}; the days of "Giorni e settimane diverse" are
 * saved as [450, 720] in `trainer_day_overrides.hours`.
 *
 * Until November 2026 a day was a list of whole start hours (18 = 18:00–19:00):
 * those values are still read, so the days already saved stay as they were.
 */
final class WorkingRanges
{
    /** 06:00: the first start. */
    public const FIRST = 360;

    /** 24:00: the last end. */
    public const LAST = 1440;

    /** Ranges start and end on the hour or the half hour. */
    public const STEP = 30;

    /**
     * One range from the page ({start, end}), from the database ([start, end])
     * or a whole start hour of the old format (18 → [1080, 1140]); null when
     * it is none of these.
     *
     * @return array{int, int}|null
     */
    public static function parse(mixed $value): ?array
    {
        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            $hour = (int) $value;

            return [$hour * 60, $hour * 60 + 60];
        }

        if (! is_array($value)) {
            return null;
        }

        $start = $value['start'] ?? $value[0] ?? null;
        $end = $value['end'] ?? $value[1] ?? null;

        if (! self::isWhole($start) || ! self::isWhole($end)) {
            return null;
        }

        return [(int) $start, (int) $end];
    }

    /** From 06:00 to 24:00, on the half hour, end after start. */
    public static function isValid(mixed $value): bool
    {
        $range = self::parse($value);

        if ($range === null) {
            return false;
        }

        [$start, $end] = $range;

        return $start >= self::FIRST && $end <= self::LAST && $start < $end
            && $start % self::STEP === 0 && $end % self::STEP === 0;
    }

    /**
     * The valid ranges of a day, in order, the ones that overlap or touch
     * joined: 07:00–09:00 and 09:00–10:30 → 07:00–10:30.
     *
     * @param  iterable<mixed>  $values
     * @return list<array{int, int}>
     */
    public static function normalize(iterable $values): array
    {
        $ranges = [];

        foreach ($values as $value) {
            $range = self::parse($value);

            if ($range !== null && self::isValid($range)) {
                $ranges[] = $range;
            }
        }

        usort($ranges, fn (array $a, array $b) => $a[0] <=> $b[0]);
        $merged = [];

        foreach ($ranges as [$start, $end]) {
            $last = array_key_last($merged);

            if ($last !== null && $start <= $merged[$last][1]) {
                $merged[$last][1] = max($merged[$last][1], $end);
            } else {
                $merged[] = [$start, $end];
            }
        }

        return $merged;
    }

    /**
     * The ranges for the page.
     *
     * @param  list<array{int, int}>  $ranges
     * @return list<array{start: int, end: int}>
     */
    public static function forPage(array $ranges): array
    {
        return array_map(fn (array $range) => ['start' => $range[0], 'end' => $range[1]], $ranges);
    }

    /** 450 → "07:30"; 1440 → "24:00" (a TIME column keeps it). */
    public static function time(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }

    /** "07:30" or "07:30:00" → 450. */
    public static function fromTime(string $time): int
    {
        return (int) substr($time, 0, 2) * 60 + (int) substr($time, 3, 2);
    }

    private static function isWhole(mixed $value): bool
    {
        return is_int($value) || (is_string($value) && ctype_digit($value));
    }
}
