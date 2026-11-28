import { ChevronDown, ChevronLeft, Plus, Search, X } from 'lucide-react';
import ClientDetail from '@/components/trainer/clients/client-detail';
import type { ClientsViewProps } from '@/components/trainer/clients/types';
import { areaTitleClassName } from '@/components/mp/area-bits';
import TrainerHeaderActions from '@/components/trainer/area/trainer-header-actions';
import { Initials } from '@/components/trainer/ui/bits';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDayShort, formatMonthYear, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerClient } from '@/types';
import type { PopoverAnchor } from '@/components/trainer/session/panel-shell';

/** The filters of the design: everyone, the active, the new, the inactive. */
export type ClientGroup = 'all' | 'active' | 'new' | 'inactive';

/** Which group a client is in. */
export function groupOf(client: TrainerClient): Exclude<ClientGroup, 'all'> {
    if (client.sessions === 0 || (client.hasRequest && client.done === 0)) {
        return 'new';
    }

    if (client.upcomingCount > 0 || client.package !== null) {
        return 'active';
    }

    return 'inactive';
}

const GROUPS: { value: ClientGroup; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'active', label: 'Attivi' },
    { value: 'new', label: 'Nuovi' },
    { value: 'inactive', label: 'Inattivi' },
];

type ClientsViewComponentProps = Pick<
    ClientsViewProps,
    'clients' | 'selected' | 'seriesServices' | 'sessionOptions' | 'open'
> & {
    group: ClientGroup;
    onGroup: (group: ClientGroup) => void;
    search: string;
    onSearch: (search: string) => void;
    /** "+": "Nuovo cliente", from the button (desktop: the popover under it). */
    onAddClient: (anchor: PopoverAnchor) => void;
    /** "Prenota" in the card of a client. */
    onBook: (client: TrainerClient) => void;
    /** "Scrivi": the chat in the Inbox. */
    onChat: (client: TrainerClient) => void;
};

/**
 * "Clienti" (design "Trainer · Clienti · V2 · nuovo"): the title with the
 * number, "+" and the photo; the search and the filter; the clients in a
 * grid, with the bar of the package. A client opens their card.
 */
