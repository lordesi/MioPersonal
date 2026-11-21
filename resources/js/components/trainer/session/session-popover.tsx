import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    CalendarDays,
    Check,
    ChevronsUpDown,
    Clock,
    Mail,
    NotebookPen,
    Phone,
    Search,
    UserPlus,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useLayoutEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import {
    DayPicker,
    FormErrors,
    SessionRows,
    TimeWheels,
    glassFieldClassName,
    glassPanelClassName,
    shortDate,
} from '@/components/trainer/session/session-fields';
import type { SessionForm } from '@/components/trainer/session/use-session-form';
import { cn } from '@/lib/utils';

/** Where the popover opens: under a button, or beside an hour of the grid. */
export type PopoverAnchor = {
    rect: DOMRect;
    placement: 'below' | 'side';
};

const WIDTH = 400;
const GAP = 14;
const MARGIN = 16;

type Position = {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    /** The small arrow towards the anchor. */
    arrow: { side: 'top' | 'left' | 'right'; offset: number } | null;
};

/** The place of the popover in the window, from the anchor and its height. */
function place(anchor: PopoverAnchor | null, height: number): Position {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(WIDTH, vw - MARGIN * 2);
    const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), Math.max(min, max));

    if (!anchor) {
        const top = clamp((vh - height) / 2, MARGIN, vh - height - MARGIN);

        return {
            top,
            left: (vw - width) / 2,
            width,
            maxHeight: vh - top - MARGIN,
            arrow: null,
        };
    }

    const { rect } = anchor;

    if (anchor.placement === 'below') {
        const top = rect.bottom + GAP;
        const left = clamp(rect.right - width, MARGIN, vw - width - MARGIN);

        return {
            top,
            left,
            width,
            maxHeight: vh - top - MARGIN,
            arrow: {
                side: 'top',
                offset: clamp(
                    rect.left + rect.width / 2 - left,
                    28,
                    width - 28,
                ),
            },
        };
    }

    const right = rect.right + GAP + width <= vw - MARGIN;
    const left = right ? rect.right + GAP : rect.left - GAP - width;
    const middle = rect.top + rect.height / 2;
    const top = clamp(middle - 140, MARGIN, vh - height - MARGIN);

    return {
        top,
        left: clamp(left, MARGIN, vw - width - MARGIN),
        width,
        maxHeight: vh - top - MARGIN,
        arrow: {
            side: right ? 'left' : 'right',
            offset: clamp(middle - top, 28, height - 28),
        },
    };
}

/**
 * "Aggiungi seduta" on desktop (designs "Popover · bottone", "Popover ·
 * clic sull’ora"): a glass popover under the button or beside the hour
 * clicked. "Cerca cliente" chooses from the list, "Nuovo cliente" asks name
 * and surname; the day and the time open their pickers beside it.
 */
