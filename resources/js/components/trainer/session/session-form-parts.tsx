import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { labelMinutes, minutesLabel } from '@/components/mp/wheel-picker';
import { Avatar } from '@/components/trainer/calendar/session-row';
import { shortDay } from '@/components/trainer/calendar/session-status';
import type { SessionForm } from '@/components/trainer/session/use-session-form';
import { Spinner } from '@/components/ui/spinner';
import { monthCells, monthName, shiftMonth } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';

const focusRing =
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]';

/** "CLIENTE", "QUANDO"…: the small grey titles of the sections. */
export function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <span className="text-[13px] font-semibold text-muted-foreground">
            {children}
        </span>
    );
}

function ErrorText({ children }: { children?: string }) {
    return children ? (
        <p role="alert" className="m-0 text-[13px] leading-4.5 text-[#FF7A7A]">
            {children}
        </p>
    ) : null;
}

/** A pill of TIPO DI SEDUTA, LUOGO and DURATA. */
function Pill({
    on,
    onClick,
    children,
}: {
    on: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={on}
            onClick={onClick}
            className={cn(
                'h-9.5 cursor-pointer rounded-full border-0 px-3.5 text-sm font-semibold',
                focusRing,
                on
                    ? 'bg-[#42D7D9] text-black'
                    : 'bg-[#1C1E21] text-foreground hover:bg-[#26282C]',
            )}
        >
            {children}
        </button>
    );
}

/** The fields of the panels: as `mp-field__input` of the design system. */
const inputClassName =
    'w-full min-h-14 rounded-[14px] border border-[#5E6268] bg-[#121315] px-4 text-[17px] leading-5.5 tracking-[-0.43px] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.5)] outline-none placeholder:text-muted-foreground focus-visible:border-[#42D7D9]';

function TextField({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    autoComplete?: string;
}) {
    const id = useId();

    return (
        <div className="grid min-w-0 gap-2">
            <label
                htmlFor={id}
                className="text-[15px] leading-5 font-semibold tracking-[-0.23px] text-foreground"
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                placeholder={placeholder}
                autoComplete={autoComplete}
                onChange={(event) => onChange(event.target.value)}
                className={inputClassName}
            />
        </div>
    );
}

