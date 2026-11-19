import {
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Clock,
    Euro,
    MapPin,
    Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import WheelPicker, {
    labelMinutes,
    timeOptions,
} from '@/components/mp/wheel-picker';
import type { SessionForm } from '@/components/trainer/session/use-session-form';
import {
    MAX_MINUTES,
    MIN_MINUTES,
} from '@/components/trainer/session/use-session-form';
import { monthCells, monthName, shiftMonth } from '@/lib/calendar';
import { formatDayLong, formatDuration, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

/** The glass of the designs ("Vetro"): a panel over the page. */
export const glassPanelClassName =
    'border border-white/10 bg-[#1c1c1cb8] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_16px_48px_-8px_rgba(0,0,0,0.75)] backdrop-blur-[24px] backdrop-saturate-[1.8]';

/** A field or a group of rows on the glass. */
export const glassFieldClassName =
    'border border-white/10 bg-[#1c1c1cb8] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]';

/** A round icon button on the glass: "Chiudi", "Annulla". */
export const glassRoundClassName =
    'inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-foreground outline-none transition-colors hover:bg-white/[0.14] focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** The thin line between two rows of a group. */
export function RowSeparator() {
    return <div aria-hidden="true" className="ml-12 h-px bg-white/10" />;
}

/** "Contatti", "Seduta", "Dettagli": the grey title of a group. */
export function GroupTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="pl-4 text-[15px] font-semibold tracking-[-0.23px] text-muted-foreground">
            {children}
        </h3>
    );
}

/**
 * A row with a native menu on top of it (invisible): the label on the
 * left, the value in grey on the right, the up/down chevrons.
 */
