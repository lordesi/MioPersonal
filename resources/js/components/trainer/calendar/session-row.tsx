import { Link, router } from '@inertiajs/react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import type {
    BadgeTone,
    SessionKind,
} from '@/components/trainer/calendar/session-status';
import {
    firstName,
    paymentLabel,
    serviceShort,
    sessionBadge,
    sessionSurface,
    whenLabel,
} from '@/components/trainer/calendar/session-status';
import { hourLabel } from '@/lib/calendar';
import type { CalendarItem } from '@/lib/calendar';
import { formatDateMedium, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { clients, pastSessions } from '@/routes/trainer';
import { destroy } from '@/routes/trainer/calendar/sessions';
import { cancel, note as saveNote } from '@/routes/trainer/sessions';
import { withdraw } from '@/routes/trainer/sessions/reschedule';

/** As TrainerSessionNoteController::NOTE_MAX. */
const NOTE_MAX = 1000;

/** The round initials of the client (`.av` of the design). */
export function Avatar({
    name,
    size = 40,
}: {
    name: string;
    size?: 36 | 40 | 44;
}) {
    const letters = name
        .trim()
        .split(/\s+/u)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-[rgba(66,215,217,0.14)] font-bold text-[#42D7D9]',
                size === 36 && 'size-9 text-xs',
                size === 40 && 'size-10 text-sm',
                size === 44 && 'size-11 text-[15px]',
            )}
        >
            {letters}
        </span>
    );
}

/** The badge of the design system (`MioPersonal.Badge`). */
export function SessionBadge({
    tone,
    children,
}: {
    tone: BadgeTone;
    children: ReactNode;
}) {
    return (
        <span
            className={cn(
                'inline-flex min-h-6 shrink-0 items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs leading-4 font-semibold whitespace-nowrap tabular-nums',
                tone === 'neutral' && 'bg-[#1F2124] text-foreground',
                tone === 'solid' && 'bg-[#42D7D9] text-black',
                tone === 'outline' &&
                    'border-[#5E6268] bg-transparent text-foreground',
                tone === 'brand' && 'bg-[rgba(66,215,217,0.14)] text-[#42D7D9]',
            )}
        >
            {children}
        </span>
    );
}

/** The check of a session done. */
export function DoneCheck() {
    return (
        <span
            role="img"
            aria-label="Fatta"
            className="flex shrink-0 px-1.5 text-muted-foreground"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="square"
                strokeLinejoin="miter"
                aria-hidden="true"
            >
                <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
            </svg>
        </span>
    );
}

/** What a row needs from the page: the kind, the time now and the actions. */
export type SessionRowContext = {
    now: Date;
    kindOf: (item: CalendarItem) => SessionKind;
    /** Desktop: "Scrivi" with its word; phones: the round icon only. */
    desktop: boolean;
    /** "Sposta": the sheet on phones, the popover next to the button on desktop. */
    onMove: (item: CalendarItem, button: HTMLElement) => void;
    /** After "Sì, annulla": it stays in the list as "Annullata". */
    onCancelled: (item: CalendarItem) => void;
};

/**
 * A session in the lists of the calendar: the initials, the name, the time
 * and the service, the badge on the right. A tap opens its details below.
 */
export function SessionRow({
    item,
    open,
    onToggle,
    context,
}: {
    item: CalendarItem;
    open: boolean;
    onToggle: () => void;
    context: SessionRowContext;
}) {
    const kind = context.kindOf(item);
    const badge = sessionBadge(item, kind, context.now);

    return (
        <div className="flex flex-col gap-1.5">
            <button
                type="button"
                aria-expanded={open}
                onClick={onToggle}
                className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-[18px] px-3.5 py-3 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]',
                    sessionSurface(kind, open),
                )}
            >
                <Avatar name={item.title} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b className="truncate text-base leading-5.5 font-semibold">
                        {item.title}
                    </b>
                    <span className="truncate text-sm leading-5 text-muted-foreground">
                        {hourLabel(item.from)}–{hourLabel(item.to)} ·{' '}
                        {item.detail}
                    </span>
                </span>
                {badge ? (
                    <SessionBadge tone={badge.tone}>{badge.label}</SessionBadge>
                ) : (
                    <DoneCheck />
                )}
            </button>
            {open && (
                <div className="flex flex-col gap-4 rounded-[20px] bg-[#121315] p-4">
                    <SessionDetails
                        key={item.id}
                        item={item}
                        kind={kind}
                        context={context}
                    />
                </div>
            )}
        </div>
    );
}

