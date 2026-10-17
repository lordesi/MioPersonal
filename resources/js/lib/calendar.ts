import type { CalendarEvent } from '@/types';

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

/** A session drawn in the calendar, confirmed or waiting for an answer. */
export type CalendarItem = {
    key: string;
    /** Rome day "YYYY-MM-DD". */
    date: string;
    /** Hours as numbers, 07:30 → 7.5. */
    from: number;
    to: number;
    /** The client's name. */
    title: string;
    /** The service, e.g. "Seduta singola". */
    detail: string;
    place: string;
    kind: 'confirmed' | 'pending';
};

/** The bookings of the server as calendar items, in Rome time. */
export function calendarItems(events: CalendarEvent[]): CalendarItem[] {
    return events.map((event) => {
        const start = romeParts(event.start);
        const end = romeParts(event.end);

        return {
            key: `event-${event.id}`,
            date: start.date,
            from: start.hour,
            // A session ending at midnight ends at 24, not at 0.
            to: end.date === start.date ? end.hour : 24,
            title: event.clientName,
            detail: event.serviceName,
            place: event.placeLabel,
            kind: event.kind,
        };
    });
}

/** "2026-10-15" → "2026-10-12", the Monday of its week. */
export function mondayOf(date: string): string {
    const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;

    return addDays(date, -weekday);
}

/** "2026-10" + 2 → "2026-12" */
export function shiftMonth(month: string, offset: number): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));

    return date.toISOString().slice(0, 7);
}

/** "2026-10" → "ottobre 2026" */
export function monthName(month: string): string {
    return new Intl.DateTimeFormat('it-IT', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${month}-15T12:00:00Z`));
}
