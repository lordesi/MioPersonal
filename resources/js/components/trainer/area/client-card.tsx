import { Link } from '@inertiajs/react';
import { useId } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import AttendanceLabel from '@/components/trainer/attendance-label';
import { nextSessionLabel } from '@/components/trainer/area/client-list';
import NoShowButton from '@/components/trainer/no-show-button';
import { Button } from '@/components/ui/button';
import { sessionsLabel } from '@/lib/calendar';
import { formatDayShort, formatTimeRange } from '@/lib/format';
import { show as showClient } from '@/routes/trainer/clients';
import type { TrainerClient } from '@/types';

/**
 * Details of the selected client: how often they show up, every slot still to
 * come, the last week's sessions with "Saltata", link to the profile.
 */
export default function ClientCard({ client }: { client: TrainerClient }) {
    const titleId = useId();
    const recentTitleId = useId();

    return (
        <aside
            aria-label="Scheda cliente"
            className="flex flex-[1_1_300px] flex-col gap-3.5 rounded-xl border bg-card p-4 md:p-5"
        >
            <div className="flex items-center gap-3">
                <UserAvatar name={client.name} size="lg" />
                <div className="flex flex-col">
                    <span className="text-lg font-bold">{client.name}</span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                        {sessionsLabel(client.sessions)} · prossima{' '}
                        {nextSessionLabel(client)}
                    </span>
                    <AttendanceLabel attendance={client.attendance} />
                </div>
            </div>

            <section
                aria-labelledby={titleId}
                className="flex flex-col gap-1.5"
            >
                <h3 id={titleId} className="text-sm font-semibold">
                    Prossime sedute
                </h3>
                {client.upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nessuna seduta in programma.
                    </p>
                ) : (
                    <ul className="overflow-hidden rounded-lg border">
                        {client.upcoming.map((session) => (
                            <li
                                key={session.id}
                                className="flex flex-col border-b px-3 py-2 last:border-b-0"
                            >
                                <span className="text-sm font-semibold tabular-nums">
                                    {formatDayShort(session.start)} ·{' '}
                                    {formatTimeRange(
                                        session.start,
                                        session.hours,
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {session.serviceName} · {session.placeLabel}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {client.recent.length > 0 && (
                <section
                    aria-labelledby={recentTitleId}
                    className="flex flex-col gap-1.5"
                >
                    <h3 id={recentTitleId} className="text-sm font-semibold">
                        Ultime sedute
                    </h3>
                    <ul className="overflow-hidden rounded-lg border">
                        {client.recent.map((session) => (
                            <li
                                key={session.id}
                                className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 last:border-b-0"
                            >
                                <span className="flex flex-col">
                                    <span className="text-sm font-semibold tabular-nums">
                                        {formatDayShort(session.start)} ·{' '}
                                        {formatTimeRange(
                                            session.start,
                                            session.hours,
                                        )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {session.serviceName}
                                    </span>
                                </span>
                                <NoShowButton session={session} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <Button asChild variant="outline" className="self-start">
                <Link href={showClient(client.id)}>Apri la scheda</Link>
            </Button>
        </aside>
    );
}
