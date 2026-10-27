import { Link } from '@inertiajs/react';
import UserAvatar from '@/components/shared/user-avatar';
import PackageCells from '@/components/trainer/dashboard/package-cells';
import SessionOutcomeToggle from '@/components/trainer/dashboard/session-outcome-toggle';
import { romeParts } from '@/lib/calendar';
import { dateBlockParts, formatTimeSpan } from '@/lib/format';
import { cn } from '@/lib/utils';
import { clients } from '@/routes/trainer';
import type { TrainerPastSession } from '@/types';

/**
 * A finished session in "Ultimi 7 giorni" of "Panoramica": date, time, client,
 * service and "Effettuata | Saltata". A missed one is greyed out, with a
 * dashed border and the time struck through.
 */
export default function PastSessionCard({
    session,
}: {
    session: TrainerPastSession;
}) {
    const date = dateBlockParts(session.start);
    const missed = session.noShow;

    return (
        <li
            className={cn(
                'flex flex-col gap-3 rounded-[20px] border p-4',
                missed ? 'border-dashed border-input bg-muted/50' : 'bg-card',
            )}
        >
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        'flex h-13.5 w-12.5 flex-none flex-col items-center justify-center rounded-[14px]',
                        missed
                            ? 'bg-secondary text-foreground/70'
                            : 'bg-sidebar text-sidebar-foreground',
                    )}
                >
                    <span
                        className={cn(
                            'text-[10px] leading-3 font-bold tracking-[0.08em] uppercase',
                            !missed && 'text-sidebar-foreground/70',
                        )}
                    >
                        {date.weekday}
                    </span>
                    <span className="text-xl leading-6 font-bold tabular-nums">
                        {date.day}
                    </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                    <span
                        className={cn(
                            'text-base leading-5.5 font-bold tabular-nums',
                            missed && 'text-foreground/70 line-through',
                        )}
                    >
                        {formatTimeSpan(session.start, session.hours)}
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {daysAgoLabel(session.start)}
                    </span>
                </span>
                <span
                    className={cn(
                        'inline-flex h-6.5 flex-none items-center rounded-full px-2.5 text-xs font-semibold',
                        missed
                            ? 'border border-input text-foreground/70'
                            : 'bg-secondary text-foreground',
                    )}
                >
                    {missed ? 'Saltata' : 'Effettuata'}
                </span>
            </div>

            <div className="flex items-center gap-2.5 rounded-[14px] border border-border/60 bg-muted/50 p-3">
                <UserAvatar
                    name={session.clientName}
                    size="md"
                    className="border bg-card [&_[data-slot=avatar-fallback]]:bg-card"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm font-semibold">
                        {session.clientId === null ? (
                            session.clientName
                        ) : (
                            <Link
                                href={clients({
                                    query: { cliente: session.clientId },
                                })}
                                className="hover:underline"
                            >
                                {session.clientName}
                            </Link>
                        )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {session.serviceName}
                    </span>
                    {/* Above 20 the cells would be too thin (as in PackageProgress). */}
                    {session.package && session.package.total <= 20 && (
                        <PackageCells
                            position={session.package.position}
                            total={session.package.total}
                            missed={missed}
                        />
                    )}
                </span>
            </div>

            <SessionOutcomeToggle session={session} />
        </li>
    );
}

/**
 * "Ieri", "7 giorni fa": Rome calendar days, up to the 7 days of the section
 * (formatPastDate turns the 7th day into the month).
 */
function daysAgoLabel(iso: string): string {
    const days = Math.round(
        (Date.parse(romeParts(new Date()).date) -
            Date.parse(romeParts(iso).date)) /
            (24 * 60 * 60 * 1000),
    );

    if (days <= 0) {
        return 'Oggi';
    }

    return days === 1 ? 'Ieri' : `${days} giorni fa`;
}
