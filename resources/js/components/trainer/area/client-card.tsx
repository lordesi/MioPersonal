import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
import { useId } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import ClientContacts from '@/components/trainer/area/client-contacts';
import PackageProgress from '@/components/trainer/package-progress';
import { Button } from '@/components/ui/button';
import { romeParts } from '@/lib/calendar';
import { dateBlockParts, formatDayLong, formatTime } from '@/lib/format';
import { calendar } from '@/routes/trainer';
import type { TrainerClient } from '@/types';

/**
 * Details of the client selected in "Clienti": the numbers, the package in
 * progress, the contacts, every session still to come and the link to the
 * calendar.
 */
export default function ClientCard({ client }: { client: TrainerClient }) {
    const titleId = useId();
    const upcomingTitleId = useId();
    const places = new Set(
        client.upcoming.map((session) => session.placeLabel),
    );
    // One place for every session: not repeated on each row.
    const samePlace = places.size === 1 ? [...places][0] : null;

    const numbers = [
        { label: 'In programma', value: client.upcomingCount },
        { label: 'Svolte', value: client.done },
        { label: 'Saltate', value: client.missed },
    ];

    return (
        <section
            aria-labelledby={titleId}
            className="flex min-w-0 flex-[2_1_340px] flex-col overflow-hidden rounded-[20px] border bg-card"
        >
            <div className="flex flex-col gap-5 bg-sidebar p-6 text-sidebar-foreground">
                <div className="flex items-center gap-3.5">
                    <UserAvatar
                        name={client.name}
                        size="xl"
                        className="size-14 text-lg [&_[data-slot=avatar-fallback]]:bg-sidebar-primary [&_[data-slot=avatar-fallback]]:text-sidebar-primary-foreground"
                    />
                    <span className="flex min-w-0 flex-col">
                        <h2
                            id={titleId}
                            className="text-[22px] leading-7 font-bold tracking-[-0.02em]"
                        >
                            {client.name}
                        </h2>
                        <span className="text-sm text-sidebar-muted-foreground">
                            Prima seduta:{' '}
                            {formatDayLong(
                                romeParts(client.firstSession).date,
                            ).toLowerCase()}
                        </span>
                    </span>
                </div>

                <dl className="grid grid-cols-3 gap-2">
                    {numbers.map((number) => (
                        <div
                            key={number.label}
                            className="flex flex-col-reverse gap-0.5 rounded-xl bg-sidebar-accent p-3"
                        >
                            <dt className="text-xs text-sidebar-muted-foreground">
                                {number.label}
                            </dt>
                            <dd className="text-2xl font-bold tabular-nums">
                                {number.value}
                            </dd>
                        </div>
                    ))}
                </dl>

                {client.package && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between gap-2 text-[13px] leading-4.5">
                            <span className="text-sidebar-foreground/80">
                                {client.package.name}
                            </span>
                            <span className="font-bold tabular-nums">
                                {client.package.done} di {client.package.total}{' '}
                                svolte
                            </span>
                        </div>
                        <PackageProgress
                            done={client.package.done}
                            total={client.package.total}
                            tone="dark"
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3.5 px-6 pt-5 pb-6">
                <ClientContacts name={client.name} contacts={client.contacts} />
                <div aria-hidden="true" className="h-px bg-border" />

                <h3
                    id={upcomingTitleId}
                    className="text-[15px] leading-5.5 font-semibold"
                >
                    Prossime sedute
                </h3>
                {client.upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nessuna seduta in programma.
                    </p>
                ) : (
                    <ul
                        aria-labelledby={upcomingTitleId}
                        className="flex flex-col gap-2"
                    >
                        {client.upcoming.map((session) => {
                            const day = dateBlockParts(session.start);

                            return (
                                <li
                                    key={session.id}
                                    className="flex items-center gap-3 rounded-[14px] border bg-secondary/50 p-2.5"
                                >
                                    <span className="flex h-12.5 w-11.5 flex-none flex-col items-center justify-center rounded-[10px] bg-foreground text-background">
                                        <span className="text-[10px] leading-3 font-bold tracking-[0.06em] uppercase">
                                            {day.weekday.replace('.', '')}
                                        </span>
                                        <span className="text-lg leading-5.5 font-bold tabular-nums">
                                            {day.day}
                                        </span>
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="text-sm font-bold tabular-nums">
                                            {formatTime(session.start)} –{' '}
                                            {formatTime(session.end)}
                                        </span>
                                        <span className="text-[13px] leading-4.5 text-muted-foreground">
                                            {session.serviceName}
                                            {samePlace === null &&
                                                session.placeLabel &&
                                                ` · ${session.placeLabel}`}
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="mt-1 flex flex-wrap gap-2">
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 rounded-[10px] px-4"
                    >
                        <Link
                            href={calendar(
                                client.nextSession
                                    ? {
                                          query: {
                                              giorno: romeParts(
                                                  client.nextSession,
                                              ).date,
                                          },
                                      }
                                    : undefined,
                            )}
                        >
                            <Calendar aria-hidden="true" />
                            Vedi nel calendario
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
