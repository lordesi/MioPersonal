import type { CalendarItem } from '@/lib/calendar';

/**
 * Words shared by the calendar views (the grid itself is
 * calendar/time-grid.tsx).
 */

export const kindNames: Record<CalendarItem['kind'], string> = {
    confirmed: 'confermata',
    pending: 'da confermare',
};

/** The same at the start of a badge or a line. */
export const kindLabels: Record<CalendarItem['kind'], string> = {
    confirmed: 'Confermata',
    pending: 'Da confermare',
};

/** "Pacchetto 10 sedute · seduta 1 di 10" → "Pacchetto · 1 di 10": short for the blocks. */
export function shortService(service: string): string {
    const session = / · seduta (\d+ di \d+)$/u.exec(service);

    return session ? `Pacchetto · ${session[1]}` : service;
}
