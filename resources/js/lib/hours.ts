/**
 * The working hours of a day as ranges in minutes from midnight, on the half
 * hour: { start: 450, end: 720 } is 07:30–12:00 (App\Support\WorkingRanges).
 */
export type HourRange = { start: number; end: number };

/** 06:00: the first start. */
export const FIRST_MINUTE = 6 * 60;
/** 24:00: the last end. */
export const LAST_MINUTE = 24 * 60;
/** Ranges start and end on the hour or the half hour. */
export const STEP = 30;

/** 450 → "07:30"; 1440 → "24:00". */
export function timeLabel(minutes: number): string {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** "07:30–12:00". */
export function rangeLabel({ start, end }: HourRange): string {
    return `${timeLabel(start)}–${timeLabel(end)}`;
}

/** "07:30–12:00, 18:00–21:00"; "" for a closed day. */
export function dayRangesLabel(ranges: HourRange[], separator = ', '): string {
    return ranges.map(rangeLabel).join(separator);
}

/** The ranges in order, the ones that overlap or touch joined. */
export function normalizeRanges(ranges: HourRange[]): HourRange[] {
    const merged: HourRange[] = [];

    [...ranges]
        .filter((range) => range.end > range.start)
        .sort((a, b) => a.start - b.start)
        .forEach((range) => {
            const last = merged.at(-1);

            if (last && range.start <= last.end) {
                last.end = Math.max(last.end, range.end);
            } else {
                merged.push({ ...range });
            }
        });

    return merged;
}

/** Hours of a day: 07:30–12:00 → 4.5. */
export function dayHours(ranges: HourRange[]): number {
    return (
        ranges.reduce((total, range) => total + (range.end - range.start), 0) /
        60
    );
}

/** Total working hours in a week. */
export function weeklyHours(hours: HourRange[][]): number {
    return hours.reduce((total, day) => total + dayHours(day), 0);
}

/**
 * A day saved before the half hours (start hours, [7, 8, 9]) as ranges;
 * ranges are kept as they are.
 */
export function fromStartHours(day: (number | HourRange)[]): HourRange[] {
    return normalizeRanges(
        day.map((value) =>
            typeof value === 'number'
                ? { start: value * 60, end: value * 60 + 60 }
                : value,
        ),
    );
}

/** A new range after the last one of the day: 2 hours, where there is room. */
export function nextRange(ranges: HourRange[]): HourRange {
    const start = Math.min(ranges.at(-1)?.end ?? 9 * 60, LAST_MINUTE - STEP);

    return { start, end: Math.min(start + 120, LAST_MINUTE) };
}
