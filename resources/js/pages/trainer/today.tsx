import { Head, router, setLayoutProps } from '@inertiajs/react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import type { RequestAnswer } from '@/components/trainer/dashboard/booking-request-card';
import BookingRequestCard from '@/components/trainer/dashboard/booking-request-card';
import type { StatCard } from '@/components/trainer/dashboard/stat-cards';
import StatCards from '@/components/trainer/dashboard/stat-cards';
import TodoList from '@/components/trainer/dashboard/todo-list';
import type {
    Attendance,
    SessionTiming,
} from '@/components/trainer/dashboard/today-session-row';
import TodaySessionRow from '@/components/trainer/dashboard/today-session-row';
import { formatTime } from '@/lib/format';
import { accept, decline } from '@/routes/trainer/requests';
import type {
    TrainerBookingRequest,
    TrainerStats,
    TrainerTodaySession,
    TrainerTodo,
} from '@/types';

type TodayProps = {
    firstName: string;
    today: TrainerTodaySession[];
    requests: TrainerBookingRequest[];
    stats: TrainerStats;
    todos: TrainerTodo[];
};

const timingOrder: Record<SessionTiming, number> = {
    next: 0,
    later: 1,
    past: 2,
};

export default function Today({
    firstName,
    today,
    requests,
    stats,
    todos,
}: TodayProps) {
    const todayTitleId = useId();
    const requestsTitleId = useId();
    const [now] = useState(() => new Date());

    // The answers given on this page: the card shows them until the next visit.
    const [answers, setAnswers] = useState<Record<number, RequestAnswer>>({});
    // TODO: attendance only lives in the page until "Svolta / Assente" exists.
    const [attendance, setAttendance] = useState<Record<number, Attendance>>(
        {},
    );

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
                only: ['today', 'stats'],
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
    const toMark = sessions.filter(
        (session) =>
            session.timing === 'past' && !attendance[session.session.id],
    );

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

    const allTodos: TrainerTodo[] = [
        ...(pendingCount > 0
            ? [
                  {
                      label: requestsTitle(pendingCount),
                      hint: 'Lo slot resta bloccato finché non rispondi',
                      cta: 'Vedi',
                      href: '#prenotazioni',
                  },
              ]
            : []),
        ...toMark.map(({ session }) => ({
            label: `Segna la seduta delle ${formatTime(session.start)} con ${session.clientName}`,
            hint: 'Svolta o cliente non presentato',
            cta: 'Segna',
            href: '#oggi',
        })),
        ...todos,
    ];

    return (
        <>
            <Head title="Oggi" />

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

            <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-6">
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
                                attendance={attendance[session.id] ?? null}
                                onAttendanceChange={(value) =>
                                    setAttendance({
                                        ...attendance,
                                        [session.id]: value,
                                    })
                                }
                            />
                        ))}
                    </section>

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
                </div>

                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
                    <TodoList todos={allTodos} />
                </div>
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