/** The buttons of the details: dark pills of 44px. */
const actionClassName =
    'flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-[#1C1E21] text-[15px] font-semibold text-foreground no-underline outline-none hover:bg-[#26282C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9] disabled:opacity-50';

function ChatIcon({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-semibold tracking-[0.02em] text-muted-foreground">
                {label}
            </span>
            <b className="text-[15px] leading-5 font-semibold">{value}</b>
        </div>
    );
}

/**
 * The details of a session (the open card of the design): when, where,
 * which session, how it is paid, the note, and what can be done with it.
 * Shown under the row and, on the desktop week, in the panel on the right.
 */
export function SessionDetails({
    item,
    kind,
    context,
}: {
    item: CalendarItem;
    kind: SessionKind;
    context: SessionRowContext;
}) {
    const [asking, setAsking] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const name = firstName(item.title);
    const gone = kind === 'gone';
    const chat = item.clientId !== null && !item.offApp;
    const chatHref =
        item.clientId === null
            ? ''
            : clients.url({ query: { cliente: item.clientId, chat: 1 } });
    const canAct =
        item.kind === 'confirmed' && item.canChange && kind !== 'done' && !gone;

    const doCancel = () =>
        router.patch(
            cancel.url(item.id),
            { note: '' },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setCancelling(true),
                onFinish: () => setCancelling(false),
                onSuccess: () => {
                    setAsking(false);
                    context.onCancelled(item);
                },
            },
        );

    return (
        <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                <Field label="QUANDO" value={whenLabel(item)} />
                <Field label="DOVE" value={item.place || '—'} />
                <Field label="SEDUTA" value={serviceShort(item)} />
                <Field label="PAGAMENTO" value={paymentLabel(item)} />
            </div>

            <NoteBox item={item} />

            {!gone && <Proposal item={item} name={name} />}

            {canAct && !asking && (
                <div className="flex gap-2">
                    {chat &&
                        (context.desktop ? (
                            <Link href={chatHref} className={actionClassName}>
                                <ChatIcon size={16} />
                                Scrivi
                            </Link>
                        ) : (
                            <Link
                                href={chatHref}
                                aria-label={`Scrivi a ${item.title}`}
                                className={cn(
                                    actionClassName,
                                    'w-11 flex-none p-0',
                                )}
                            >
                                <ChatIcon size={18} />
                            </Link>
                        ))}
                    <button
                        type="button"
                        onClick={(event) =>
                            context.onMove(item, event.currentTarget)
                        }
                        className={actionClassName}
                    >
                        {context.desktop && (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M8 2v4M16 2v4" />
                                <rect
                                    width="18"
                                    height="18"
                                    x="3"
                                    y="4"
                                    rx="2"
                                />
                                <path d="M3 10h18" />
                            </svg>
                        )}
                        Sposta
                    </button>
                    <button
                        type="button"
                        onClick={() => setAsking(true)}
                        className={cn(actionClassName, 'text-[#FF8A8A]')}
                    >
                        Annulla
                    </button>
                </div>
            )}

            {kind === 'done' && (
                <div className="flex gap-2">
                    {chat && (
                        <Link href={chatHref} className={actionClassName}>
                            <ChatIcon size={16} />
                            Scrivi
                        </Link>
                    )}
                    <Link href={pastSessions()} className={actionClassName}>
                        Sedute passate
                    </Link>
                </div>
            )}

            {canAct && asking && (
                <div className="flex flex-col gap-3 rounded-2xl bg-[rgba(255,107,107,0.08)] p-3.5">
                    <span className="text-[15px] leading-5.25 font-semibold">
                        {item.offApp
                            ? `Annullare la seduta con ${name}? Non è su MioPersonal: avvisalo tu.`
                            : `Annullare la seduta con ${name}? Gli mandiamo subito un avviso.`}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setAsking(false)}
                            className={actionClassName}
                        >
                            No, tienila
                        </button>
                        <button
                            type="button"
                            disabled={cancelling}
                            onClick={doCancel}
                            className={cn(
                                actionClassName,
                                'bg-[#FF6B6B] font-bold text-black hover:bg-[#FF8A8A]',
                            )}
                        >
                            Sì, annulla
                        </button>
                    </div>
                </div>
            )}

            {gone && (
                <span className="text-sm font-semibold text-muted-foreground">
                    {item.offApp
                        ? `Seduta annullata. Ricordati di avvisare ${name}.`
                        : `Seduta annullata. ${name} è stato avvisato.`}
                </span>
            )}

            {item.clientId !== null && (
                <Link
                    href={clients.url({ query: { cliente: item.clientId } })}
                    className="self-start text-sm font-semibold text-[#42D7D9] no-underline hover:text-[#7FE6E7]"
                >
                    Apri la scheda del cliente
                </Link>
            )}
        </>
    );
}

