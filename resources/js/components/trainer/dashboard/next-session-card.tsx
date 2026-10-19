import { Link } from '@inertiajs/react';
import { Calendar, Check } from 'lucide-react';
import { useId } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { romeParts } from '@/lib/calendar';
import { formatDayLong, formatDayRelative, formatTime } from '@/lib/format';
import { availability, calendar } from '@/routes/trainer';
import { show as showClient } from '@/routes/trainer/clients';
import type { TrainerSession } from '@/types';

type NextSessionCardProps = {
    /** The session going on now, or the next one; null when none is booked. */
    session: TrainerSession | null;
    now: Date;
};

/** The black card at the top of "Panoramica": the next confirmed session. */
export default function NextSessionCard({
    session,
    now,
}: NextSessionCardProps) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className="flex flex-[2_1_440px] flex-col gap-5 rounded-[20px] bg-sidebar p-6 text-sidebar-foreground md:p-7"
        >
            <div className="flex items-center justify-between gap-3">
                <h2
                    id={titleId}
                    className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground"
                >
                    {session
                        ? `PROSSIMA SEDUTA · ${dayLabel(session, now).toUpperCase()}`
                        : 'PROSSIMA SEDUTA'}
                </h2>
                {session && (
                    <span className="inline-flex h-6.5 items-center gap-1.5 rounded-full bg-sidebar-primary px-2.5 text-xs font-semibold text-sidebar-primary-foreground">
                        <Check
                            aria-hidden="true"
                            className="size-3"
                            strokeWidth={3}
                        />
                        Confermata
                    </span>
                )}
            </div>

            {session ? (
                <>
                    <div className="flex flex-col gap-1">
                        <span className="text-4xl leading-12 font-bold tracking-[-0.03em] tabular-nums md:text-[44px]">
                            {formatTime(session.start)} –{' '}
                            {formatTime(session.end)}
                        </span>
                        <span className="text-[15px] leading-5.5 text-sidebar-foreground/80">
                            {formatDayLong(romeParts(session.start).date)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-[14px] bg-sidebar-accent p-3.5">
                        <UserAvatar
                            name={session.clientName}
                            size="lg"
                            className="size-11 text-sm [&_[data-slot=avatar-fallback]]:bg-sidebar-border [&_[data-slot=avatar-fallback]]:text-sidebar-foreground"
                        />
                        <span className="flex min-w-0 flex-col">
                            <span className="text-base font-semibold">
                                {session.clientName}
                            </span>
                            <span className="text-sm text-sidebar-muted-foreground">
                                {session.serviceName} · {session.placeLabel}
                            </span>
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {session.clientId !== null && (
                            <Button
                                asChild
                                className="h-11 rounded-[10px] bg-sidebar-primary px-4.5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                            >
                                <Link href={showClient(session.clientId)}>
                                    Vedi dettagli
                                </Link>
                            </Button>
                        )}
                        <Button
                            asChild
                            variant="outline"
                            className="h-11 rounded-[10px] border-sidebar-foreground/25 bg-transparent px-4.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                            <Link
                                href={calendar({
                                    query: {
                                        giorno: romeParts(session.start).date,
                                    },
                                })}
                            >
                                <Calendar aria-hidden="true" />
                                Apri calendario
                            </Link>
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-start gap-3">
                    <span className="text-2xl font-bold tracking-[-0.02em]">
                        Nessuna seduta in programma
                    </span>
                    <span className="text-[15px] leading-5.5 text-sidebar-foreground/80">
                        Quando un cliente prenota e confermi, la prossima seduta
                        compare qui.
                    </span>
                    <Button
                        asChild
                        className="mt-1 h-11 rounded-[10px] bg-sidebar-primary px-4.5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    >
                        <Link href={availability()}>Controlla gli orari</Link>
                    </Button>
                </div>
            )}
        </section>
    );
}

/** "In corso", "Oggi", "Domani" or "Lun 19 ott". */
function dayLabel(session: TrainerSession, now: Date): string {
    if (new Date(session.start) <= now) {
        return 'In corso';
    }

    return formatDayRelative(session.start, now);
}
