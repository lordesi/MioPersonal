import { hourLabel } from '@/lib/calendar';
import type { CalendarItem } from '@/lib/calendar';
import { formatPrice } from '@/lib/format';

/**
 * How a session of the calendar is drawn (design "Trainer · Calendario ·
 * nuovo"): done (over), next (the first one still to come today), ok
 * (confirmed), wait (waiting for an answer) and gone (cancelled just now).
 */
export type SessionKind = 'done' | 'next' | 'ok' | 'wait' | 'gone';

/** The tones of the badge on the right of a row. */
export type BadgeTone = 'neutral' | 'solid' | 'outline' | 'brand';

/** The design's hours of the day: 07:00 to 20:00. */
export const FIRST_HOUR = 7;
export const LAST_HOUR = 20;

/** The confirmed session of today still to come (or going on) that comes first. */
export function nextSessionId(
    items: CalendarItem[],
    today: string,
    now: Date,
): number | null {
    const next = items
        .filter(
            (item) =>
                item.kind === 'confirmed' &&
                item.date === today &&
                new Date(item.end) > now,
        )
        .sort((a, b) => a.from - b.from)[0];

    return next?.id ?? null;
}

export function sessionKind(
    item: CalendarItem,
    now: Date,
    nextId: number | null,
    gone: boolean,
): SessionKind {
    if (gone) {
        return 'gone';
    }

    if (item.kind === 'pending') {
        return 'wait';
    }

    if (new Date(item.end) <= now) {
        return 'done';
    }

    return item.id === nextId ? 'next' : 'ok';
}

/** "Tra 1 h 30", "Tra 20 min"; "In corso" once it has started. */
export function untilLabel(start: string, now: Date): string {
    const minutes = Math.round(
        (new Date(start).getTime() - now.getTime()) / 60000,
    );

    if (minutes <= 0) {
        return 'In corso';
    }

    if (minutes < 60) {
        return `Tra ${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return rest === 0 ? `Tra ${hours} h` : `Tra ${hours} h ${rest}`;
}

/** The badge of a row; null for a session done (a check instead). */
export function sessionBadge(
    item: CalendarItem,
    kind: SessionKind,
    now: Date,
): { label: string; tone: BadgeTone } | null {
    switch (kind) {
        case 'done':
            return null;
        case 'next':
            return { label: untilLabel(item.start, now), tone: 'solid' };
        case 'wait':
            return { label: 'Da confermare', tone: 'outline' };
        case 'gone':
            return { label: 'Annullata', tone: 'neutral' };
        default:
            return { label: 'Confermata', tone: 'neutral' };
    }
}

/** The background and ring of a session (`sesStyle` of the design). */
export function sessionSurface(kind: SessionKind, selected: boolean): string {
    if (selected) {
        return 'bg-[#1C1E21] text-foreground shadow-[inset_0_0_0_2px_#42D7D9]';
    }

    switch (kind) {
        case 'done':
            return 'bg-[#0B0C0D] text-muted-foreground';
        case 'next':
            return 'bg-[#121315] text-foreground shadow-[inset_0_0_0_1.5px_#42D7D9]';
        case 'wait':
            return 'bg-[#121315] text-foreground shadow-[inset_0_0_0_1.5px_#B9A6FF]';
        default:
            return 'bg-[#121315] text-foreground';
    }
}

const monthShort = new Intl.DateTimeFormat('it-IT', {
    month: 'short',
    timeZone: 'UTC',
});
const weekdayShort = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    timeZone: 'UTC',
});

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "2026-11-18" → "Mer 18 nov". */
export function shortDay(date: string): string {
    const day = new Date(`${date}T12:00:00Z`);

    return `${capitalize(weekdayShort.format(day).replace('.', ''))} ${day.getUTCDate()} ${monthShort.format(day).replace('.', '')}`;
}

/** "Mer 18 nov, 12:00–13:00": QUANDO in the details. */
export function whenLabel(item: CalendarItem): string {
    return `${shortDay(item.date)}, ${hourLabel(item.from)}–${hourLabel(item.to)}`;
}

/** "Boxe · 10 di 10" → "Boxe": SEDUTA in the details. */
export function serviceShort(item: CalendarItem): string {
    return item.detail.split(' · ')[0];
}

/** PAGAMENTO: "Pacchetto, seduta 3 di 10", "45 €" or "Gratuita". */
export function paymentLabel(item: CalendarItem): string {
    if (item.package) {
        return `Pacchetto, seduta ${item.package.position} di ${item.package.total}`;
    }

    return item.priceCents === 0 ? 'Gratuita' : formatPrice(item.priceCents);
}

/** "Stefano Leone" → "Stefano". */
export function firstName(name: string): string {
    return name.trim().split(/\s+/u)[0] ?? name;
}

/**
 * The hours of the day and of the week: 07:00–20:00, wider when a session
 * starts earlier or ends later, so that none is left out.
 */
export function hourRange(items: CalendarItem[]): number[] {
    const first = Math.min(
        FIRST_HOUR,
        ...items.map((item) => Math.floor(item.from)),
    );
    const last = Math.max(
        LAST_HOUR,
        ...items.map((item) => Math.ceil(item.to) - 1),
    );

    return Array.from(
        { length: last - first + 1 },
        (_, index) => first + index,
    );
}
