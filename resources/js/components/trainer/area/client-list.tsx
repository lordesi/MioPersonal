import ProgressBar from '@/components/shared/progress-bar';
import UserAvatar from '@/components/shared/user-avatar';
import { formatDayRelative, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerClient } from '@/types';

/** "Gio 8 ott, 12:00", "Oggi, 19:30" or "—" */
export function nextSessionLabel(client: TrainerClient): string {
    return client.nextSession
        ? `${formatDayRelative(client.nextSession)}, ${formatTime(client.nextSession)}`
        : '—';
}

/** "3 su 10 rimaste" or "Sedute singole" */
export function packageLabel(client: TrainerClient): string {
    return client.package
        ? `${client.package.left} su ${client.package.total} rimaste`
        : 'Sedute singole';
}

type ClientListProps = {
    clients: TrainerClient[];
    selectedId: number | null;
    onSelect: (id: number) => void;
};

const columns =
    'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] md:gap-3';

/** Clients table on desktop, compact list on mobile. */
export default function ClientList({
    clients,
    selectedId,
    onSelect,
}: ClientListProps) {
    return (
        <section
            aria-label="Elenco clienti"
            className="min-w-0 flex-[999_1_460px] rounded-xl border bg-card p-2"
        >
            <div
                aria-hidden="true"
                className={cn(
                    'hidden px-3.5 py-2 text-xs font-medium text-muted-foreground',
                    columns,
                )}
            >
                <span>Cliente</span>
                <span>Sedute</span>
                <span>Prossima</span>
                <span>Pacchetto</span>
            </div>

            {clients.length === 0 && (
                <p className="px-3.5 py-6 text-center text-sm text-muted-foreground">
                    Nessun cliente con questo nome.
                </p>
            )}

            {clients.map((client) => (
                <button
                    key={client.id}
                    type="button"
                    aria-pressed={client.id === selectedId}
                    onClick={() => onSelect(client.id)}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left hover:bg-secondary/60 md:items-center',
                        columns,
                        client.id === selectedId && 'bg-secondary',
                    )}
                >
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                        <UserAvatar name={client.name} />
                        <span className="flex min-w-0 flex-col">
                            <span className="text-sm font-semibold">
                                {client.name}
                            </span>
                            <span className="hidden text-xs text-muted-foreground md:inline">
                                Ultima: {formatDayRelative(client.lastSession)}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums md:hidden">
                                Prossima: {nextSessionLabel(client)}
                            </span>
                        </span>
                    </span>
                    <span className="hidden text-sm tabular-nums md:inline">
                        {client.sessions} sedute
                    </span>
                    <span className="hidden text-sm tabular-nums md:inline">
                        {nextSessionLabel(client)}
                    </span>
                    <span className="flex flex-none flex-col gap-1 text-xs tabular-nums md:text-[13px]">
                        {packageLabel(client)}
                        {client.package && (
                            <ProgressBar
                                value={
                                    client.package.total - client.package.left
                                }
                                max={client.package.total}
                                label={`Sedute usate del pacchetto di ${client.name}`}
                                className="hidden md:block"
                            />
                        )}
                    </span>
                </button>
            ))}
        </section>
    );
}