/** CLIENTE: someone of the list (search and choose) or someone new. */
export function ClientSection({ form }: { form: SessionForm }) {
    const segment = (on: boolean) =>
        cn(
            'h-9.5 flex-1 cursor-pointer rounded-full border-0 text-sm font-semibold',
            focusRing,
            on ? 'bg-[#42D7D9] text-black' : 'bg-transparent text-foreground',
        );

    return (
        <div className="flex flex-col gap-3">
            <SectionLabel>CLIENTE</SectionLabel>
            <div role="tablist" className="flex rounded-full bg-[#0B0C0D] p-1">
                <button
                    type="button"
                    role="tab"
                    aria-selected={form.mode === 'search'}
                    onClick={() => form.setMode('search')}
                    className={segment(form.mode === 'search')}
                >
                    Cliente esistente
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={form.mode === 'new'}
                    onClick={() => form.setMode('new')}
                    className={segment(form.mode === 'new')}
                >
                    Nuovo cliente
                </button>
            </div>

            {form.mode === 'search' ? (
                <div className="flex flex-col gap-2">
                    <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3.5 flex text-muted-foreground">
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </span>
                        <input
                            type="search"
                            aria-label="Cerca un cliente"
                            placeholder="Cerca un cliente"
                            value={form.query}
                            onChange={(event) =>
                                form.setQuery(event.target.value)
                            }
                            className={cn(
                                inputClassName,
                                'min-h-11.5 rounded-full pl-10.5',
                            )}
                        />
                    </div>
                    {form.matches.length > 0 ? (
                        <div
                            role="radiogroup"
                            aria-label="Cliente"
                            className="flex flex-col gap-0.5"
                        >
                            {form.matches.map((client) => {
                                const on = form.chosen?.id === client.id;

                                return (
                                    <button
                                        key={client.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={on}
                                        onClick={() => form.pick(client.id)}
                                        className={cn(
                                            'flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 px-2.5 py-2 text-left text-foreground',
                                            focusRing,
                                            on
                                                ? 'bg-[rgba(66,215,217,0.10)]'
                                                : 'bg-transparent hover:bg-white/[0.03]',
                                        )}
                                    >
                                        <Avatar name={client.name} size={36} />
                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <b className="truncate text-[15px] font-semibold">
                                                {client.name}
                                            </b>
                                            {client.detail && (
                                                <span className="truncate text-[13px] text-muted-foreground">
                                                    {client.detail}
                                                </span>
                                            )}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'flex size-5.5 shrink-0 items-center justify-center rounded-full',
                                                on
                                                    ? 'bg-[#42D7D9] text-black'
                                                    : 'text-transparent shadow-[inset_0_0_0_1.5px_#5E6268]',
                                            )}
                                        >
                                            <svg
                                                width="13"
                                                height="13"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M20 6 9 17l-5-5" />
                                            </svg>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="m-0 px-1 text-[13px] text-muted-foreground">
                            {form.clients.length === 0
                                ? 'Non hai ancora clienti: aggiungine uno nuovo.'
                                : 'Nessun cliente con questo nome.'}
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    <TextField
                        label="Nome e cognome"
                        placeholder="Es. Marta Colombo"
                        autoComplete="name"
                        value={form.name}
                        onChange={form.setName}
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                        <TextField
                            label="Telefono"
                            placeholder="+39"
                            type="tel"
                            value={form.phone}
                            onChange={form.setPhone}
                        />
                        <TextField
                            label="Email"
                            placeholder="Facoltativa"
                            type="email"
                            value={form.email}
                            onChange={form.setEmail}
                        />
                    </div>
                </div>
            )}
            <ErrorText>{form.clientError}</ErrorText>
        </div>
    );
}

/** The duration as "1 h", "45 min", "1 h 30". */
export function durationLabel(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const rest = minutes % 60;

    return `${Math.floor(minutes / 60)} h${rest ? ` ${rest}` : ''}`;
}

export type Picker = 'day' | 'time' | null;

/** QUANDO: the day and the time, each opens its picker. */
export function WhenSection({
    form,
    picker,
    onPicker,
    rowRef,
    children,
}: {
    form: SessionForm;
    picker: Picker;
    onPicker: (picker: Picker) => void;
    /** The row of the two buttons: the picker of desktop opens level with it. */
    rowRef?: Ref<HTMLDivElement>;
    /** Phones: the picker, under the buttons. */
    children?: ReactNode;
}) {
    const button = (on: boolean) =>
        cn(
            'flex h-13 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-2xl border-0 bg-[#1C1E21] px-3.5 text-base font-semibold text-foreground tabular-nums',
            focusRing,
            on && 'shadow-[inset_0_0_0_1.5px_#42D7D9]',
        );

    return (
        <div className="flex flex-col gap-2.5">
            <SectionLabel>QUANDO</SectionLabel>
            <div ref={rowRef} className="flex gap-2">
                <button
                    type="button"
                    aria-expanded={picker === 'day'}
                    onClick={() => onPicker(picker === 'day' ? null : 'day')}
                    className={button(picker === 'day')}
                >
                    <span className="flex text-[#42D7D9]">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M8 2v4M16 2v4" />
                            <rect width="18" height="18" x="3" y="4" rx="2" />
                            <path d="M3 10h18" />
                        </svg>
                    </span>
                    <span className="truncate">{shortDay(form.date)}</span>
                </button>
                <button
                    type="button"
                    aria-expanded={picker === 'time'}
                    onClick={() => onPicker(picker === 'time' ? null : 'time')}
                    className={button(picker === 'time')}
                >
                    <span className="flex text-[#42D7D9]">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                    </span>
                    <span className="truncate">
                        {form.time} – {form.end}
                    </span>
                </button>
            </div>
            {children}
            <ErrorText>{form.whenError}</ErrorText>
        </div>
    );
}

/** "Scegli il giorno": the month, from today on. */
export function DayPickerPanel({
    value,
    today,
    onChange,
}: {
    value: string;
    today: string;
    onChange: (date: string) => void;
}) {
    const [month, setMonth] = useState(value.slice(0, 7));
    const [year, monthNumber] = month.split('-').map(Number);
    const cells = monthCells(year, monthNumber);
    // As the calendar: up to 12 months from now.
    const lastMonth = shiftMonth(today.slice(0, 7), 12);
    const arrow =
        'flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-[#1C1E21] text-foreground disabled:cursor-default disabled:opacity-40 ' +
        focusRing;

    return (
        <div
            role="group"
            aria-label="Scegli il giorno"
            className="flex flex-col gap-3.5"
        >
            <div className="flex items-center justify-between">
                <b className="text-[17px] font-bold">
                    {monthName(month).replace(/^./u, (letter) =>
                        letter.toUpperCase(),
                    )}
                </b>
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        aria-label="Mese precedente"
                        disabled={month <= today.slice(0, 7)}
                        onClick={() => setMonth(shiftMonth(month, -1))}
                        className={arrow}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        aria-label="Mese successivo"
                        disabled={month >= lastMonth}
                        onClick={() => setMonth(shiftMonth(month, 1))}
                        className={arrow}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>
            <div
                aria-hidden="true"
                className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground"
            >
                {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((letter, index) => (
                    <span key={index}>{letter}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((date, index) => {
                    if (date === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const on = date === value;

                    return (
                        <button
                            key={date}
                            type="button"
                            aria-label={formatDayLong(date)}
                            aria-pressed={on}
                            disabled={date < today}
                            onClick={() => onChange(date)}
                            className={cn(
                                'h-10 w-full cursor-pointer rounded-xl border-0 p-0 text-[15px] font-semibold tabular-nums disabled:cursor-default',
                                focusRing,
                                on
                                    ? 'bg-[#42D7D9] text-black'
                                    : date === today
                                      ? 'bg-transparent text-[#42D7D9] shadow-[inset_0_0_0_1.5px_#42D7D9]'
                                      : date < today
                                        ? 'bg-transparent text-[#5E6268]'
                                        : 'bg-transparent text-foreground hover:bg-white/5',
                            )}
                        >
                            {Number(date.slice(8))}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** The starts of "Scegli l’ora": every 15 minutes, 06:00 to 23:45. */
const STARTS = Array.from({ length: (24 - 6) * 4 }, (_, index) =>
    minutesLabel(6 * 60 + index * 15),
);
/** FINE: the start plus these minutes. */
const LENGTHS = [30, 45, 60, 90, 120, 150];

/** "Scegli l’ora": INIZIO and FINE side by side, then "Fatto". */
export function TimePickerPanel({
    form,
    onDone,
}: {
    form: SessionForm;
    onDone: () => void;
}) {
    const startsRef = useRef<HTMLDivElement>(null);
    const startMinutes = labelMinutes(form.time);
    const wheel = (on: boolean) =>
        cn(
            'h-11 w-full shrink-0 cursor-pointer rounded-[14px] border-0 tabular-nums',
            focusRing,
            on
                ? 'bg-[rgba(66,215,217,0.14)] text-[22px] font-bold text-[#42D7D9]'
                : 'bg-transparent text-[17px] font-medium text-muted-foreground hover:text-foreground',
        );

    // The start chosen in sight when it opens.
    useEffect(() => {
        startsRef.current
            ?.querySelector<HTMLElement>('[aria-pressed="true"]')
            ?.scrollIntoView({ block: 'center' });
    }, []);

    return (
        <div
            role="group"
            aria-label="Scegli l’ora"
            className="flex flex-col gap-3.5"
        >
            <b className="text-[17px] font-bold">{formatDayLong(form.date)}</b>
            <div className="flex items-start gap-2.5">
                <div className="flex flex-1 flex-col gap-1.5">
                    <span className="text-center text-[13px] font-semibold text-muted-foreground">
                        INIZIO
                    </span>
                    <div
                        ref={startsRef}
                        className="flex h-71 [scrollbar-width:none] flex-col gap-0.5 overflow-y-auto"
                    >
                        {STARTS.map((time) => (
                            <button
                                key={time}
                                type="button"
                                aria-pressed={time === form.time}
                                onClick={() => form.setTime(time)}
                                className={wheel(time === form.time)}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>
                <span
                    aria-hidden="true"
                    className="pt-8.5 text-xl text-muted-foreground"
                >
                    –
                </span>
                <div className="flex flex-1 flex-col gap-1.5">
                    <span className="text-center text-[13px] font-semibold text-muted-foreground">
                        FINE
                    </span>
                    <div className="flex flex-col gap-0.5">
                        {LENGTHS.filter(
                            (length) => startMinutes + length <= 24 * 60,
                        ).map((length) => (
                            <button
                                key={length}
                                type="button"
                                aria-pressed={form.minutes === length}
                                onClick={() => form.setMinutes(length)}
                                className={wheel(form.minutes === length)}
                            >
                                {minutesLabel(startMinutes + length)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold text-[#42D7D9] tabular-nums">
                    {durationLabel(form.minutes)} · {form.time} – {form.end}
                </span>
                <button
                    type="button"
                    onClick={onDone}
                    className={cn(
                        'h-10 cursor-pointer rounded-full border-0 bg-[#42D7D9] px-4.5 font-bold text-black hover:bg-[#7FE6E7]',
                        focusRing,
                    )}
                >
                    Fatto
                </button>
            </div>
        </div>
    );
}

/** TIPO DI SEDUTA (the trainer's services), LUOGO (with more places), DURATA. */
export function SessionSections({ form }: { form: SessionForm }) {
    return (
        <>
            <div className="flex flex-col gap-2.5">
                <SectionLabel>TIPO DI SEDUTA</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                    {form.services.map((service) => (
                        <Pill
                            key={service.id}
                            on={form.serviceId === service.id}
                            onClick={() => form.chooseService(service.id)}
                        >
                            {service.name}
                        </Pill>
                    ))}
                </div>
            </div>

            {form.places.length > 1 && (
                <div className="flex flex-col gap-2.5">
                    <SectionLabel>LUOGO</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                        {form.places.map((place) => (
                            <Pill
                                key={place.id}
                                on={form.placeId === place.id}
                                onClick={() => form.setPlaceId(place.id)}
                            >
                                {place.label}
                            </Pill>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2.5">
                <SectionLabel>DURATA</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                    {[30, 45, 60, 90].map((minutes) => (
                        <Pill
                            key={minutes}
                            on={form.minutes === minutes}
                            onClick={() => form.setMinutes(minutes)}
                        >
                            {durationLabel(minutes)}
                        </Pill>
                    ))}
                </div>
            </div>
        </>
    );
}

/** "+ Aggiungi una nota": the trainer's own note, from the start. */
export function NoteSection({ form }: { form: SessionForm }) {
    const [open, setOpen] = useState(form.note !== '');

    return open ? (
        <textarea
            aria-label="Nota"
            rows={3}
            autoFocus
            placeholder="Es. porta gli elastici"
            value={form.note}
            onChange={(event) => form.setNote(event.target.value)}
            className={cn(inputClassName, 'min-h-21 resize-y pt-3')}
        />
    ) : (
        <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
                'cursor-pointer self-start border-0 bg-transparent py-1 text-[15px] font-semibold text-[#42D7D9]',
                focusRing,
            )}
        >
            + Aggiungi una nota
        </button>
    );
}

/** Annulla and the main button at the bottom of the panels. */
export function PanelFooter({
    onCancel,
    onConfirm,
    label,
    processing = false,
    disabled = false,
    errors = [],
}: {
    onCancel: () => void;
    onConfirm: () => void;
    label: string;
    processing?: boolean;
    disabled?: boolean;
    errors?: string[];
}) {
    return (
        <div className="flex flex-col gap-2 pt-1">
            {errors.map((message) => (
                <ErrorText key={message}>{message}</ErrorText>
            ))}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className={cn(
                        'h-12 cursor-pointer rounded-full border-0 bg-transparent px-5 text-base font-semibold text-foreground hover:bg-white/5',
                        focusRing,
                    )}
                >
                    Annulla
                </button>
                <button
                    type="button"
                    disabled={processing || disabled}
                    onClick={onConfirm}
                    className={cn(
                        'flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-[#42D7D9] text-base font-bold text-black hover:bg-[#7FE6E7] disabled:cursor-default disabled:opacity-60',
                        focusRing,
                    )}
                >
                    {processing && <Spinner />}
                    {label}
                </button>
            </div>
        </div>
    );
}