/** NOTE DELLA SEDUTA: the trainer's own note, written or changed in place. */
function NoteBox({ item }: { item: CalendarItem }) {
    const fieldId = useId();
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(item.trainerNote ?? '');
    const [saving, setSaving] = useState(false);
    const note = item.trainerNote;

    const save = () =>
        router.patch(
            saveNote.url(item.id),
            { note: value },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: () => setEditing(false),
                onError: (errors) =>
                    toast.error(
                        errors.note ?? 'Non siamo riusciti a salvare la nota.',
                    ),
            },
        );

    return (
        <div className="flex flex-col gap-2 rounded-2xl bg-[#0B0C0D] p-3.5">
            <div className="flex items-center justify-between gap-2">
                <label
                    htmlFor={fieldId}
                    className="text-xs font-semibold tracking-[0.02em] text-muted-foreground"
                >
                    NOTE DELLA SEDUTA
                </label>
                {editing ? (
                    <button
                        type="button"
                        disabled={saving}
                        onClick={save}
                        className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-[#42D7D9] disabled:opacity-50"
                    >
                        Salva
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            setValue(note ?? '');
                            setEditing(true);
                        }}
                        className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-[#42D7D9]"
                    >
                        {note ? 'Modifica nota' : '+ Aggiungi nota'}
                    </button>
                )}
            </div>
            {editing ? (
                <textarea
                    id={fieldId}
                    value={value}
                    maxLength={NOTE_MAX}
                    rows={3}
                    autoFocus
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.stopPropagation();
                            setEditing(false);
                        }
                    }}
                    className="min-h-21 w-full resize-y rounded-[14px] border border-[#5E6268] bg-[#121315] px-3.5 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-[#42D7D9]"
                />
            ) : (
                <p
                    className={cn(
                        'm-0 text-[15px] leading-5.25 whitespace-pre-line',
                        note ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {note ?? 'Nessuna nota per questa seduta.'}
                </p>
            )}
        </div>
    );
}

/**
 * "Proposta in attesa": a new time proposed to the client (Sposta), or a
 * session put in by the trainer that the client hasn't accepted yet.
 * "Ritira proposta" takes it back.
 */
function Proposal({ item, name }: { item: CalendarItem; name: string }) {
    const pendingNew = item.kind === 'pending' && item.fromTrainer;

    if (!item.proposedStart && !pendingNew) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 rounded-2xl bg-[#0B0C0D] p-3.5">
            <span className="text-[15px] leading-5.25">
                {item.proposedStart ? (
                    <>
                        Hai proposto{' '}
                        <b className="font-semibold tabular-nums">
                            {formatDateMedium(item.proposedStart)},{' '}
                            {formatTime(item.proposedStart)}
                        </b>
                        : aspetti la risposta di {name}.
                    </>
                ) : (
                    `Hai proposto questa seduta: aspetti che ${name} accetti.`
                )}
            </span>
            <button
                type="button"
                onClick={() =>
                    router.delete(
                        item.proposedStart
                            ? withdraw.url(item.id)
                            : destroy.url(item.id),
                        { preserveScroll: true, preserveState: true },
                    )
                }
                className="cursor-pointer self-start border-0 bg-transparent p-0 text-sm font-semibold text-[#42D7D9]"
            >
                Ritira proposta
            </button>
        </div>
    );
}
