import { Link } from '@inertiajs/react';
import { ArrowRight, Check, ChevronRight, MapPin, X } from 'lucide-react';
import UserAvatar from '@/components/shared/user-avatar';
import { totalHours } from '@/components/trainer/area/day-view';
import { kindLabels } from '@/components/trainer/area/week-grid';
import type { CalendarItem } from '@/lib/calendar';
import { hourLabel, hoursAmountLabel, sessionsLabel } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatDayRange,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { availability, clients, requests } from '@/routes/trainer';

/** "13:00 – 14:00" */
function timeRange(item: CalendarItem): string {
    return `${hourLabel(item.from)} – ${hourLabel(item.to)}`;
}

/** The session chosen in the calendar, with the link to the client or to the requests. */
export function SessionDetails({
    item,
    today,
    onClose,
}: {
    item: CalendarItem;
    today: string;
    onClose: () => void;
}) {
    const confirmed = item.kind === 'confirmed';

    return (
        <section
            aria-labelledby="session-details-title"
            className="flex flex-col gap-4 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground"
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className={cn(
                        'inline-flex h-6.5 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold',
                        confirmed
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'border-[1.5px] border-dashed border-sidebar-primary',
                    )}
                >
                    {confirmed && (
                        <Check
                            aria-hidden="true"
                            className="size-3"
                            strokeWidth={3}
                        />
                    )}
                    {kindLabels[item.kind]}
                </span>
                <button
                    type="button"
                    aria-label="Chiudi dettagli"
                    onClick={onClose}
                    className="flex size-10 items-center justify-center rounded-full bg-sidebar-accent hover:bg-sidebar-border"
                >
                    <X
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={2.5}
                    />
                </button>
            </div>

            <div className="flex flex-col gap-0.5">
                <h2
                    id="session-details-title"
                    className="text-[30px] leading-9 font-bold tracking-[-0.03em] tabular-nums"
                >
                    {timeRange(item)}
                </h2>
                <span className="text-sm text-sidebar-muted-foreground">
                    {formatDayLong(item.date)}
                    {item.date === today && ' · oggi'}
                </span>
            </div>

            <div className="flex items-center gap-3 rounded-[14px] bg-sidebar-accent p-3">
                <UserAvatar
                    name={item.title}
                    size="lg"
                    className="size-10 text-[13px] [&_[data-slot=avatar-fallback]]:bg-sidebar-border [&_[data-slot=avatar-fallback]]:text-sidebar-foreground"
                />
                <span className="flex min-w-0 flex-col">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        {item.title}
                    </span>
                    <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground">
                        {item.detail}
                    </span>
                </span>
            </div>

            {item.place && (
                <span className="flex items-center gap-2 text-sm text-sidebar-foreground/85">
                    <MapPin aria-hidden="true" className="size-4 flex-none" />
                    {item.place}
                </span>
            )}

            {!confirmed && (
                <span className="text-[13px] leading-4.5 text-sidebar-muted-foreground">
                    Il cliente aspetta la tua risposta: accetta o rifiuta da
                    Richieste.
                </span>
            )}

            {confirmed && item.clientId !== null && (
                <Link
                    href={clients({ query: { cliente: item.clientId } })}
                    className="inline-flex h-11 items-center justify-center rounded-[10px] bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                >
                    Vedi cliente
                </Link>
            )}
            {!confirmed && (
                <Link
                    href={requests()}
                    className="inline-flex h-11 items-center justify-center rounded-[10px] bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                >
                    Vai alle richieste
                </Link>
            )}
        </section>
    );
}

