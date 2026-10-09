const LOCALE = 'it-IT';

/**
 * Format a price stored in integer cents, e.g. 4500 → "45 €", 4550 → "45,50 €".
 */
export function formatPrice(cents: number): string {
    return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

/**
 * Format an average rating with one decimal, e.g. 4.9 → "4,9".
 */
export function formatRating(rating: number): string {
    return rating.toLocaleString(LOCALE, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
}

/** All dates are shown in Milan time, whatever the visitor's device says. */
const TIME_ZONE = 'Europe/Rome';

function part(date: Date, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(LOCALE, {
        timeZone: TIME_ZONE,
        ...options,
    }).format(date);
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "YYYY-MM-DD" (a Rome calendar day) → Date at midday, safe in any time zone. */
function fromDateString(date: string): Date {
    return new Date(`${date}T12:00:00Z`);
}

/** "2026-10-06" → "Mar" */
export function formatWeekdayShort(date: string): string {
    return capitalize(part(fromDateString(date), { weekday: 'short' }));
}

/** "2026-10-06" → "6" */
export function formatDayNumber(date: string): string {
    return part(fromDateString(date), { day: 'numeric' });
}

/** "2026-10-06" → "Martedì 6 ottobre" */
export function formatDayLong(date: string): string {
    const day = fromDateString(date);

    return capitalize(
        `${part(day, { weekday: 'long' })} ${part(day, { day: 'numeric' })} ${part(day, { month: 'long' })}`,
    );
}

/** ("2026-10-06", "2026-10-12") → "6 – 12 ottobre"; across months → "27 ottobre – 2 novembre" */
export function formatDayRange(first: string, last: string): string {
    const start = fromDateString(first);
    const end = fromDateString(last);
    const startMonth = part(start, { month: 'long' });
    const endMonth = part(end, { month: 'long' });
    const startDay = part(start, { day: 'numeric' });
    const endDay = part(end, { day: 'numeric' });

    return startMonth === endMonth
        ? `${startDay} – ${endDay} ${endMonth}`
        : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

/** ISO UTC → "Giovedì 8 ottobre" */
export function formatDateLong(iso: string): string {
    return formatDayLong(romeDay(new Date(iso)));
}

/** ISO UTC → "Gio 8 ottobre" */
export function formatDateMedium(iso: string): string {
    const date = new Date(iso);

    return `${capitalize(part(date, { weekday: 'short' }))} ${part(date, { day: 'numeric' })} ${part(date, { month: 'long' })}`;
}

/** ISO UTC start + hours → ISO UTC end */
export function addHours(iso: string, hours: number): string {
    return new Date(
        new Date(iso).getTime() + hours * 60 * 60 * 1000,
    ).toISOString();
}

/** ISO UTC start + hours → "18:00–19:00" in Rome time */
export function formatTimeRange(start: string, hours: number): string {
    const from = new Date(start);
    const to = new Date(from.getTime() + hours * 60 * 60 * 1000);
    const time = (date: Date) =>
        part(date, { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${time(from)}–${time(to)}`;
}

/** ISO UTC start + hours → "Mar 6 ott · 18:00–19:00" */
export function formatSlot(start: string, hours: number): string {
    return `${formatDayShort(start)} · ${formatTimeRange(start, hours)}`;
}

/** ISO UTC → "Mar 6 ott" */
export function formatDayShort(iso: string): string {
    const date = new Date(iso);

    return `${capitalize(part(date, { weekday: 'short' }))} ${part(date, { day: 'numeric' })} ${part(date, { month: 'short' })}`;
}

/** ISO UTC → "07:30" */
export function formatTime(iso: string): string {
    return part(new Date(iso), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

/** ISO UTC → { weekday: "sab", day: "10", month: "ott" }, for the date block. */
export function dateBlockParts(iso: string): {
    weekday: string;
    day: string;
    month: string;
} {
    const date = new Date(iso);

    return {
        weekday: part(date, { weekday: 'short' }),
        day: part(date, { day: 'numeric' }),
        month: part(date, { month: 'short' }),
    };
}

/** ISO UTC → "ven 9 ottobre alle 10:00" */
export function formatDayTimeLong(iso: string): string {
    const date = new Date(iso);

    return `${part(date, { weekday: 'short' })} ${part(date, { day: 'numeric' })} ${part(date, { month: 'long' })} alle ${formatTime(iso)}`;
}

/** The Rome calendar day of a moment, "YYYY-MM-DD". */
function romeDay(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

/** ISO UTC → "oggi, 19:00", "domani, 18:00" or "mar 6, 18:00" */
export function formatRelativeSlot(iso: string, now = new Date()): string {
    const date = new Date(iso);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let day = `${part(date, { weekday: 'short' })} ${part(date, { day: 'numeric' })}`;

    if (romeDay(date) === romeDay(now)) {
        day = 'oggi';
    } else if (romeDay(date) === romeDay(tomorrow)) {
        day = 'domani';
    }

    return `${day}, ${formatTime(iso)}`;
}

/** "2026-12-31" → "al 31 dicembre"; "2026-12-08" → "all'8 dicembre" */
export function formatUntilDay(date: string): string {
    const day = fromDateString(date);
    const number = part(day, { day: 'numeric' });
    const preposition = ['1', '8', '11'].includes(number) ? "all'" : 'al ';

    return `${preposition}${number} ${part(day, { month: 'long' })}`;
}

/** Whole hours from now until an ISO UTC moment (never negative). */
export function hoursUntil(iso: string, now = new Date()): number {
    const hours = (new Date(iso).getTime() - now.getTime()) / (60 * 60 * 1000);

    return Math.max(0, Math.round(hours));
}

/** 23 → "23 ore", 1 → "1 ora", 0 → "meno di un'ora" */
export function formatHoursLeft(hours: number): string {
    return hours < 1 ? "meno di un'ora" : formatHours(hours);
}

/** 5 → "5 h", 26 → "1 giorno", 50 → "2 giorni", for "Scade tra …" */
export function formatHoursShort(hours: number): string {
    if (hours < 1) {
        return "meno di un'ora";
    }

    if (hours < 24) {
        return `${hours} h`;
    }

    const days = Math.floor(hours / 24);

    return `${days} ${days === 1 ? 'giorno' : 'giorni'}`;
}

/** 0.0577 → "5,8%" */
export function formatPercent(ratio: number): string {
    return ratio.toLocaleString(LOCALE, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
}

/** 1 → "1 ora", 2 → "2 ore" */
export function formatHours(hours: number): string {
    return hours === 1 ? '1 ora' : `${hours} ore`;
}

/** ISO UTC → "Oggi", "Domani" or "Gio 8 ott" */
export function formatDayRelative(iso: string, now = new Date()): string {
    const date = new Date(iso);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (romeDay(date) === romeDay(now)) {
        return 'Oggi';
    }

    if (romeDay(date) === romeDay(tomorrow)) {
        return 'Domani';
    }

    return formatDayShort(iso);
}

/** ISO UTC → "oggi", "ieri", "2 giorni fa" within a week, then "luglio 2026" */
export function formatPastDate(iso: string, now = new Date()): string {
    const date = new Date(iso);
    const days = Math.round(
        (new Date(`${romeDay(now)}T12:00:00Z`).getTime() -
            new Date(`${romeDay(date)}T12:00:00Z`).getTime()) /
            (24 * 60 * 60 * 1000),
    );

    if (days <= 0) {
        return 'oggi';
    }

    if (days === 1) {
        return 'ieri';
    }

    if (days < 7) {
        return `${days} giorni fa`;
    }

    return part(date, { month: 'long', year: 'numeric' });
}

/** ISO UTC → "5 ore fa", "ieri", "3 giorni fa", then "2 settimane fa" */
export function formatAgo(iso: string, now = new Date()): string {
    const hours = Math.floor(
        (now.getTime() - new Date(iso).getTime()) / (60 * 60 * 1000),
    );

    if (hours < 1) {
        return 'adesso';
    }

    if (hours < 24) {
        return hours === 1 ? "un'ora fa" : `${hours} ore fa`;
    }

    const days = Math.floor(hours / 24);

    if (days === 1) {
        return 'ieri';
    }

    if (days < 7) {
        return `${days} giorni fa`;
    }

    const weeks = Math.floor(days / 7);

    return weeks === 1 ? '1 settimana fa' : `${weeks} settimane fa`;
}

/** ISO UTC → "9 set, 18:42" */
export function formatDayMonthTime(iso: string): string {
    const date = new Date(iso);

    return `${part(date, { day: 'numeric' })} ${part(date, { month: 'short' })}, ${formatTime(iso)}`;
}

/** ISO UTC → "2 ott 2026" */
export function formatDateShortYear(iso: string): string {
    const date = new Date(iso);

    return `${part(date, { day: 'numeric' })} ${part(date, { month: 'short' })} ${part(date, { year: 'numeric' })}`;
}

/** ISO UTC → "7 novembre" */
export function formatDayMonth(iso: string): string {
    const date = new Date(iso);

    return `${part(date, { day: 'numeric' })} ${part(date, { month: 'long' })}`;
}

/** "2026-09-24" (a Rome calendar day) → "24 set" */
export function formatDayMonthShort(date: string): string {
    const day = fromDateString(date);

    return `${part(day, { day: 'numeric' })} ${part(day, { month: 'short' })}`;
}
