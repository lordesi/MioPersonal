import { Link } from '@inertiajs/react';
import { ChevronDown, MessageCircle, Phone } from 'lucide-react';
import { useId } from 'react';
import SessionChangeActions from '@/components/trainer/area/session-change-actions';
import SessionOutcomeToggle from '@/components/trainer/dashboard/session-outcome-toggle';
import { Initials, StatusChip } from '@/components/trainer/ui/bits';
import SessionNote from '@/components/trainer/ui/session-note';
import {
    brandButtonClassName,
    roundOutlineClassName,
} from '@/components/trainer/ui/styles';
import CallAction from '@/components/trainer/ui/call-action';
import { romeParts } from '@/lib/calendar';
import { addHours, formatTime, formatTimeSpan } from '@/lib/format';
import { cn } from '@/lib/utils';
import { clients } from '@/routes/trainer';
import type { TrainerDaySession, TrainerPastSession } from '@/types';

type DaySessionCardProps = {
    session: TrainerDaySession;
    /** The first session not over today: turquoise outline, "Tra 1 h 30". */
    next: boolean;
    open: boolean;
    onToggle: () => void;
    now: Date;
    /** Desktop: the start time on the left of the row. */
    showStart?: boolean;
};

/**
 * A session of the chosen day in "Home": closed it says who and when; open
 * it has the actions. Before it starts: Scrivi, Chiama, Apri scheda, Sposta
 * and Annulla. Once over: "Effettuata" or "Saltata" (for 7 days).
 */
export default function DaySessionCard({
    session,
    next,
    open,
    onToggle,
    now,
    showStart = false,
}: DaySessionCardProps) {
    const panelId = useId();
    const service = session.serviceName.split(' · ')[0];
    const chip = chipOf(session, next, now);
    const clientHref =
        session.clientId === null
            ? null
            : clients.url({ query: { cliente: session.clientId } });
    const chatHref =
        session.clientId === null
            ? null
            : clients.url({ query: { cliente: session.clientId, chat: 1 } });

    return (
        <article
            className={cn(
                'flex flex-col gap-3.5 rounded-[22px] px-4 py-3.5',
                session.over
                    ? 'bg-[#121212] text-muted-foreground'
                    : 'bg-[#121212]',
                next
                    ? 'shadow-[inset_0_0_0_1.5px_#42d7d9]'
                    : 'shadow-[inset_0_0_0_1px_#2c2c2c]',
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center gap-3 rounded-2xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                {showStart && (
                    <span className="w-14 shrink-0 text-[17px] font-bold text-foreground tabular-nums">
                        {formatTime(session.start)}
                    </span>
                )}
                <Initials
                    name={session.clientName}
                    size={showStart ? 40 : 36}
                    tone={next ? 'next' : session.over ? 'muted' : undefined}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-semibold text-foreground md:text-[17px]">
                        {session.clientName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground tabular-nums md:text-[13px]">
                        {showStart
                            ? `${service} · ${packageLabel(session) ?? session.placeLabel}`
                            : `${formatTimeSpan(session.start, session.hours)} · ${service}`}
                    </span>
                </span>
                <StatusChip tone={chip.tone}>{chip.label}</StatusChip>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'size-4.5 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {open && (
                <div id={panelId} className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xl leading-6.5 font-semibold text-foreground tabular-nums">
                            {formatTimeSpan(session.start, session.hours)}
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                            {session.serviceName} · {session.placeLabel}
                        </span>
                        {session.guestNames.length > 0 && (
                            <span className="text-[13px] text-muted-foreground">
                                Con {session.guestNames.join(', ')}
                            </span>
                        )}
                    </div>

                    {session.kind === 'pending' && (
                        <p className="text-[13px] text-muted-foreground">
                            In attesa della tua risposta: la trovi in “Da
                            confermare”.
                        </p>
                    )}

                    {session.kind === 'confirmed' && !session.over && (
                        <div className="flex flex-col gap-2.5">
                            <div className="flex gap-2">
                                {chatHref && (
                                    <Link
                                        href={chatHref}
                                        aria-label={`Scrivi a ${session.clientName}`}
                                        title="Scrivi"
                                        className={roundOutlineClassName}
                                    >
                                        <MessageCircle
                                            aria-hidden="true"
                                            className="size-4.5"
                                        />
                                    </Link>
                                )}
                                {session.phone && (
                                    <CallAction
                                        phone={session.phone}
                                        name={session.clientName}
                                        className={roundOutlineClassName}
                                    >
                                        {() => (
                                            <Phone
                                                aria-hidden="true"
                                                className="size-4.5"
                                            />
                                        )}
                                    </CallAction>
                                )}
                                {clientHref && (
                                    <Link
                                        href={clientHref}
                                        className={cn(
                                            brandButtonClassName,
                                            'flex-1 text-[17px]',
                                        )}
                                    >
                                        Apri scheda
                                    </Link>
                                )}
                            </div>
                            {session.canChange && (
                                <SessionChangeActions
                                    id={session.id}
                                    start={session.start}
                                    end={session.end}
                                    clientName={session.clientName}
                                    proposedStart={session.proposedStart}
                                />
                            )}
                        </div>
                    )}

                    {session.over && (
                        <div className="flex flex-col gap-2">
                            <SessionOutcomeToggle
                                session={
                                    session as unknown as TrainerPastSession
                                }
                            />
                            {clientHref && (
                                <Link
                                    href={clientHref}
                                    className="self-start text-[15px] font-semibold text-brand"
                                >
                                    Apri scheda
                                </Link>
                            )}
                        </div>
                    )}

                    {session.kind === 'confirmed' && (
                        <SessionNote
                            id={session.id}
                            note={session.trainerNote}
                        />
                    )}
                </div>
            )}
        </article>
    );
}

function packageLabel(session: TrainerDaySession): string | null {
    return session.package
        ? `Seduta ${session.package.position} di ${session.package.total}`
        : null;
}

/** "Tra 1 h 30", "In corso", "Stasera", "Oggi", "10:00", "Fatta", "Saltata". */
function chipOf(
    session: TrainerDaySession,
    next: boolean,
    now: Date,
): { label: string; tone: 'brand' | 'neutral' | 'done' | 'waiting' } {
    if (session.kind === 'pending') {
        return { label: 'Da confermare', tone: 'waiting' };
    }

    if (session.over) {
        return session.noShow
            ? { label: 'Saltata', tone: 'done' }
            : { label: 'Fatta', tone: 'done' };
    }

    const start = new Date(session.start).getTime();
    const end = new Date(addHours(session.start, session.hours)).getTime();

    if (start <= now.getTime() && end > now.getTime()) {
        return { label: 'In corso', tone: 'brand' };
    }

    if (next) {
        const minutes = Math.max(
            0,
            Math.round((start - now.getTime()) / 60000),
        );
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;

        return {
            label:
                hours > 0
                    ? `Tra ${hours} h${rest > 0 ? ` ${rest}` : ''}`
                    : `Tra ${rest} min`,
            tone: 'brand',
        };
    }

    const today = romeParts(now).date;
    const { date, hour } = romeParts(session.start);

    if (date === today) {
        return { label: hour >= 17 ? 'Stasera' : 'Oggi', tone: 'neutral' };
    }

    return { label: formatTime(session.start), tone: 'neutral' };
}
