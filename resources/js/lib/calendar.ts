/** Date helpers for the trainer calendar. Every day is a Rome calendar day. */

const TIME_ZONE = 'Europe/Rome';

const romeFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

/** ISO UTC → Rome day "YYYY-MM-DD" and hour as a number (07:30 → 7.5). */
export function romeParts(iso: string | Date): { date: string; hour: number } {
    const parts = Object.fromEntries(
        romeFormatter
            .formatToParts(typeof iso === 'string' ? new Date(iso) : iso)
            .map((part) => [part.type, part.value]),
    );

    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        hour: Number(parts.hour) + Number(parts.minute) / 60,
    };
}

/** "2026-10-05" + 3 → "2026-10-08" */
export function addDays(date: string, days: number): string {
    const day = new Date(`${date}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + days);

    return day.toISOString().slice(0, 10);
}

/** The 7 days of the week starting on `monday`. */
export function weekDates(monday: string): string[] {
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Cells of a month grid starting on Monday: null for the blank cells. */
export function monthCells(year: number, month: number): (string | null)[] {
    const first = new Date(Date.UTC(year, month - 1, 1, 12));
    const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
    const leading = (first.getUTCDay() + 6) % 7;
    const cells: (string | null)[] = Array.from(
        { length: leading },
        () => null,
    );

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(
            `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        );
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
}

/** 7.5 → "07:30" */
export function hourLabel(hour: number): string {
    const whole = Math.floor(hour);
    const minutes = Math.round((hour - whole) * 60);

    return `${String(whole).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** 0 → "Nessuna seduta", 1 → "1 seduta", 4 → "4 sedute" */
export function sessionsLabel(count: number): string {
    if (count === 0) {
        return 'Nessuna seduta';
    }

    return count === 1 ? '1 seduta' : `${count} sedute`;
}

/** Anything drawn in the calendar: sessions, imported appointments, blocks. */
export type CalendarItem = {
    key: string;
    /** Rome day "YYYY-MM-DD". */
    date: string;
    /** Hours as numbers, 07:30 → 7.5. */
    from: number;
    to: number;
    title: string;
    detail: string;
    place: string;
    kind: 'confirmed' | 'pending' | 'busy' | 'block';
};

/** Key of a one-hour block the trainer made unbookable. */
export function blockKey(date: string, hour: number): string {
    return `${date}-${hour}`;
}
