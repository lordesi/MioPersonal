import { Link } from '@inertiajs/react';
import { useId } from 'react';
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
    panelClassName,
    softButtonClassName,
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
 * "Home" on desktop (Dashboard B): the week in the header panel; on the
 * left the requests and the sessions of the chosen day, on the right the
 * numbers and the active packages.
 */
export default function HomeDesktop(props: HomeViewProps) {
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
        <div className="flex max-w-300 flex-col gap-7">
            <header
                className={cn(
                    panelClassName,
                    'flex flex-wrap items-center gap-6 px-5 py-4',
                )}
            >
                <div className="flex min-w-50 flex-col gap-0.5">
                    <h1 className={pageTitleClassName}>Ciao, {firstName}</h1>
                    <span className="text-[15px] text-muted-foreground">
                        {formatDayLong(day)}
                    </span>
                </div>
                <div className="flex min-w-105 flex-[1_1_420px]">
                    <WeekStrip
                        week={week}
                        day={day}
                        today={today}
                        minDate={minDate}
                        maxDate={maxDate}
                        onPick={onPickDay}
                        size="lg"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={isToday}
                        onClick={() => onPickDay(today)}
                        className={softButtonClassName}
                    >
                        Oggi
                    </button>
                    <NotificationBell
                        tone="dark"
                        className="size-11 rounded-full border border-[#3a3a3a]"
                    />
                </div>
            </header>

            <AppNotificationsCard
                title="Ricevi subito le nuove richieste"
                description="Una notifica sul telefono appena un cliente prenota: chi risponde prima conferma più sedute."
                dismissKey="trainer-today"
            />

            <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] items-start gap-8">
                <div className="flex flex-col gap-7">
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
                                tone={requests.length > 0 ? 'brand' : 'neutral'}
                            />
                            <Link
                                href={requestsPage()}
                                className="ml-auto text-[15px] font-semibold text-brand"
                            >
                                Richieste gestite
                            </Link>
                        </div>
                        {requests.length === 0 ? (
                            <p className="rounded-full bg-card px-4.5 py-3 text-[15px] text-muted-foreground">
                                Nessuna richiesta da confermare
                            </p>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
                                {requests.map((request) => (
                                    <RequestCard
                                        key={request.id}
                                        request={request}
                                        busy={busyId !== null}
                                        onConfirm={(weekly) =>
                                            onAnswer(
                                                request,
                                                'confirmed',
                                                weekly,
                                            )
                                        }
                                        onDecline={() =>
                                            onAnswer(request, 'declined')
                                        }
                                        className="bg-card shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <section
                        aria-labelledby={agendaId}
                        className="flex flex-col gap-3"
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
                                className="ml-auto text-[15px] font-semibold text-brand"
                            >
                                Apri il calendario
                            </Link>
                        </div>
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
                            <div className="flex flex-col gap-2">
                                {daySessions.map((session) => (
                                    <DaySessionCard
                                        key={session.id}
                                        session={session}
                                        next={session.id === nextId}
                                        open={openId === session.id}
                                        onToggle={() => onToggle(session.id)}
                                        now={now}
                                        showStart
                                    />
                                ))}
                            </div>
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
                </div>

                <div className={cn(panelClassName, 'flex flex-col gap-7 p-5')}>
                    <StatsBlock
                        stats={stats}
                        today={today}
                        onChange={onPeriod}
                        size="lg"
                    />
                    <PackagesBlock packages={packages} variant="rows" />
                </div>
            </div>
        </div>
    );
}
