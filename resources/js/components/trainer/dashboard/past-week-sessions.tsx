import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useId } from 'react';
import PastSessionCard from '@/components/trainer/dashboard/past-session-card';
import { Button } from '@/components/ui/button';
import { hoursAmountLabel } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { pastSessions } from '@/routes/trainer';
import type { TrainerPastSession } from '@/types';

/** Cards shown here: "Vedi tutte" opens the page "Sedute passate". */
const PREVIEW = 3;

/**
 * "Ultimi 7 giorni" of "Panoramica": the sessions over in the last 7 days
 * (before today), as cards with "Effettuata | Saltata", and the counts on top
 * (of all of them, also the ones not shown).
 */
export default function PastWeekSessions({
    sessions,
}: {
    sessions: TrainerPastSession[];
}) {
    const titleId = useId();

    const missed = sessions.filter((session) => session.noShow).length;
    const done = sessions.length - missed;
    const hours = sessions.reduce((sum, session) => sum + session.hours, 0);
    const shown = sessions.slice(0, PREVIEW);

    return (
        <section
            aria-labelledby={titleId}
            className="flex flex-col gap-4.5 rounded-3xl border bg-card p-5 md:p-6"
        >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <h2
                    id={titleId}
                    className="mr-auto text-xl leading-7 font-bold tracking-[-0.02em]"
                >
                    Ultimi 7 giorni
                </h2>
                {sessions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <Pill
                            count={sessions.length}
                            label={`${sessions.length === 1 ? 'seduta' : 'sedute'} · ${hoursAmountLabel(hours)}`}
                            dark
                        />
                        <Pill
                            count={done}
                            label={done === 1 ? 'effettuata' : 'effettuate'}
                        />
                        <Pill
                            count={missed}
                            label={missed === 1 ? 'saltata' : 'saltate'}
                        />
                    </div>
                )}
            </div>

            {sessions.length === 0 ? (
                <span className="text-[15px] leading-5.5 font-medium">
                    Nessuna seduta svolta.
                </span>
            ) : (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-3">
                    {shown.map((session) => (
                        <PastSessionCard key={session.id} session={session} />
                    ))}
                </ul>
            )}

            <div className="flex justify-center">
                <Button
                    asChild
                    variant="outline"
                    className="h-10.5 rounded-full px-4.5 font-semibold"
                >
                    <Link href={pastSessions()}>
                        Vedi tutte
                        <ArrowRight aria-hidden="true" />
                    </Link>
                </Button>
            </div>
        </section>
    );
}

/** "5 sedute · 5 ore", "4 effettuate": the number in bold. */
function Pill({
    count,
    label,
    dark = false,
}: {
    count: number;
    label: string;
    dark?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] leading-4.5 font-medium tabular-nums',
                dark
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground/80',
            )}
        >
            <span className="text-base font-bold">{count}</span>
            {label}
        </span>
    );
}