/** "La settimana": sessions, hours and clients of the week of the chosen day. */
export function WeekSummary({
    days,
    items,
    selectedDay,
}: {
    days: string[];
    items: CalendarItem[];
    selectedDay: string;
}) {
    const weekItems = items.filter((item) => days.includes(item.date));
    const hours = totalHours(weekItems);
    const clients = new Set(
        weekItems.map((item) => item.clientId ?? item.title),
    ).size;
    const dayHours = days.map((date) =>
        totalHours(weekItems.filter((item) => item.date === date)),
    );
    const most = Math.max(...dayHours, 1);
    const stats = [
        { label: 'Sedute', value: String(weekItems.length) },
        {
            label: 'Ore',
            value: (Math.round(hours * 10) / 10).toLocaleString('it-IT'),
        },
        { label: 'Clienti', value: String(clients) },
    ];

    return (
        <section
            aria-labelledby="week-summary-title"
            className="flex flex-col gap-4 rounded-3xl border bg-card p-5.5"
        >
            <div className="flex flex-col gap-0.5">
                <h2 id="week-summary-title" className="text-base font-semibold">
                    La settimana
                </h2>
                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                    {formatDayRange(days[0], days[6])} {days[6].slice(0, 4)}
                </span>
            </div>

            <dl className="grid grid-cols-3 gap-2">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex flex-col-reverse gap-0.5 rounded-xl bg-secondary p-3"
                    >
                        <dt className="text-xs text-muted-foreground">
                            {stat.label}
                        </dt>
                        <dd className="text-[22px] leading-7 font-bold tabular-nums">
                            {stat.value}
                        </dd>
                    </div>
                ))}
            </dl>

            <div
                role="img"
                aria-label={`Ore di seduta per giorno: ${days
                    .map(
                        (date, index) =>
                            `${formatWeekdayShort(date)} ${hoursAmountLabel(dayHours[index])}`,
                    )
                    .join(', ')}`}
                className="grid h-21 grid-cols-7 items-end gap-2"
            >
                {days.map((date, index) => (
                    <span
                        key={date}
                        className="flex h-full flex-col items-center justify-end gap-1.5"
                    >
                        <span
                            className={cn(
                                'w-full max-w-7 rounded-md',
                                dayHours[index] > 0
                                    ? 'bg-foreground'
                                    : 'bg-border',
                                date === selectedDay &&
                                    dayHours[index] > 0 &&
                                    'ring-1 ring-foreground ring-offset-2 ring-offset-card',
                            )}
                            style={{
                                height:
                                    dayHours[index] > 0
                                        ? Math.max(
                                              6,
                                              (dayHours[index] / most) * 60,
                                          )
                                        : 4,
                            }}
                        />
                        <span className="text-[11px] leading-3.5 font-semibold text-muted-foreground">
                            {formatWeekdayShort(date).charAt(0)}
                        </span>
                    </span>
                ))}
            </div>
        </section>
    );
}

/** The black panel of the chosen day: how many sessions, and each one. */
export function DayPanel({
    date,
    items,
    today,
    onSelect,
}: {
    date: string;
    /** The sessions of the day, in order. */
    items: CalendarItem[];
    today: string;
    onSelect: (item: CalendarItem) => void;
}) {
    const hours = hoursAmountLabel(totalHours(items));

    return (
        <section
            aria-labelledby="day-panel-title"
            className="flex flex-col gap-3.5 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground"
        >
            <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground uppercase">
                    {date === today
                        ? 'Oggi'
                        : `${formatDayLong(date).split(' ')[0]} ${formatDayNumber(date)}`}
                </span>
                <h2
                    id="day-panel-title"
                    className="text-[28px] leading-8.5 font-bold tracking-[-0.03em] tabular-nums"
                >
                    {items.length > 0
                        ? sessionsLabel(items.length)
                        : 'Giornata libera'}
                </h2>
                <span className="text-sm text-sidebar-muted-foreground tabular-nums">
                    {items.length > 0
                        ? `${hourLabel(items[0].from)} – ${hourLabel(items[items.length - 1].to)} · ${hours}`
                        : formatDayLong(date)}
                </span>
            </div>

            {items.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {items.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onSelect(item)}
                            className="flex w-full items-center gap-3 rounded-[14px] bg-sidebar-accent p-3 text-left hover:bg-sidebar-border"
                        >
                            <span className="w-12 flex-none text-sm font-bold tabular-nums">
                                {hourLabel(item.from)}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-sm font-semibold">
                                    {item.title}
                                </span>
                                <span className="truncate text-xs text-sidebar-muted-foreground">
                                    {item.kind === 'pending'
                                        ? `Da confermare · ${item.detail}`
                                        : item.detail}
                                </span>
                            </span>
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4 flex-none text-muted-foreground"
                            />
                        </button>
                    ))}
                </div>
            ) : (
                <span className="rounded-[14px] bg-sidebar-accent p-3.5 text-sm text-sidebar-foreground/85">
                    Nessuna seduta. Giornata libera.
                </span>
            )}
        </section>
    );
}

/** "I tuoi orari aperti": the way to "Disponibilità". */
export function OpenHoursCard() {
    return (
        <section
            aria-labelledby="open-hours-title"
            className="flex flex-col gap-2 rounded-3xl border bg-card p-5.5"
        >
            <h2 id="open-hours-title" className="text-base font-semibold">
                I tuoi orari aperti
            </h2>
            <p className="text-sm text-muted-foreground">
                I clienti possono chiederti una seduta solo negli orari che apri
                in Disponibilità.
            </p>
            <Link
                href={availability()}
                className="mt-1.5 inline-flex h-10 items-center gap-2 self-start rounded-[10px] bg-foreground px-3.5 text-sm font-semibold text-background hover:bg-foreground/90"
            >
                Modifica orari
                <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
        </section>
    );
}
