import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import type { RequestAnswer } from '@/components/trainer/dashboard/booking-request-card';
import BookingRequestCard from '@/components/trainer/dashboard/booking-request-card';
import type { StatCard } from '@/components/trainer/dashboard/stat-cards';
import StatCards from '@/components/trainer/dashboard/stat-cards';
import type { SessionTiming } from '@/components/trainer/dashboard/today-session-row';
import TodaySessionRow from '@/components/trainer/dashboard/today-session-row';
import PastSessionList from '@/components/trainer/dashboard/past-session-list';
import UpcomingSessions from '@/components/trainer/dashboard/upcoming-sessions';
import { formatTime } from '@/lib/format';
import { pastSessions } from '@/routes/trainer';
import { accept, decline } from '@/routes/trainer/requests';
import type {
    TrainerBookingRequest,
    TrainerPastSession,
    TrainerStats,
    TrainerTodaySession,
} from '@/types';

type TodayProps = {
    firstName: string;
    today: TrainerTodaySession[];
    /** Confirmed sessions from tomorrow on. */
    upcoming: TrainerTodaySession[];
    /** Over in the last 7 days, before today; the most recent first. */
    past: TrainerPastSession[];
    requests: TrainerBookingRequest[];
    stats: TrainerStats;
};

const timingOrder: Record<SessionTiming, number> = {
    next: 0,
    later: 1,
    past: 2,
};

export default function Today({
    firstName,
    today,
    upcoming,
    past,
    requests,
    stats,
}: TodayProps) {
    const todayTitleId = useId();
    const requestsTitleId = useId();
    const pastTitleId = useId();
    const [now] = useState(() => new Date());

    // The answers given on this page: the card shows them until the next visit.
    const [answers, setAnswers] = useState<Record<number, RequestAnswer>>({});

    const pendingRequests = requests.filter(
        (request) => (answers[request.id] ?? 'pending') === 'pending',
    );
    const pendingCount = pendingRequests.length;

    const answer = (
        request: TrainerBookingRequest,
        value: Exclude<RequestAnswer, 'pending'>,
    ) => {
        const action = value === 'confirmed' ? accept : decline;

        router.post(
            action.url(request.id),
            {},
            {
                preserveScroll: true,
                // The answered card stays on the page with its message.
                only: ['today', 'upcoming', 'stats'],
                onSuccess: () =>
                    setAnswers((current) => ({
                        ...current,
                        [request.id]: value,
                    })),
                // Expired or cancelled meanwhile: say it and show the real list.
                onError: (errors) => {
                    toast.error(errors.booking ?? 'Riprova tra poco.');
                    router.reload({ only: ['requests'] });
                },
            },
        );
    };

    useEffect(() => {
        // The badge follows the answers given on this page.
        setLayoutProps({ pendingCount });
    }, [pendingCount]);

    const sessions = withTiming(today, now).sort(
        (a, b) => timingOrder[a.timing] - timingOrder[b.timing],
    );
    const next = sessions.find((session) => session.timing === 'next');

    const statCards: StatCard[] = [
        {
            label: 'Richieste da confermare',
            value: String(pendingCount),
        },
        {
            label: 'Sedute questa settimana',
            value: String(stats.sessionsThisWeek),
        },
    ];

    return (
        <>
            <Head title="Le tue prenotazioni" />

            <div className="flex flex-col gap-0.5 md:gap-1">
                <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-3xl">
                    Buongiorno {firstName}
                </h1>
                {next && (
                    <p className="text-sm text-muted-foreground tabular-nums md:hidden">
                        Prossima seduta alle {formatTime(next.session.start)}{' '}
                        con {next.session.clientName}
                    </p>
                )}
            </div>

            <StatCards stats={statCards} />

            <div className="flex flex-col gap-6">
                <section
                    id="oggi"
                    aria-labelledby={todayTitleId}
                    className="flex scroll-mt-4 flex-col gap-2 md:gap-2.5"
                >
                    <h2
                        id={todayTitleId}
                        className="text-lg font-semibold tracking-tight md:text-xl"
                    >
                        Oggi
                    </h2>
                    {sessions.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nessuna seduta oggi.
                        </p>
                    )}
                    {sessions.map(({ session, timing }) => (
                        <TodaySessionRow
                            key={session.id}
                            session={session}
                            timing={timing}
                        />
                    ))}
                </section>

                <UpcomingSessions sessions={upcoming} />

                <section
                    id="prenotazioni"
                    aria-labelledby={requestsTitleId}
                    className="flex scroll-mt-4 flex-col gap-2 md:gap-2.5"
                >
                    <div className="flex flex-col gap-0.5">
                        <h2
                            id={requestsTitleId}
                            className="text-lg font-semibold tracking-tight tabular-nums md:text-xl"
                        >
                            {requestsTitle(pendingCount)}
                        </h2>
                        <span className="hidden text-[13px] leading-4.5 text-muted-foreground md:block">
                            Lo slot resta bloccato per il cliente finché non
                            rispondi, al massimo 24 ore.
                        </span>
                    </div>
                    {requests.map((request) => (
                        <BookingRequestCard
                            key={request.id}
                            request={request}
                            answer={answers[request.id] ?? 'pending'}
                            onAnswer={(value) => answer(request, value)}
                        />
                    ))}
                </section>

                <section
                    id="passate"
                    aria-labelledby={pastTitleId}
                    className="flex scroll-mt-4 flex-col gap-2 md:gap-2.5"
                >
                    <div className="flex items-end justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                            <h2
                                id={pastTitleId}
                                className="text-lg font-semibold tracking-tight md:text-xl"
                            >
                                Ultimi 7 giorni
                            </h2>
                            <span className="hidden text-[13px] leading-4.5 text-muted-foreground md:block">
                                Le sedute risultano effettuate: segna «Saltata»
                                se il cliente non si è presentato.
                            </span>
                        </div>
                        <Link
                            href={pastSessions()}
                            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium md:min-h-0"
                        >
                            Vedi tutte
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>
                    {past.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nessuna seduta negli ultimi 7 giorni.
                        </p>
                    ) : (
                        <PastSessionList sessions={past} />
                    )}
                </section>
            </div>
        </>
    );
}

/** "3 prenotazioni da confermare", "1 prenotazione…" or "Nessuna…" */
function requestsTitle(count: number): string {
    if (count === 0) {
        return 'Nessuna prenotazione da confermare';
    }

    return count === 1
        ? '1 prenotazione da confermare'
        : `${count} prenotazioni da confermare`;
}

/** Finished sessions are "past"; the first one not finished yet is "next". */
function withTiming(
    sessions: TrainerTodaySession[],
    now: Date,
): { session: TrainerTodaySession; timing: SessionTiming }[] {
    let nextFound = false;

    return [...sessions]
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((session) => {
            const end =
                new Date(session.start).getTime() +
                session.hours * 60 * 60 * 1000;
            let timing: SessionTiming = 'later';

            if (end <= now.getTime()) {
                timing = 'past';
            } else if (!nextFound) {
                timing = 'next';
                nextFound = true;
            }

            return { session, timing };
        });
}

Today.layout = { section: 'today' };
