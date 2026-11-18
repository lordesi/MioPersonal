import { Link } from '@inertiajs/react';
import { useId, useRef, useState } from 'react';
import NotificationBell from '@/components/layout/notification-bell';
import AppNotificationsCard from '@/components/pwa/app-notifications-card';
import DaySessionCard from '@/components/trainer/home/day-session-card';
import NextSessionHint from '@/components/trainer/home/next-session-hint';
import PackagesBlock from '@/components/trainer/home/packages-block';
import RequestCard from '@/components/trainer/home/request-card';
import StatsBlock from '@/components/trainer/home/stats-block';
import type { HomeViewProps } from '@/components/trainer/home/types';
import WeekStrip from '@/components/trainer/home/week-strip';
import { CountChip, EmptyBox } from '@/components/trainer/ui/bits';
import {
    blockTitleClassName,
    pageTitleClassName,
} from '@/components/trainer/ui/styles';
import { romeParts } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
    calendar,
    pastSessions,
    requests as requestsPage,
} from '@/routes/trainer';

/**
 * "Home" on phones (Dashboard 2): greeting and bell, the week, the requests
 * to confirm in a carousel, the sessions of the chosen day, the numbers and
 * the active packages.
 */
export default function HomeMobile(props: HomeViewProps) {
    const {
        firstName,
        today,
        day,
        minDate,
        maxDate,
        next,
        requests,
        week,
        daySessions,
        packages,
        stats,
        now,
        busyId,
        onAnswer,
        onPickDay,
        onPeriod,
        openId,
        onToggle,
        nextId,
    } = props;
    const requestsId = useId();
    const agendaId = useId();
    const isToday = day === today;
    const nextElsewhere =
        next !== null && romeParts(next.start).date !== day ? next : null;

    return (
        <>
            <header className="flex min-h-14 items-center justify-between gap-3">
                <h1 className={pageTitleClassName}>Ciao, {firstName}</h1>
                <NotificationBell
                    tone="dark"
                    className="size-11 rounded-full border border-white/35"
                />
            </header>

            <section aria-label="Settimana" className="-mt-3">
                <WeekStrip
                    week={week}
                    day={day}
                    today={today}
                    minDate={minDate}
                    maxDate={maxDate}
                    onPick={onPickDay}
                />
            </section>

            {requests.length > 0 && (
                <section
                    aria-labelledby={requestsId}
                    className="flex flex-col gap-3"
                >
                    <div className="flex items-center gap-2.5">
                        <h2 id={requestsId} className={blockTitleClassName}>
                            Da confermare
                        </h2>
                        <CountChip
                            count={requests.length}
                            tone="brand"
                            label={
                                requests.length === 1
                                    ? '1 richiesta da confermare'
                                    : `${requests.length} richieste da confermare`
                            }
                        />
                        <Link
                            href={requestsPage()}
                            className="ml-auto flex min-h-11 items-center text-[15px] font-semibold text-brand"
                        >
                            Tutte
                        </Link>
                    </div>
                    <Carousel count={requests.length}>
                        {requests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                busy={busyId !== null}
                                onConfirm={(weekly) =>
                                    onAnswer(request, 'confirmed', weekly)
                                }
                                onDecline={() => onAnswer(request, 'declined')}
                                className="w-75 shrink-0 snap-start"
                            />
                        ))}
                    </Carousel>
                </section>
            )}

            <AppNotificationsCard
                title="Ricevi subito le nuove richieste"
                description="Una notifica sul telefono appena un cliente prenota: chi risponde prima conferma più sedute."
                dismissKey="trainer-today"
            />

            <section
                aria-labelledby={agendaId}
                className="flex flex-col gap-2.5"
            >
                <div className="flex items-center gap-2.5">
                    <h2 id={agendaId} className={blockTitleClassName}>
                        {isToday
                            ? 'Prenotazioni di oggi'
                            : 'Prenotazioni del giorno'}
                    </h2>
                    <CountChip count={daySessions.length} />
                    <Link
                        href={calendar.url({ query: { giorno: day } })}
                        className="ml-auto flex min-h-11 items-center text-[15px] font-semibold text-brand"
                    >
                        Calendario
                    </Link>
                </div>
                {!isToday && (
                    <span className="-mt-2 text-[15px] text-muted-foreground">
                        {formatDayLong(day)}
                    </span>
                )}
                {nextElsewhere && (
                    <NextSessionHint
                        session={nextElsewhere}
                        onPick={onPickDay}
                    />
                )}
                {daySessions.length === 0 ? (
                    <EmptyBox>
                        Nessuna seduta in programma per questo giorno.
                    </EmptyBox>
                ) : (
                    daySessions.map((session) => (
                        <DaySessionCard
                            key={session.id}
                            session={session}
                            next={session.id === nextId}
                            open={openId === session.id}
                            onToggle={() => onToggle(session.id)}
                            now={now}
                        />
                    ))
                )}
                {day < today && (
                    <Link
                        href={pastSessions()}
                        className="self-start text-[15px] font-semibold text-brand"
                    >
                        Tutte le sedute passate
                    </Link>
                )}
            </section>

            <StatsBlock stats={stats} today={today} onChange={onPeriod} />

            <PackagesBlock packages={packages} variant="tiles" />
        </>
    );
}

/** The cards of "Da confermare" side by side, with the dots of the position. */
function Carousel({
    count,
    children,
}: {
    count: number;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);

    return (
        <>
            <div
                ref={ref}
                onScroll={(event) => {
                    const target = event.currentTarget;
                    const width = target.scrollWidth / Math.max(count, 1);
                    setIndex(Math.round(target.scrollLeft / width));
                }}
                className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden"
            >
                {children}
            </div>
            {count > 1 && (
                <div aria-hidden="true" className="flex justify-center gap-1.5">
                    {Array.from({ length: count }, (_, dot) => (
                        <span
                            key={dot}
                            className={cn(
                                'h-1.5 rounded-full transition-all',
                                dot === index
                                    ? 'w-4.5 bg-foreground'
                                    : 'w-1.5 bg-[#3a3a3a]',
                            )}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
