import { addDays } from '@/lib/calendar';
import type { HourRange } from '@/lib/hours';
import type { TrainerDayOverrideBlock } from '@/types';

/**
 * The days of "Disponibilità" with their own hours instead of the weekly
 * ones (App\Support\TrainerDayOverrides), by Rome date: [] = closed.
 */
export type DayChanges = Record<
    string,
    { hours: HourRange[]; note: string | null }
>;

/** The days of the blocks from the server, one by one. */
export function dayChanges(blocks: TrainerDayOverrideBlock[]): DayChanges {
    const days: DayChanges = {};

    blocks.forEach((block) =>
        block.days.forEach((day) => {
            days[day.date] = { hours: day.hours, note: block.note };
        }),
    );

    return days;
}

const sameHours = (a: HourRange[], b: HourRange[]) =>
    a.length === b.length &&
    a.every(
        (range, index) =>
            range.start === b[index].start && range.end === b[index].end,
    );

/** Two values of a day are the same: same ranges and same note. */
export function sameDay(
    a: DayChanges[string] | undefined,
    b: DayChanges[string] | undefined,
): boolean {
    if (!a || !b) {
        return a === b;
    }

    return a.note === b.note && sameHours(a.hours, b.hours);
}

/**
 * What "Salva modifiche" sends: the days set or changed since `saved`, and
 * the dates that go back to the weekly hours (TrainerAvailabilityRequest).
 */
export function changesPayload(saved: DayChanges, current: DayChanges) {
    return {
        days: Object.keys(current)
            .sort()
            .filter((date) => !sameDay(saved[date], current[date]))
            .map((date) => ({ date, ...current[date] })),
        reset: Object.keys(saved)
            .sort()
            .filter((date) => !(date in current)),
    };
}

/** A day back to the weekly hours when it has them again, otherwise set. */
export function setDay(
    days: DayChanges,
    date: string,
    hours: HourRange[],
    weekly: HourRange[],
    note: string | null = null,
): DayChanges {
    const next = { ...days };

    if (note === null && sameHours(hours, weekly)) {
        delete next[date];
    } else {
        next[date] = { hours, note };
    }

    return next;
}

export type ClosedBlock = {
    from: string;
    to: string;
    note: string | null;
    dates: string[];
};

/** "Ferie e chiusure": the closed days in a row with the same note. */
export function closedBlocks(days: DayChanges): ClosedBlock[] {
    const blocks: ClosedBlock[] = [];

    Object.keys(days)
        .sort()
        .filter((date) => days[date].hours.length === 0)
        .forEach((date) => {
            const last = blocks.at(-1);

            if (
                last &&
                addDays(last.to, 1) === date &&
                last.note === days[date].note
            ) {
                last.to = date;
                last.dates.push(date);
            } else {
                blocks.push({
                    from: date,
                    to: date,
                    note: days[date].note,
                    dates: [date],
                });
            }
        });

    return blocks;
}

/** Every date from `from` to `to`, both included. */
export function datesBetween(from: string, to: string): string[] {
    const dates: string[] = [];

    for (let date = from; date <= to; date = addDays(date, 1)) {
        dates.push(date);
    }

    return dates;
}