export default function ClientsView({
    clients,
    selected,
    seriesServices,
    sessionOptions,
    open,
    group,
    onGroup,
    search,
    onSearch,
    onAddClient,
    onBook,
    onChat,
}: ClientsViewComponentProps) {
    if (selected) {
        return (
            <div className="flex max-w-240 flex-col gap-4">
                <button
                    type="button"
                    onClick={() => open(null)}
                    className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-base font-semibold text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ChevronLeft aria-hidden="true" className="size-5" />
                    Clienti
                </button>
                <ClientDetail
                    key={selected.recordId}
                    client={selected}
                    seriesServices={seriesServices}
                    onChat={() => onChat(selected)}
                    onBook={sessionOptions ? () => onBook(selected) : null}
                    size="lg"
                />
            </div>
        );
    }

    const words = search.trim().toLowerCase();
    const count = (value: ClientGroup) =>
        clients.filter((client) => value === 'all' || groupOf(client) === value)
            .length;
    const visible = clients.filter(
        (client) =>
            (group === 'all' || groupOf(client) === group) &&
            (words === '' || client.name.toLowerCase().includes(words)),
    );
    const groupLabel =
        GROUPS.find((item) => item.value === group)?.label ?? 'Tutti';

    return (
        <>
            <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className={areaTitleClassName}>Clienti</h1>
                    <p className="mt-1.5 text-[15px] leading-5 text-muted-foreground md:text-[17px]">
                        {visible.length === 1
                            ? '1 cliente'
                            : `${visible.length} clienti`}
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={(event) =>
                            onAddClient({
                                rect: event.currentTarget.getBoundingClientRect(),
                                placement: 'below',
                            })
                        }
                        aria-label="Aggiungi un cliente"
                        title="Aggiungi cliente"
                        className="flex size-11 items-center justify-center rounded-full bg-brand text-black outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <Plus
                            aria-hidden="true"
                            className="size-5.5"
                            strokeWidth={2.6}
                        />
                    </button>
                    <TrainerHeaderActions bell={false} />
                </div>
            </header>

            <div className="flex flex-col gap-5.5">
                <div className="flex items-center gap-2">
                    <label className="relative flex min-w-0 flex-1 md:max-w-105">
                        <span className="sr-only">Cerca un cliente</span>
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => onSearch(event.target.value)}
                            placeholder="Cerca un cliente"
                            className="h-12 w-full rounded-full bg-card pr-11 pl-11 text-[17px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
                        />
                        {search !== '' && (
                            <button
                                type="button"
                                onClick={() => onSearch('')}
                                aria-label="Cancella la ricerca"
                                className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-white/5"
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        )}
                    </label>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            aria-label={`Filtra clienti: ${groupLabel}`}
                            className="flex h-12 min-w-33 shrink-0 items-center justify-between gap-2.5 rounded-[14px] bg-card px-3.5 text-[15px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {groupLabel}
                            <ChevronDown
                                aria-hidden="true"
                                className="size-4.5"
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-52.5 rounded-2xl border-0 bg-[#1c1e21] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
                        >
                            <DropdownMenuRadioGroup
                                value={group}
                                onValueChange={(value) =>
                                    onGroup(value as ClientGroup)
                                }
                            >
                                {GROUPS.map((item) => (
                                    <DropdownMenuRadioItem
                                        key={item.value}
                                        value={item.value}
                                        className="h-11 justify-between rounded-xl pr-3 text-[15px] font-semibold data-[state=checked]:bg-brand/12 data-[state=checked]:text-brand [&>span:first-child]:hidden"
                                    >
                                        {item.label}
                                        <span className="tabular-nums opacity-60">
                                            {count(item.value)}
                                        </span>
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {visible.length === 0 ? (
                    <p className="text-[15px] leading-5 text-muted-foreground">
                        {clients.length === 0
                            ? 'Ancora nessun cliente: quando qualcuno ti prenota, o aggiungi una seduta con il +, lo trovi qui.'
                            : 'Nessun cliente trovato.'}
                    </p>
                ) : (
                    <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-3">
                        {visible.map((client) => (
                            <li key={client.recordId} className="flex">
                                <ClientTile
                                    client={client}
                                    onOpen={() => open(client)}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

/** A tile of the grid: the initials, the name, the service and the package or the next session. */
function ClientTile({
    client,
    onOpen,
}: {
    client: TrainerClient;
    onOpen: () => void;
}) {
    const group = groupOf(client);
    const pack = client.package;
    const left = pack ? pack.total - pack.done : 0;

    let note: string | null = null;

    if (group === 'inactive' && client.lastSession) {
        note = `Ultima a ${formatMonthYear(client.lastSession).split(' ')[0]}`;
    } else if (!pack && client.nextSession) {
        note = `${formatDayShort(client.nextSession)} · ${formatTime(client.nextSession)}`;
    }

    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex min-w-0 flex-1 flex-col gap-3 rounded-[22px] bg-card p-4 text-left text-foreground outline-none hover:bg-[#17181b] focus-visible:ring-2 focus-visible:ring-ring lg:rounded-[24px] lg:p-4.5"
        >
            <Initials name={client.name} size={48} className="text-base" />
            <span className="flex min-w-0 flex-col gap-0.5">
                <b className="truncate text-base leading-5.5 font-semibold lg:text-[17px]">
                    {client.name}
                </b>
                <span className="truncate text-sm leading-5 text-muted-foreground">
                    {pack?.name ?? (client.lastService || 'Cliente')}
                </span>
            </span>
            {pack && group === 'active' && (
                <span className="flex flex-col gap-1.5">
                    <span
                        aria-hidden="true"
                        className="block h-1.25 overflow-hidden rounded-full bg-[#26282c]"
                    >
                        <span
                            className={cn(
                                'block h-full rounded-full',
                                left === 0 ? 'bg-[#b9a6ff]' : 'bg-brand',
                            )}
                            style={{
                                width: `${pack.total > 0 ? Math.round((pack.done / pack.total) * 100) : 0}%`,
                            }}
                        />
                    </span>
                    <span className="text-[13px] font-semibold text-muted-foreground tabular-nums">
                        {pack.done} di {pack.total}
                    </span>
                </span>
            )}
            {group === 'new' && (
                <span className="text-[13px] font-bold text-[#b9a6ff]">
                    Nuovo
                </span>
            )}
            {note && group !== 'new' && (
                <span className="text-[13px] font-semibold text-muted-foreground">
                    {note}
                </span>
            )}
        </button>
    );
}
