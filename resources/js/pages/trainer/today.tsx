import { Head, Link } from '@inertiajs/react';
import { Bell, Clock } from 'lucide-react';
import { useState } from 'react';
import PageHeading from '@/components/trainer/area/page-heading';
import Panel from '@/components/trainer/area/panel';
import ActivePackages from '@/components/trainer/dashboard/active-packages';
import NextSessionCard from '@/components/trainer/dashboard/next-session-card';
import PastSessionList from '@/components/trainer/dashboard/past-session-list';
import PendingRequestsSummary from '@/components/trainer/dashboard/pending-requests-summary';
import type { StatCard } from '@/components/trainer/dashboard/stat-cards';
import StatCards from '@/components/trainer/dashboard/stat-cards';
import WeekAgenda from '@/components/trainer/dashboard/week-agenda';
import { Button } from '@/components/ui/button';
import { romeParts } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import {
    availability,
    pastSessions,
    requests as requestsPage,
} from '@/routes/trainer';
import type {
    TrainerBookingRequest,
    TrainerPackage,
    TrainerPastSession,
    TrainerSession,
    TrainerStats,
} from '@/types';

type TodayProps = {
    firstName: string;
    /** The confirmed session going on now, or the next one. */
    next: TrainerSession | null;
    /** Confirmed and waiting, from today to the 7th day. */
    agenda: TrainerSession[];
    /** The first requests waiting: all of them are in "Richieste". */
    requests: TrainerBookingRequest[];
    packages: TrainerPackage[];
    /** Over in the last 7 days, before today; the most recent first. */
    past: TrainerPastSession[];
    stats: TrainerStats;
};

/** "Panoramica": the trainer's dashboard (docs/design/trainer-dashboard.html). */
export default function Today({
    firstName,
    next,
    agenda,
    requests,
    packages,
    past,
    stats,
}: TodayProps) {
    const [now] = useState(() => new Date());
    const parts = romeParts(now);

    const statCards: StatCard[] = [
        {
            label: 'Richieste da confermare',
            value: String(stats.pending),
            detail: stats.pending > 0 && (
                <Link
                    href={requestsPage()}
                    className="font-semibold text-foreground underline"
                >
                    Rispondi entro 24 ore
                </Link>
            ),
        },
        {
            label: 'Sedute nei prossimi 7 giorni',
            value: String(stats.weekSessions),
        },
    ];

    return (
        <>
            <Head title="Panoramica" />

            <PageHeading
                eyebrow={formatDayLong(parts.date)}
                title={`${greeting(parts.hour)}, ${firstName}`}
                action={
                    <div className="hidden flex-wrap gap-2 md:flex">
                        <Button
                            asChild
                            variant="outline"
                            size="icon"
                            className="relative size-11 rounded-xl bg-card"
                        >
                            <Link
                                href={requestsPage()}
                                aria-label={`Richieste da confermare: ${stats.pending}`}
                            >
                                <Bell aria-hidden="true" className="size-4.5" />
                                {stats.pending > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                                        {stats.pending}
                                    </span>
                                )}
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="h-11 rounded-xl px-4.5 font-semibold"
                        >
                            <Link href={availability()}>
                                <Clock aria-hidden="true" />
                                Gestisci disponibilità
                            </Link>
                        </Button>
                    </div>
                }
            />

            <div className="flex flex-wrap gap-4">
                <NextSessionCard session={next} now={now} />
                <StatCards stats={statCards} />
            </div>

            <div className="flex flex-wrap items-start gap-4">
                <WeekAgenda sessions={agenda} today={parts.date} />

                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                    <PendingRequestsSummary
                        requests={requests}
                        total={stats.pending}
                    />
                    <ActivePackages packages={packages} />
                    <Panel
                        title="Ultimi 7 giorni"
                        className="gap-2.5"
                        action={
                            <Link
                                href={pastSessions()}
                                className="inline-flex min-h-11 items-center text-sm font-medium hover:underline"
                            >
                                Vedi tutte
                            </Link>
                        }
                    >
                        {past.length === 0 ? (
                            <span className="text-[15px] leading-5.5 font-medium">
                                Nessuna seduta svolta.
                            </span>
                        ) : (
                            <PastSessionList sessions={past} />
                        )}
                        <span className="text-[13px] leading-4.5 text-muted-foreground">
                            Le sedute passate risultano effettuate: segna
                            «Saltata» se il cliente non si è presentato.
                        </span>
                    </Panel>
                </div>
            </div>
        </>
    );
}

/** "Buongiorno" until 13, "Buon pomeriggio" until 18, then "Buonasera" (Rome time). */
function greeting(hour: number): string {
    if (hour < 13) {
        return 'Buongiorno';
    }

    return hour < 18 ? 'Buon pomeriggio' : 'Buonasera';
}

Today.layout = { section: 'today' };
