import type { ReactNode } from 'react';
import ProgressBar from '@/components/shared/progress-bar';
import UserAvatar from '@/components/shared/user-avatar';
import { sessionsLabel } from '@/lib/calendar';
import { formatDayRelative, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerClient } from '@/types';

/** "Domani, 13:00", "Gio 8 ott, 12:00" or "—" */
export function nextSessionLabel(client: TrainerClient): string {
    return client.nextSession
        ? `${formatDayRelative(client.nextSession)}, ${formatTime(client.nextSession)}`
        : '—';
}

type ClientListProps = {
    clients: TrainerClient[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    /** Shown instead of the rows when no client matches the search or the filter. */
    empty: ReactNode;
};

// "In programma" is never narrower than its title: on one line.
const columns =
    'md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(max-content,1fr)_minmax(0,1.2fr)] md:gap-4';

/** Clients table on desktop, compact list on mobile. */
export default function ClientList({
    clients,
    selectedId,
    onSelect,
    empty,
}: ClientListProps) {
    return (
        <section
            aria-label="Elenco clienti"
            className="flex min-w-0 flex-[3_1_520px] flex-col rounded-[20px] border bg-card p-2"
        >
            <div
                aria-hidden="true"
                className={cn(
                    'hidden px-4 py-3 text-xs font-semibold tracking-[0.04em] text-muted-foreground',
                    columns,
                )}
            >
                <span>CLIENTE</span>
                <span>PROSSIMA SEDUTA</span>
                <span className="whitespace-nowrap">IN PROGRAMMA</span>
                <span>PACCHETTO</span>
            </div>

            {clients.length === 0 && empty}

            {clients.map((client) => {
                const selected = client.id === selectedId;

                return (
                    <button
                        key={client.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onSelect(client.id)}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left',
                            columns,
                            selected
                                ? 'border-foreground bg-secondary/50'
                                : 'border-transparent hover:bg-secondary/50',
                        )}
                    >
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                            <UserAvatar
                                name={client.name}
                                size="md"
                                className={cn(
                                    'size-10',
                                    selected
                                        ? '[&_[data-slot=avatar-fallback]]:bg-foreground [&_[data-slot=avatar-fallback]]:text-background'
                                        : '[&_[data-slot=avatar-fallback]]:bg-secondary',
                                )}
                            />
                            <span className="flex min-w-0 flex-col">
                                <span className="text-[15px] leading-5.5 font-semibold">
                                    {client.name}
                                </span>
                                <span className="hidden text-[13px] leading-4.5 text-muted-foreground md:inline">
                                    {client.lastService}
                                </span>
                                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums md:hidden">
                                    Prossima: {nextSessionLabel(client)}
                                </span>
                            </span>
                        </span>
                        <span className="hidden text-sm font-semibold tabular-nums md:inline">
                            {nextSessionLabel(client)}
                        </span>
                        <span className="hidden text-sm tabular-nums md:inline">
                            {client.upcomingCount === 0
                                ? '—'
                                : sessionsLabel(client.upcomingCount)}
                        </span>
                        <span className="hidden flex-col gap-1.5 md:flex">
                            {client.package ? (
                                <>
                                    <span className="text-[13px] leading-4.5 font-semibold tabular-nums">
                                        {client.package.done}/
                                        {client.package.total}
                                    </span>
                                    <ProgressBar
                                        value={client.package.done}
                                        max={client.package.total}
                                        label={`Sedute svolte del pacchetto: ${client.package.done} di ${client.package.total}`}
                                        className="bg-border"
                                    />
                                </>
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    —
                                </span>
                            )}
                        </span>
                    </button>
                );
            })}

            <p className="mx-2 mt-2 mb-1 rounded-xl bg-secondary/60 p-3 text-[13px] leading-4.5 text-muted-foreground">
                I nuovi clienti compaiono qui dopo la prima prenotazione
                confermata.
            </p>
        </section>
    );
}