export default function SessionPopover({
    open,
    onOpenChange,
    form,
    today,
    anchor,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: SessionForm;
    today: string;
    anchor: PopoverAnchor | null;
    onSave: () => void;
}) {
    // A state, not a ref: the portal mounts the panel after the first render.
    const [panel, setPanel] = useState<HTMLElement | null>(null);
    const [position, setPosition] = useState<Position | null>(null);
    const [picker, setPicker] = useState<'day' | 'time' | null>(null);
    const [extra, setExtra] = useState(false);

    // Placed once its height is known, and again when it grows.
    useLayoutEffect(() => {
        const element = panel;

        if (!open || !element) {
            return;
        }

        const update = () => setPosition(place(anchor, element.offsetHeight));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        window.addEventListener('resize', update);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', update);
        };
    }, [open, anchor, panel]);

    // The pickers open on the side with more room.
    const pickerOnLeft =
        position !== null &&
        position.left + position.width / 2 > window.innerWidth / 2;

    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={onOpenChange}
            modal={false}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        // The first field (the search), not the window around it.
                        (event.target as HTMLElement | null)
                            ?.querySelector<HTMLElement>('input')
                            ?.focus({ preventScroll: true });
                    }}
                    className="theme-dark pointer-events-none fixed inset-0 z-50 bg-transparent! text-foreground outline-none"
                >
                    <section
                        ref={setPanel}
                        className={cn(
                            'pointer-events-auto absolute flex flex-col gap-3.5 overflow-y-auto overscroll-contain rounded-[30px] p-4.5 data-[shown=false]:opacity-0',
                            glassPanelClassName,
                        )}
                        data-shown={position !== null}
                        style={
                            position
                                ? {
                                      top: position.top,
                                      left: position.left,
                                      width: position.width,
                                      maxHeight: position.maxHeight,
                                  }
                                : { top: 0, left: 0, width: WIDTH }
                        }
                    >
                        <div className="flex items-center justify-between gap-3">
                            <DialogPrimitive.Title className="text-[17px] font-semibold tracking-[-0.43px]">
                                Nuova seduta
                            </DialogPrimitive.Title>
                            <span className="text-[13px] text-muted-foreground tabular-nums">
                                {shortDate(form.date, false)} · {form.time}–
                                {form.end}
                            </span>
                        </div>

                        <div
                            role="group"
                            aria-label="Cliente"
                            className="grid h-10 grid-cols-2 gap-0.5 rounded-full bg-[#7676803d] p-[3px]"
                        >
                            {(
                                [
                                    ['search', 'Cerca cliente', Search],
                                    ['new', 'Nuovo cliente', UserPlus],
                                ] as const
                            ).map(([value, label, Icon]) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={form.mode === value}
                                    onClick={() => form.setMode(value)}
                                    className={cn(
                                        'flex items-center justify-center gap-1.5 rounded-full text-[15px] tracking-[-0.23px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                        form.mode === value
                                            ? 'bg-white/[0.27] font-semibold'
                                            : 'hover:bg-white/[0.06]',
                                    )}
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {form.mode === 'search' ? (
                            <ClientSearch form={form} />
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <GlassInput
                                    id="popover-first-name"
                                    label="Nome"
                                    value={form.firstName}
                                    onChange={form.setFirstName}
                                    autoComplete="off"
                                    invalid={!!form.clientError}
                                />
                                <GlassInput
                                    id="popover-last-name"
                                    label="Cognome"
                                    value={form.lastName}
                                    onChange={form.setLastName}
                                    autoComplete="off"
                                />
                            </div>
                        )}
                        {form.clientError && (
                            <p className="-mt-2 pl-4 text-[13px] text-destructive">
                                {form.clientError}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <PillButton
                                icon={CalendarDays}
                                label={`Giorno: ${shortDate(form.date, false)}`}
                                active={picker === 'day'}
                                onClick={() =>
                                    setPicker(picker === 'day' ? null : 'day')
                                }
                            >
                                {shortDate(form.date, false)}
                            </PillButton>
                            <PillButton
                                icon={Clock}
                                label={`Ora: ${form.time}`}
                                active={picker === 'time'}
                                onClick={() =>
                                    setPicker(picker === 'time' ? null : 'time')
                                }
                            >
                                {form.time}
                            </PillButton>
                        </div>
                        {form.whenError && (
                            <p className="-mt-2 pl-4 text-[13px] text-destructive">
                                {form.whenError}
                            </p>
                        )}

                        <SessionRows form={form} />

                        {extra ? (
                            <div className="flex flex-col gap-2">
                                {form.isNew && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <GlassInput
                                            id="popover-phone"
                                            label="Telefono"
                                            icon={Phone}
                                            type="tel"
                                            value={form.phone}
                                            onChange={form.setPhone}
                                        />
                                        <GlassInput
                                            id="popover-email"
                                            label="Email"
                                            icon={Mail}
                                            type="email"
                                            value={form.email}
                                            onChange={form.setEmail}
                                        />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'flex items-start gap-2.5 rounded-[22px] px-4 py-3',
                                        glassFieldClassName,
                                    )}
                                >
                                    <NotebookPen
                                        aria-hidden="true"
                                        className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
                                    />
                                    <label
                                        htmlFor="popover-note"
                                        className="sr-only"
                                    >
                                        Note
                                    </label>
                                    <textarea
                                        id="popover-note"
                                        rows={2}
                                        maxLength={1000}
                                        placeholder="Note per la seduta"
                                        value={form.note}
                                        onChange={(event) =>
                                            form.setNote(event.target.value)
                                        }
                                        className="field-sizing-content min-h-11 flex-1 resize-none border-0 bg-transparent p-0 text-[17px] leading-5.5 outline-none placeholder:text-muted-foreground md:text-[15px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setExtra(true)}
                                className="self-start text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                {form.isNew
                                    ? 'Aggiungi contatti e note'
                                    : 'Aggiungi una nota'}
                            </button>
                        )}

                        <FormErrors messages={form.otherErrors} />

                        {form.proposal && (
                            <p className="text-[13px] leading-4.5 text-muted-foreground">
                                {form.chosen?.name.split(' ')[0]} riceverà una
                                notifica per accettarla.
                            </p>
                        )}

                        <div className="flex gap-2">
                            <DialogPrimitive.Close className="h-11 flex-1 rounded-full border border-white/10 bg-white/[0.08] text-[15px] tracking-[-0.23px] outline-none hover:bg-white/[0.14] focus-visible:ring-[3px] focus-visible:ring-ring/50">
                                Annulla
                            </DialogPrimitive.Close>
                            <button
                                type="button"
                                disabled={form.processing}
                                onClick={onSave}
                                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand text-[15px] font-semibold tracking-[-0.23px] text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)] outline-none hover:bg-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
                            >
                                {form.processing && <Spinner />}
                                {form.proposal ? 'Invia proposta' : 'Aggiungi'}
                            </button>
                        </div>
                    </section>

                    {position?.arrow && (
                        <span
                            aria-hidden="true"
                            className={cn(
                                'pointer-events-none absolute size-3.5 rotate-45 border-white/10 bg-[#262626]',
                                position.arrow.side === 'top' &&
                                    'border-t border-l',
                                position.arrow.side === 'left' &&
                                    'border-b border-l',
                                position.arrow.side === 'right' &&
                                    'border-t border-r',
                            )}
                            style={
                                position.arrow.side === 'top'
                                    ? {
                                          top: position.top - 7,
                                          left:
                                              position.left +
                                              position.arrow.offset -
                                              7,
                                      }
                                    : {
                                          top:
                                              position.top +
                                              position.arrow.offset -
                                              7,
                                          left:
                                              position.arrow.side === 'left'
                                                  ? position.left - 7
                                                  : position.left +
                                                    position.width -
                                                    7,
                                      }
                            }
                        />
                    )}

                    {picker && position && (
                        <section
                            aria-label={
                                picker === 'day'
                                    ? 'Scegli il giorno'
                                    : 'Scegli l’ora'
                            }
                            className={cn(
                                'pointer-events-auto absolute flex w-80 flex-col gap-3 rounded-[26px] bg-[#1f1f1ff5] p-3.5',
                                glassPanelClassName,
                            )}
                            style={{
                                top: position.top,
                                left: pickerOnLeft
                                    ? Math.max(MARGIN, position.left - 320 - 16)
                                    : Math.min(
                                          window.innerWidth - 320 - MARGIN,
                                          position.left + position.width + 16,
                                      ),
                            }}
                        >
                            {picker === 'day' ? (
                                <DayPicker
                                    value={form.date}
                                    today={today}
                                    onChange={(date) => {
                                        form.setDate(date);
                                        setPicker(null);
                                    }}
                                />
                            ) : (
                                <>
                                    <p className="px-1 text-[17px] font-semibold">
                                        {shortDate(form.date, false)}
                                    </p>
                                    <TimeWheels form={form} />
                                    <button
                                        type="button"
                                        onClick={() => setPicker(null)}
                                        className="h-11 rounded-full bg-white/[0.08] text-[15px] font-semibold outline-none hover:bg-white/[0.14] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        Fatto
                                    </button>
                                </>
                            )}
                        </section>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

/** "Cerca cliente": the clients whose name has the words written. */
function ClientSearch({ form }: { form: SessionForm }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div
                className={cn(
                    'flex h-12.5 items-center gap-2.5 rounded-full px-4',
                    glassFieldClassName,
                    form.clientError && 'border-destructive',
                )}
            >
                {form.chosen ? (
                    <Check
                        aria-hidden="true"
                        className="size-4.5 shrink-0 text-brand"
                    />
                ) : (
                    <Search
                        aria-hidden="true"
                        className="size-4.5 shrink-0 text-muted-foreground"
                    />
                )}
                <label htmlFor="popover-search" className="sr-only">
                    Cerca cliente
                </label>
                <input
                    id="popover-search"
                    type="search"
                    autoComplete="off"
                    placeholder="Nome o cognome"
                    value={form.query}
                    onChange={(event) => form.setQuery(event.target.value)}
                    className="h-12 min-w-0 flex-1 border-0 bg-transparent p-0 text-[17px] tracking-[-0.43px] outline-none placeholder:text-muted-foreground"
                />
            </div>
            {form.matches.length > 0 && (
                <ul
                    aria-label="Clienti trovati"
                    className={cn('rounded-[22px] p-1', glassFieldClassName)}
                >
                    {form.matches.map((client) => (
                        <li key={client.id}>
                            <button
                                type="button"
                                onClick={() => form.pick(client.id)}
                                className="flex min-h-10 w-full items-center justify-between gap-3 rounded-[18px] px-3.5 text-left text-[15px] outline-none hover:bg-white/[0.06] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <span className="truncate">{client.name}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {client.registered
                                        ? 'Su MioPersonal'
                                        : 'Nella rubrica'}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {form.query.trim() !== '' &&
                !form.chosen &&
                form.matches.length === 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            const [first, ...rest] = form.query
                                .trim()
                                .split(/\s+/u);
                            form.setMode('new');
                            form.setFirstName(first);
                            form.setLastName(rest.join(' '));
                        }}
                        className="self-start pl-4 text-[13px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        Nessun cliente trovato: aggiungi “{form.query.trim()}”
                    </button>
                )}
        </div>
    );
}

function GlassInput({
    id,
    label,
    value,
    onChange,
    icon: Icon,
    type = 'text',
    autoComplete = 'off',
    invalid = false,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon?: typeof Phone;
    type?: string;
    autoComplete?: string;
    invalid?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex h-12.5 min-w-0 items-center gap-2 rounded-full px-4',
                glassFieldClassName,
                invalid && 'border-destructive',
            )}
        >
            {Icon && (
                <Icon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                />
            )}
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <input
                id={id}
                type={type}
                autoComplete={autoComplete}
                placeholder={label}
                value={value}
                aria-invalid={invalid}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 min-w-0 flex-1 border-0 bg-transparent p-0 text-[17px] tracking-[-0.43px] outline-none placeholder:text-muted-foreground"
            />
        </div>
    );
}

function PillButton({
    icon: Icon,
    label,
    active,
    onClick,
    children,
}: {
    icon: typeof Clock;
    label: string;
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-expanded={active}
            onClick={onClick}
            className={cn(
                'flex h-12.5 min-w-0 flex-1 items-center gap-2.5 rounded-full px-4 text-[17px] tracking-[-0.43px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                glassFieldClassName,
                active && 'border-brand',
            )}
        >
            <Icon
                aria-hidden="true"
                className={cn(
                    'size-4.5 shrink-0',
                    active ? 'text-brand' : 'text-muted-foreground',
                )}
            />
            <span className="flex-1 truncate text-left tabular-nums">
                {children}
            </span>
            <ChevronsUpDown
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
            />
        </button>
    );
}