export function SelectRow({
    icon: Icon,
    label,
    shown,
    value,
    onChange,
    options,
}: {
    icon: LucideIcon;
    label: string;
    shown: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    const id = useId();

    return (
        <div className="relative flex min-h-13 items-center gap-3 px-4 text-[17px] tracking-[-0.43px] focus-within:bg-white/[0.04]">
            <Icon
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
            />
            <label htmlFor={id} className="flex-1">
                {label}
            </label>
            <span className="max-w-[55%] truncate text-muted-foreground tabular-nums">
                {shown}
            </span>
            <ChevronsUpDown
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
            />
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/** The durations of the menu: every 15 minutes, plus the one of the service. */
function durationOptions(current: number): { value: string; label: string }[] {
    const values = new Set<number>([current]);

    for (let minutes = MIN_MINUTES; minutes <= MAX_MINUTES; minutes += 15) {
        values.add(minutes);
    }

    return [...values]
        .sort((a, b) => a - b)
        .map((minutes) => ({
            value: String(minutes),
            label: `${minutes} min`,
        }));
}

/** "Tipo", "Durata" (and "Prezzo", "Dove") of the session. */
export function SessionRows({
    form,
    withPrice = false,
}: {
    form: SessionForm;
    withPrice?: boolean;
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-[26px]',
                glassFieldClassName,
            )}
        >
            <SelectRow
                icon={Tag}
                label="Tipo"
                shown={form.service?.name ?? ''}
                value={String(form.serviceId)}
                onChange={(value) => form.chooseService(Number(value))}
                options={form.services.map((service) => ({
                    value: String(service.id),
                    label: `${service.name} · ${service.minutes} min · ${formatPrice(service.priceCents)}`,
                }))}
            />
            <RowSeparator />
            <SelectRow
                icon={Clock}
                label="Durata"
                shown={`${form.minutes} min`}
                value={String(form.minutes)}
                onChange={(value) => form.setMinutes(Number(value))}
                options={durationOptions(form.minutes)}
            />
            {form.places.length > 1 && (
                <>
                    <RowSeparator />
                    <SelectRow
                        icon={MapPin}
                        label="Dove"
                        shown={
                            form.places.find(
                                (place) => place.id === form.placeId,
                            )?.label ?? ''
                        }
                        value={String(form.placeId)}
                        onChange={(value) => form.setPlaceId(Number(value))}
                        options={form.places.map((place) => ({
                            value: String(place.id),
                            label: place.label,
                        }))}
                    />
                </>
            )}
            {withPrice && form.service && (
                <>
                    <RowSeparator />
                    <div className="flex min-h-13 items-center gap-3 px-4 text-[17px] tracking-[-0.43px]">
                        <Euro
                            aria-hidden="true"
                            className="size-5 shrink-0 text-muted-foreground"
                        />
                        <span className="flex-1">Prezzo</span>
                        <span className="text-muted-foreground tabular-nums">
                            {formatPrice(form.service.priceCents)}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

/** "Scegli il giorno": the month, the days before today can't be chosen. */
export function DayPicker({
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
    const label = monthName(month).replace(/^./u, (letter) =>
        letter.toUpperCase(),
    );
    const arrowClassName =
        'flex size-8 items-center justify-center rounded-full bg-white/[0.08] outline-none hover:bg-white/[0.14] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40';

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
                <span className="text-[17px] font-semibold">{label}</span>
                <div className="flex gap-1">
                    <button
                        type="button"
                        disabled={month <= today.slice(0, 7)}
                        onClick={() => setMonth(shiftMonth(month, -1))}
                        aria-label="Mese precedente"
                        className={arrowClassName}
                    >
                        <ChevronLeft aria-hidden="true" className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setMonth(shiftMonth(month, 1))}
                        aria-label="Mese successivo"
                        className={arrowClassName}
                    >
                        <ChevronRight aria-hidden="true" className="size-4" />
                    </button>
                </div>
            </div>
            <div
                role="group"
                aria-label={label}
                className="grid grid-cols-7 gap-0.5"
            >
                {WEEKDAYS.map((day, index) => (
                    <span
                        key={index}
                        aria-hidden="true"
                        className="flex h-6 items-center justify-center text-xs font-semibold text-muted-foreground"
                    >
                        {day}
                    </span>
                ))}
                {cells.map((date, index) => {
                    if (date === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const selected = date === value;

                    return (
                        <button
                            key={date}
                            type="button"
                            disabled={date < today}
                            aria-pressed={selected}
                            aria-label={`${formatDayLong(date)}${date === today ? ', oggi' : ''}`}
                            onClick={() => onChange(date)}
                            className={cn(
                                'h-10 rounded-xl text-[15px] tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:text-[#585858]',
                                selected
                                    ? 'bg-brand font-bold text-[#0a0a0a]'
                                    : 'hover:bg-white/[0.08]',
                                !selected &&
                                    date === today &&
                                    'font-bold text-brand',
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

/** The starts of the wheel "Inizio": every 15 minutes, 06:00–23:45. */
const START_OPTIONS = timeOptions(6 * 60, 23 * 60 + 45, 15);

/** "Scegli l’ora": the wheels "Inizio" and "Fine", and the minutes between. */
export function TimeWheels({ form }: { form: SessionForm }) {
    const start = labelMinutes(form.time);
    const endOptions = timeOptions(
        start + MIN_MINUTES,
        Math.min(start + MAX_MINUTES, 24 * 60),
        15,
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 px-2">
                <WheelPicker
                    label="Inizio"
                    options={START_OPTIONS}
                    value={form.time}
                    onChange={form.setTime}
                />
                <span
                    aria-hidden="true"
                    className="mt-[94px] text-[22px] text-muted-foreground"
                >
                    –
                </span>
                <WheelPicker
                    label="Fine"
                    options={endOptions}
                    value={form.end}
                    onChange={form.setEnd}
                />
            </div>
            <p className="flex items-center justify-center gap-2 text-[15px] text-muted-foreground">
                <Clock aria-hidden="true" className="size-4" />
                <b className="font-semibold text-foreground">
                    {formatDuration(form.minutes)}
                </b>
            </p>
        </div>
    );
}

/** The messages of the server that have no field of their own. */
export function FormErrors({ messages }: { messages: (string | undefined)[] }) {
    const shown = messages.filter(Boolean);

    if (shown.length === 0) {
        return null;
    }

    return (
        <div
            role="alert"
            className="rounded-[18px] border border-destructive/50 bg-destructive/10 px-4 py-3 text-[15px] leading-5"
        >
            {shown.map((message) => (
                <p key={message}>{message}</p>
            ))}
        </div>
    );
}

/** "Gio 19 nov 2026" for the pill of the sheet. */
export function shortDate(date: string, withYear = true): string {
    const day = new Date(`${date}T12:00:00Z`);
    const text = new Intl.DateTimeFormat('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        ...(withYear ? { year: 'numeric' } : {}),
        timeZone: 'UTC',
    }).format(day);

    return text.replace(/^./u, (letter) => letter.toUpperCase());
}
