import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
    AreaSectionHeader,
    areaLinkClassName,
    areaTitleClassName,
    carbCardClassName,
} from '@/components/mp/area-bits';
import TrainerHeaderActions from '@/components/trainer/area/trainer-header-actions';
import DaySessionCard from '@/components/trainer/home/day-session-card';
import NextSessionHint from '@/components/trainer/home/next-session-hint';
import PackagesBlock from '@/components/trainer/home/packages-block';
import RequestCard from '@/components/trainer/home/request-card';
import StatsBlock from '@/components/trainer/home/stats-block';
import type { HomeViewProps } from '@/components/trainer/home/types';
import WeekStrip from '@/components/trainer/home/week-strip';
import { useIsMobile } from '@/hooks/use-mobile';
import { romeParts } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
    calendar,
    pastSessions,
    requests as requestsPage,
} from '@/routes/trainer';

/**
 * "Oggi" of the trainer (design "Trainer · Oggi · nuovo"): the greeting with
 * the date, the bell and the photo; the week, the requests to confirm, the
 * sessions of the chosen day, the numbers and the active packages. Desktop:
 * the week, the day and the numbers on the left; requests and packages in
 * the column on the right.
 */
export default function HomeView(props: HomeViewProps) {
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
    const isMobile = useIsMobile();
    const isToday = day === today;
    const nextElsewhere =
        next !== null && romeParts(next.start).date !== day ? next : null;

    const requestsBlock = requests.length > 0 && (
        <section
            aria-labelledby="requests-title"
            className="flex flex-col gap-3"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <h2
                        id="requests-title"
                        className="text-[22px] leading-7 font-bold tracking-[-0.02em]"
                    >
                        Da confermare
                    </h2>
                    <span
                        aria-label={
                            requests.length === 1
                                ? '1 richiesta da confermare'
                                : `${requests.length} richieste da confermare`
                        }
                        className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2.25 text-[15px] font-bold text-black tabular-nums"
                    >
                        {requests.length}
                    </span>
                </div>
                <Link href={requestsPage()} className={areaLinkClassName}>
                    Tutte
                </Link>
            </div>
            {isMobile ? (
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
            ) : (
                <div className="flex flex-col gap-2.5">
                    {requests.map((request) => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            busy={busyId !== null}
                            onConfirm={(weekly) =>
                                onAnswer(request, 'confirmed', weekly)
                            }
                            onDecline={() => onAnswer(request, 'declined')}
                        />
                    ))}
                </div>
            )}
        </section>
    );

    const agenda = (
        <section
            aria-labelledby="agenda-title"
            className="flex flex-col gap-2.5"
        >
            <AreaSectionHeader
                id="agenda-title"
                title={
                    isToday ? 'Prenotazioni di oggi' : 'Prenotazioni del giorno'
                }
                count={daySessions.length}
                link={{
                    label: 'Calendario',
                    href: calendar.url({ query: { giorno: day } }),
                }}
            />
            {!isToday && (
                <span className="-mt-2 text-[15px] text-muted-foreground">
                    {formatDayLong(day)}
                </span>
            )}
            {nextElsewhere && (
                <NextSessionHint session={nextElsewhere} onPick={onPickDay} />
            )}
            {daySessions.length === 0 ? (
                <p
                    className={cn(
                        carbCardClassName,
                        'px-4 py-5 text-[15px] text-muted-foreground',
                    )}
                >
                    Nessuna seduta in programma per questo giorno.
                </p>
            ) : (
                daySessions.map((session) => (
                    <DaySessionCard
                        key={session.id}
                        session={session}
                        next={session.id === nextId}
                        open={openId === session.id}
                        onToggle={() => onToggle(session.id)}
                        now={now}
                        showStart={!isMobile}
                    />
                ))
            )}
            {day < today && (
                <Link
                    href={pastSessions()}
                    className={cn(areaLinkClassName, 'self-start')}
                >
                    Tutte le sedute passate
                </Link>
            )}
        </section>
    );

    return (
        <>
            <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className={areaTitleClassName}>Ciao, {firstName}</h1>
                    <p className="mt-1.5 text-[15px] leading-5 text-muted-foreground md:text-[17px]">
                        {formatDayLong(today)}
                    </p>
                </div>
                <TrainerHeaderActions />
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-9 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-12">
                <div className="flex min-w-0 flex-col gap-9 lg:gap-8">
                    <section aria-label="Settimana">
                        <WeekStrip
                            week={week}
                            day={day}
                            today={today}
                            minDate={minDate}
                            maxDate={maxDate}
                            onPick={onPickDay}
                        />
                    </section>
                    {isMobile && requestsBlock}
                    {agenda}
                    <StatsBlock
                        stats={stats}
                        today={today}
                        onChange={onPeriod}
                    />
                    {isMobile && (
                        <PackagesBlock packages={packages} variant="tiles" />
                    )}
                </div>

                {!isMobile && (
                    <div className="flex min-w-0 flex-col gap-8">
                        {requestsBlock}
                        <PackagesBlock packages={packages} variant="tiles" />
                    </div>
                )}
            </div>
        </>
    );
}

/** The cards of "Da confermare" side by side, with the dots of the position. */
function Carousel({ count, children }: { count: number; children: ReactNode }) {
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
                <div aria-hidden="true" className="flex gap-1.5">
                    {Array.from({ length: count }, (_, dot) => (
                        <span
                            key={dot}
                            className={cn(
                                'h-1.5 rounded-full transition-all',
                                dot === index
                                    ? 'w-4.5 bg-foreground'
                                    : 'w-1.5 bg-[#2e3135]',
                            )}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
