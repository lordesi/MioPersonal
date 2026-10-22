import { Link } from '@inertiajs/react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useId, useRef, useState } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import Panel from '@/components/trainer/area/panel';
import { addDays, romeParts, sessionsLabel } from '@/lib/calendar';
import {
    formatDayLong,
    formatDayNumber,
    formatTime,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { availability, calendar, clients, requests } from '@/routes/trainer';
import type { TrainerSession } from '@/types';

type WeekAgendaProps = {
    /** Confirmed and waiting sessions from today to the 7th day, in order. */
    sessions: TrainerSession[];
    /** Today in Rome, "YYYY-MM-DD". */
    today: string;
    days?: number;
};

/** "Agenda" of "Panoramica": a tab per day, the sessions of the chosen one. */
export default function WeekAgenda({
    sessions,
    today,
    days = 7,
}: WeekAgendaProps) {
    const panelId = useId();
    const dates = Array.from({ length: days }, (_, index) =>
        addDays(today, index),
    );
    const [selected, setSelected] = useState(today);
    const tabs = useRef<(HTMLButtonElement | null)[]>([]);

    const byDay = (date: string) =>
        sessions.filter((session) => romeParts(session.start).date === date);
    const daySessions = byDay(selected);

    // Arrows move between the days, as in every tab list.
    const onKeyDown = (event: KeyboardEvent, index: number) => {
        const offset = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

        if (offset === undefined) {
            return;
        }

        event.preventDefault();
        const next = (index + offset + days) % days;
        setSelected(dates[next]);
        tabs.current[next]?.focus();
    };

    return (
        <Panel
            title="Agenda"
            titleSize="lg"
            className="flex-[2_1_480px] gap-5"
            action={
                <Link
                    href={calendar()}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium hover:underline"
                >
                    Calendario completo
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            }
        >
            <div
                role="tablist"
                aria-label="Giorno"
                className="grid grid-cols-7 gap-1 md:gap-1.5"
            >
                {dates.map((date, index) => {
                    const count = byDay(date).length;
                    const active = date === selected;

                    return (
                        <button
                            key={date}
                            ref={(element) => {
                                tabs.current[index] = element;
                            }}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            aria-controls={panelId}
                            tabIndex={active ? 0 : -1}
                            aria-label={`${formatDayLong(date)}, ${count ? sessionsLabel(count) : 'nessuna seduta'}`}
                            onClick={() => setSelected(date)}
                            onKeyDown={(event) => onKeyDown(event, index)}
                            className={cn(
                                'flex flex-col items-center gap-0.5 rounded-[14px] border pt-2.5 pb-2',
                                active
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'bg-card hover:bg-secondary',
                            )}
                        >
                            <span className="text-xs font-medium opacity-75">
                                {formatWeekdayShort(date)}
                            </span>
                            <span className="text-xl font-bold tabular-nums">
                                {formatDayNumber(date)}
                            </span>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'size-1.5 rounded-full',
                                    count === 0
                                        ? 'bg-transparent'
                                        : active
                                          ? 'bg-background'
                                          : 'bg-foreground',
                                )}
                            />
                        </button>
                    );
                })}
            </div>

            <div
                id={panelId}
                role="tabpanel"
                aria-label={formatDayLong(selected)}
                className="flex flex-col gap-2"
            >
                <span className="text-[13px] leading-4.5 font-semibold text-muted-foreground tabular-nums">
                    {formatDayLong(selected)}
                    {daySessions.length > 0 &&
                        ` · ${sessionsLabel(daySessions.length)}`}
                </span>

                {daySessions.length > 0 ? (
                    <ul className="overflow-hidden rounded-[14px] border">
                        {daySessions.map((session) => (
                            <li
                                key={session.id}
                                className="border-b last:border-b-0"
                            >
                                <AgendaRow session={session} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-start gap-1.5 rounded-[14px] border border-dashed border-input p-5">
                        <span className="text-[15px] leading-5.5 font-semibold">
                            Giornata libera
                        </span>
                        <span className="text-sm text-muted-foreground">
                            Nessuna seduta in programma. Se vuoi ricevere
                            richieste per questo giorno, controlla di avere slot
                            aperti.
                        </span>
                        <Link
                            href={availability()}
                            className="mt-1 text-sm font-semibold underline"
                        >
                            Apri disponibilità
                        </Link>
                    </div>
                )}
            </div>
        </Panel>
    );
}

/** A session of the day: the confirmed ones open the client, the requests "Richieste". */
function AgendaRow({ session }: { session: TrainerSession }) {
    const pending = session.kind === 'pending';
    const href = pending
        ? requests()
        : session.clientId !== null
          ? clients({ query: { cliente: session.clientId } })
          : null;

    const content = (
        <>
            <span className="flex w-14 flex-none flex-col tabular-nums md:w-16">
                <span className="text-[15px] leading-5.5 font-bold">
                    {formatTime(session.start)}
                </span>
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    {formatTime(session.end)}
                </span>
            </span>
            <span
                aria-hidden="true"
                className={cn(
                    'w-0.75 flex-none self-stretch rounded-full',
                    pending ? 'bg-muted-foreground/40' : 'bg-foreground',
                )}
            />
            <UserAvatar
                name={session.clientName}
                size="md"
                className="hidden size-10 sm:flex [&_[data-slot=avatar-fallback]]:bg-secondary"
            />
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] leading-5.5 font-semibold">
                    {session.clientName}
                </span>
                <span className="text-[13px] leading-4.5 text-muted-foreground">
                    {session.serviceName}
                    {session.placeLabel && ` · ${session.placeLabel}`}
                </span>
            </span>
            <span
                className={cn(
                    'inline-flex h-6.5 flex-none items-center rounded-full px-2.5 text-xs font-semibold',
                    pending
                        ? 'border border-dashed border-input'
                        : 'bg-foreground text-background',
                )}
            >
                {pending ? 'Da confermare' : 'Confermata'}
            </span>
            {href && (
                <ChevronRight
                    aria-hidden="true"
                    className="size-4 flex-none text-muted-foreground"
                />
            )}
        </>
    );

    const classes = 'flex items-center gap-3 px-4 py-3.5 md:gap-3.5';

    return href ? (
        <Link href={href} className={cn(classes, 'hover:bg-secondary/60')}>
            {content}
        </Link>
    ) : (
        <div className={classes}>{content}</div>
    );
}
