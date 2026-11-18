import { Link } from '@inertiajs/react';
import {
    Calendar,
    Check,
    Ellipsis,
    FileText,
    Mail,
    MessageCircle,
    Phone,
    X,
} from 'lucide-react';
import { useId, useState } from 'react';
import ClientAbout from '@/components/trainer/area/client-about';
import ClientContacts from '@/components/trainer/area/client-contacts';
import {
    ClientProgress,
    SharedNote,
} from '@/components/trainer/area/client-progress';
import ClientRecord from '@/components/trainer/area/client-record';
import ClientSeries from '@/components/trainer/area/client-series';
import ClientNotes from '@/components/trainer/clients/client-notes';
import { sinceOf } from '@/components/trainer/clients/labels';
import PackageProgress from '@/components/trainer/package-progress';
import { Initials, StatusChip } from '@/components/trainer/ui/bits';
import SessionNote from '@/components/trainer/ui/session-note';
import {
    brandButtonClassName,
    listLabelClassName,
    pressableRowClassName,
} from '@/components/trainer/ui/styles';
import CallAction from '@/components/trainer/ui/call-action';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { romeParts } from '@/lib/calendar';
import {
    formatDayMonthShort,
    formatDayRelative,
    formatTime,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { whatsAppUrl } from '@/lib/whatsapp';
import { calendar, clients as clientsPage, services } from '@/routes/trainer';
import type { SeriesService, TrainerClient } from '@/types';

type Tab = 'sedute' | 'dati' | 'note';

type ClientDetailProps = {
    client: TrainerClient;
    seriesServices: SeriesService[];
    onChat: () => void;
    /** "Prenota": null when the trainer can't add sessions yet. */
    onBook: (() => void) | null;
    /** Phones: bigger avatar and buttons. */
    size: 'lg' | 'sm';
};

/**
 * The card of a client: who, the four quick actions (Scrivi, Chiama,
 * Prenota, Pacchetto) and three tabs. "Sedute": in programma, svolte and the
 * fixed weekly sessions. "Dati": contacts, "Su di te", progress, payments and
 * the personal link. "Note": the private notes and the note for the client.
 */
export default function ClientDetail({
    client,
    seriesServices,
    onChat,
    onBook,
    size,
}: ClientDetailProps) {
    const [tab, setTab] = useState<Tab>('sedute');
    const panelId = useId();
    const titleId = useId();
    const large = size === 'lg';
    const phone = client.contacts.phone;

    const actions = [
        {
            label: 'Scrivi',
            icon: MessageCircle,
            onClick: client.registered ? onChat : undefined,
            href:
                !client.registered && phone
                    ? whatsAppUrl(phone, `Ciao ${client.name.split(' ')[0]}!`)
                    : undefined,
            disabled: !client.registered && !phone,
        },
        {
            label: 'Chiama',
            icon: Phone,
            call: phone,
            disabled: !phone,
        },
        {
            label: 'Prenota',
            icon: Calendar,
            onClick: onBook ?? undefined,
            disabled: onBook === null,
            primary: true,
        },
        {
            label: 'Pacchetto',
            icon: FileText,
            link: services.url(),
        },
    ];

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-4.5">
            <header className="flex items-center gap-4">
                <Initials name={client.name} size={large ? 72 : 64} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2
                        id={titleId}
                        className={cn(
                            'font-bold',
                            large
                                ? 'text-[28px] leading-8.5'
                                : 'text-[22px] leading-7',
                        )}
                    >
                        {client.name}
                    </h2>
                    <span className="text-[15px] text-muted-foreground">
                        {sinceOf(client)}
                    </span>
                </div>
                <MoreMenu client={client} />
            </header>

            <div className="grid grid-cols-4 gap-2">
                {actions.map((action) => {
                    const className = cn(
                        'flex h-16 flex-col items-center justify-center gap-1 rounded-[18px] text-[13px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-40',
                        action.primary
                            ? 'bg-brand text-[#0a0a0a]'
                            : 'bg-card text-foreground hover:bg-[#232323]',
                    );
                    const content = (
                        <>
                            <action.icon
                                aria-hidden="true"
                                className="size-4.5"
                            />
                            {action.label}
                        </>
                    );

                    if (action.call) {
                        return (
                            <CallAction
                                key={action.label}
                                phone={action.call}
                                name={client.name}
                                className={className}
                            >
                                {(label) => (
                                    <>
                                        <action.icon
                                            aria-hidden="true"
                                            className="size-4.5"
                                        />
                                        {label}
                                    </>
                                )}
                            </CallAction>
                        );
                    }

                    if (action.link) {
                        return (
                            <Link
                                key={action.label}
                                href={action.link}
                                className={className}
                            >
                                {content}
                            </Link>
                        );
                    }

                    if (action.href) {
                        return (
                            <a
                                key={action.label}
                                href={action.href}
                                target={
                                    action.href.startsWith('http')
                                        ? '_blank'
                                        : undefined
                                }
                                rel="noopener noreferrer"
                                className={className}
                            >
                                {content}
                            </a>
                        );
                    }

                    return (
                        <button
                            key={action.label}
                            type="button"
                            onClick={action.onClick}
                            aria-disabled={action.disabled || undefined}
                            disabled={action.disabled}
                            className={className}
                        >
                            {content}
                        </button>
                    );
                })}
            </div>

            {client.package && (
                <div className="flex flex-col gap-2 rounded-[18px] bg-card px-4 py-3.5">
                    <div className="flex justify-between gap-2 text-[13px]">
                        <span className="text-muted-foreground">
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

            <div
                role="tablist"
                aria-label="Sezioni della scheda"
                className="grid grid-cols-3 rounded-full bg-card p-1"
            >
                {(
                    [
                        ['sedute', 'Sedute'],
                        ['dati', 'Dati'],
                        ['note', 'Note'],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        aria-controls={panelId}
                        onClick={() => setTab(value)}
                        className={cn(
                            'h-9 rounded-full text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                            tab === value
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div id={panelId} role="tabpanel" className="flex flex-col gap-4">
                {tab === 'sedute' && (
                    <Sessions
                        client={client}
                        seriesServices={seriesServices}
                        onBook={onBook}
                    />
                )}
                {tab === 'dati' && (
                    <div className="flex flex-col gap-4 rounded-[22px] bg-card p-4">
                        <ClientContacts
                            name={client.name}
                            contacts={client.contacts}
                            messageHref={
                                client.registered
                                    ? clientsPage.url({
                                          query: {
                                              con: client.recordId,
                                              chat: 1,
                                          },
                                      })
                                    : undefined
                            }
                        />
                        {client.about && (
                            <>
                                <div
                                    aria-hidden="true"
                                    className="h-px bg-border"
                                />
                                <ClientAbout about={client.about} />
                            </>
                        )}
                        {client.registered && (
                            <>
                                <div
                                    aria-hidden="true"
                                    className="h-px bg-border"
                                />
                                <ClientProgress client={client} />
                            </>
                        )}
                    </div>
                )}
                {tab === 'note' && (
                    <div className="flex flex-col gap-4 rounded-[22px] bg-card p-4">
                        {client.registered && (
                            <>
                                <SharedNote client={client} />
                                <div
                                    aria-hidden="true"
                                    className="h-px bg-border"
                                />
                            </>
                        )}
                        <ClientNotes client={client} />
                        <div aria-hidden="true" className="h-px bg-border" />
                        <ClientRecord client={client} />
                    </div>
                )}
            </div>
        </section>
    );
}

/** "In programma", "Svolte · 23 in totale" and the fixed weekly sessions. */
function Sessions({
    client,
    seriesServices,
    onBook,
}: {
    client: TrainerClient;
    seriesServices: SeriesService[];
    onBook: (() => void) | null;
}) {
    const firstName = client.name.split(' ')[0];

    return (
        <>
            <div className="flex flex-col gap-2.5">
                <h3 className={cn(listLabelClassName, 'text-brand')}>
                    In programma
                </h3>
                {client.upcoming.length === 0 ? (
                    <div className="flex flex-col items-center gap-2.5 rounded-[22px] border border-dashed border-[#3a3a3a] px-5 py-6 text-center">
                        <span className="text-[15px] font-semibold">
                            Nessuna seduta in programma
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                            Prenota la prossima seduta per {firstName}.
                        </span>
                        {onBook && (
                            <button
                                type="button"
                                onClick={onBook}
                                className={cn(brandButtonClassName, 'h-10')}
                            >
                                Prenota
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-[18px] bg-card">
                        {client.upcoming.map((session, index) => {
                            const day = romeParts(session.start).date;
                            const first = index === 0;

                            return (
                                <Link
                                    key={session.id}
                                    href={calendar.url({
                                        query: { vista: 'giorno', giorno: day },
                                    })}
                                    className={cn(
                                        'flex min-h-15 items-center gap-3 px-4 py-2.5',
                                        pressableRowClassName,
                                        index < client.upcoming.length - 1 &&
                                            'shadow-[inset_0_-0.5px_0_0_rgba(255,255,255,0.12)]',
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'w-0.75 self-stretch rounded-full',
                                            first ? 'bg-brand' : 'bg-[#707070]',
                                        )}
                                    />
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="text-[15px] font-semibold first-letter:uppercase">
                                            {formatDayRelative(session.start)} ·{' '}
                                            {formatTime(session.start)}
                                        </span>
                                        <span className="truncate text-[13px] text-muted-foreground">
                                            {session.serviceName} ·{' '}
                                            {session.placeLabel}
                                        </span>
                                    </span>
                                    {session.proposedStart ? (
                                        <StatusChip tone="waiting">
                                            In attesa
                                        </StatusChip>
                                    ) : (
                                        first && (
                                            <StatusChip tone="brand">
                                                {formatWeekdayShort(day)}{' '}
                                                {formatDayMonthShort(day)}
                                            </StatusChip>
                                        )
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <ClientSeries client={client} services={seriesServices} />

            {client.past.length > 0 && (
                <div className="flex flex-col gap-2.5">
                    <h3 className={listLabelClassName}>
                        Svolte · {client.done} in totale
                        {client.missed > 0 && ` · ${client.missed} saltate`}
                    </h3>
                    <div className="overflow-hidden rounded-[18px] bg-card">
                        {client.past.map((session, index) => {
                            const day = romeParts(session.start).date;

                            return (
                                <div
                                    key={session.id}
                                    className={cn(
                                        'flex flex-col gap-2.5 px-4 py-3',
                                        index < client.past.length - 1 &&
                                            'shadow-[inset_0_-0.5px_0_0_rgba(255,255,255,0.12)]',
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-[#3a3a3a] text-muted-foreground">
                                            {session.noShow ? (
                                                <X
                                                    aria-hidden="true"
                                                    className="size-3.25"
                                                    strokeWidth={2.5}
                                                />
                                            ) : (
                                                <Check
                                                    aria-hidden="true"
                                                    className="size-3.25"
                                                    strokeWidth={2.5}
                                                />
                                            )}
                                        </span>
                                        <span className="flex min-w-0 flex-1 justify-between gap-2">
                                            <span className="text-[15px] font-semibold">
                                                {formatWeekdayShort(day)}{' '}
                                                {formatDayMonthShort(day)}
                                                {session.noShow && (
                                                    <span className="font-normal text-muted-foreground">
                                                        {' '}
                                                        · saltata
                                                    </span>
                                                )}
                                            </span>
                                            <span className="truncate text-[13px] text-muted-foreground">
                                                {
                                                    session.serviceName.split(
                                                        ' · ',
                                                    )[0]
                                                }
                                                {session.package &&
                                                    ` · ${session.package.position}/${session.package.total}`}
                                            </span>
                                        </span>
                                    </div>
                                    <SessionNote
                                        id={session.id}
                                        note={session.trainerNote}
                                        className="ml-9.5"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}

/** "⋯": WhatsApp, email and the calendar of the client. */
function MoreMenu({ client }: { client: TrainerClient }) {
    const { phone, email } = client.contacts;

    // Nothing to offer: no empty menu.
    if (!phone && !email && client.upcoming.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Altre azioni"
                title="Altre azioni"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/35 outline-none hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <Ellipsis aria-hidden="true" className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-60 rounded-[18px] p-1.5"
            >
                {phone && (
                    <DropdownMenuItem asChild className="h-10 rounded-xl">
                        <a
                            href={whatsAppUrl(phone, '')}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <MessageCircle aria-hidden="true" />
                            WhatsApp
                        </a>
                    </DropdownMenuItem>
                )}
                {email && (
                    <DropdownMenuItem asChild className="h-10 rounded-xl">
                        <a href={`mailto:${email}`}>
                            <Mail aria-hidden="true" />
                            Email
                        </a>
                    </DropdownMenuItem>
                )}
                {client.upcoming[0] && (
                    <DropdownMenuItem asChild className="h-10 rounded-xl">
                        <Link
                            href={calendar.url({
                                query: {
                                    vista: 'giorno',
                                    giorno: romeParts(client.upcoming[0].start)
                                        .date,
                                },
                            })}
                        >
                            <Calendar aria-hidden="true" />
                            Vedi nel calendario
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
