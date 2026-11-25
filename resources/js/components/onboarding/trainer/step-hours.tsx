import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, ChevronDown, Clock, Copy, Plus, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import WheelPicker, { timeOptions } from '@/components/mp/wheel-picker';
import { Section } from '@/components/onboarding/dark-fields';
import {
    Counter,
    DarkCard,
    SwitchRow,
} from '@/components/onboarding/trainer/dark-bits';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import { bookingRuleOptions } from '@/components/trainer/hours/booking-rules-fields';
import { Switch } from '@/components/ui/switch';
import { darkSwitchClassName } from '@/lib/dark-form';
import { formatHours } from '@/lib/format';
import type { HourRange } from '@/lib/hours';
import {
    FIRST_MINUTE,
    LAST_MINUTE,
    STEP,
    dayHours,
    nextRange,
    normalizeRanges,
    rangeLabel,
    timeLabel,
    weeklyHours,
} from '@/lib/hours';
import { cn } from '@/lib/utils';
import type { BookingRules } from '@/types';

export { rangeLabel };

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

const weekdays = [
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato',
    'Domenica',
];

/** "46 ore a settimana · 6 giorni". */
export function hoursSummary(hours: HourRange[][]): string {
    const total = weeklyHours(hours);
    const days = hours.filter((day) => day.length > 0).length;

    return `${formatHours(total)} a settimana · ${days} ${days === 1 ? 'giorno' : 'giorni'}`;
}

/** The hours of a day switched on again: 09:00–13:00. */
const DEFAULT_DAY: HourRange[] = [{ start: 9 * 60, end: 13 * 60 }];

/**
 * Step 5 "Orari e regole": the ranges of each day (06:00–24:00, on the half
 * hour) and the booking rules. The same values are in "Disponibilità".
 */
export default function StepHours({ draft, update }: StepProps) {
    return (
        <div className="flex flex-col gap-10 md:gap-12">
            <WorkingHours
                hours={draft.hours}
                onChange={(hours) => update({ hours })}
                total={weeklyHours(draft.hours)}
            />
            <Rules
                rules={draft.rules}
                autoConfirm={draft.autoConfirm}
                update={update}
            />
        </div>
    );
}

/** The range being added or changed in the sheet. */
type Editing = { day: number; index: number | null; range: HourRange };

/**
 * "Orari di lavoro" (design "Aggiungi fascia"): a row for each day with its
 * ranges as chips, "+ Fascia" and the switch. A chip or "+ Fascia" opens
 * "Modifica fascia" / "Nuova fascia" with the wheels "Dalle" and "Alle".
 */
export function WorkingHours({
    hours,
    onChange,
    total,
    days,
}: {
    hours: HourRange[][];
    onChange: (hours: HourRange[][]) => void;
    total: number;
    /** Only these days (0 = Monday): a single day of "Modifica un giorno". */
    days?: number[];
}) {
    const [editing, setEditing] = useState<Editing | null>(null);
    // The ranges of a day switched off, to put them back when switched on.
    const lastHours = useRef<Record<number, HourRange[]>>({});

    const setDay = (day: number, ranges: HourRange[]) =>
        onChange(
            hours.map((current, index) =>
                index === day ? normalizeRanges(ranges) : current,
            ),
        );

    const switchDay = (day: number, on: boolean) => {
        if (on) {
            setDay(day, lastHours.current[day] ?? DEFAULT_DAY);
        } else {
            lastHours.current[day] = hours[day];
            setDay(day, []);
        }
    };

    const copyMonday = () =>
        onChange(
            hours.map((current, day) =>
                day === 0 || current.length === 0
                    ? current
                    : hours[0].map((range) => ({ ...range })),
            ),
        );

    const save = (range: HourRange) => {
        if (!editing) {
            return;
        }

        const ranges = hours[editing.day].filter(
            (_, index) => index !== editing.index,
        );
        setDay(editing.day, [...ranges, range]);
        setEditing(null);
    };

    return (
        <Section
            title="Orari di lavoro"
            aside={
                <Counter>
                    {total.toLocaleString('it-IT')} h
                    {days ? '' : ' / settimana'}
                </Counter>
            }
        >
            <ul className="flex flex-col border-t border-separator">
                {hours.map((ranges, day) => {
                    if (days && !days.includes(day)) {
                        return null;
                    }

                    const on = ranges.length > 0;
                    const amount = dayHours(ranges);

                    return (
                        <li
                            key={weekdays[day]}
                            className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-white/[0.17] py-3.5 last:border-b-0"
                        >
                            <span className="flex w-28 shrink-0 flex-col">
                                <span className="text-[17px] leading-5.5 font-semibold tracking-[-0.43px]">
                                    {weekdays[day]}
                                </span>
                                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                    {on ? formatHours(amount) : ' '}
                                </span>
                            </span>

                            <div className="order-last flex min-w-0 basis-full flex-wrap items-center gap-2 sm:order-none sm:min-w-60 sm:flex-1 sm:basis-0">
                                {!on && (
                                    <span className="text-[15px] text-muted-foreground">
                                        Non lavoro
                                    </span>
                                )}
                                {ranges.map((range, index) => (
                                    <span
                                        key={range.start}
                                        className="inline-flex h-9 items-center rounded-full bg-secondary text-[15px] font-semibold tracking-[-0.23px] tabular-nums"
                                    >
                                        <button
                                            type="button"
                                            aria-label={`${weekdays[day]}, ${rangeLabel(range)}: modifica`}
                                            onClick={() =>
                                                setEditing({
                                                    day,
                                                    index,
                                                    range,
                                                })
                                            }
                                            className="h-9 rounded-l-full pr-0.5 pl-3.5 outline-none hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            {rangeLabel(range)}
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Togli la fascia ${rangeLabel(range)} di ${weekdays[day].toLowerCase()}`}
                                            onClick={() =>
                                                setDay(
                                                    day,
                                                    ranges.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                            className="mr-1 flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            <X
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        </button>
                                    </span>
                                ))}
                                {on && ranges.at(-1)!.end < LAST_MINUTE && (
                                    <button
                                        type="button"
                                        aria-label={`Aggiungi una fascia a ${weekdays[day].toLowerCase()}`}
                                        onClick={() =>
                                            setEditing({
                                                day,
                                                index: null,
                                                range: nextRange(ranges),
                                            })
                                        }
                                        className="inline-flex h-9 items-center gap-1 rounded-full bg-brand-soft pr-3.5 pl-2.5 text-[15px] font-semibold tracking-[-0.23px] text-brand outline-none hover:bg-brand/20 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <Plus
                                            aria-hidden="true"
                                            className="size-4.5"
                                        />
                                        Fascia
                                    </button>
                                )}
                            </div>

                            <Switch
                                checked={on}
                                onCheckedChange={(value) =>
                                    switchDay(day, value)
                                }
                                aria-label={`Lavoro di ${weekdays[day].toLowerCase()}`}
                                className={cn(darkSwitchClassName, 'ml-auto')}
                            />
                        </li>
                    );
                })}
            </ul>
            {!days && (
                <button
                    type="button"
                    onClick={copyMonday}
                    className="flex min-h-11 items-center gap-2 self-start text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <Copy aria-hidden="true" className="size-4" />
                    Copia lunedì sugli altri giorni
                </button>
            )}

            {editing && (
                <RangeDialog
                    key={`${editing.day}-${editing.index}`}
                    editing={editing}
                    dayName={weekdays[editing.day]}
                    onClose={() => setEditing(null)}
                    onSave={save}
                />
            )}
        </Section>
    );
}

/** "Dalle": every half hour, 06:00–23:30. */
const START_OPTIONS = timeOptions(FIRST_MINUTE, LAST_MINUTE - STEP, STEP);

/**
 * "Nuova fascia" / "Modifica fascia": a glass sheet from the bottom on
 * phones (design "Sheet con rotelle"), a window in the middle on desktop
 * ("Modale con rotelle"). Ranges that overlap the others are joined.
 */
function RangeDialog({
    editing,
    dayName,
    onClose,
    onSave,
}: {
    editing: Editing;
    dayName: string;
    onClose: () => void;
    onSave: (range: HourRange) => void;
}) {
    const [range, setRange] = useState(editing.range);
    const title = editing.index === null ? 'Nuova fascia' : 'Modifica fascia';
    const action = editing.index === null ? 'Aggiungi fascia' : 'Salva fascia';
    const endOptions = timeOptions(range.start + STEP, LAST_MINUTE, STEP);
    const minutes = (label: string) => {
        const [h, m] = label.split(':').map(Number);

        return h * 60 + m;
    };

    const roundClassName =
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-foreground outline-none hover:bg-white/[0.14] focus-visible:ring-[3px] focus-visible:ring-ring/50';

    return (
        <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="theme-dark fixed inset-0 z-50 bg-black/55! backdrop-blur-[4px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="theme-dark fixed inset-x-2 bottom-2 z-50 flex flex-col gap-4.5 rounded-[38px] border border-white/10 bg-[#1c1c1cb8] px-4 pt-2.5 pb-5 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_16px_48px_-8px_rgba(0,0,0,0.75)] backdrop-blur-[24px] backdrop-saturate-[1.8] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-[min(460px,calc(100%-48px))] md:-translate-x-1/2 md:-translate-y-1/2 md:gap-5 md:p-5.5 md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95"
                >
                    <span
                        aria-hidden="true"
                        className="h-1.25 w-9 self-center rounded-full bg-white/25 md:hidden"
                    />

                    {/* Phones: X, the title and ✓ in a row. */}
                    <div className="flex items-center justify-between md:hidden">
                        <DialogPrimitive.Close
                            aria-label="Annulla"
                            className={roundClassName}
                        >
                            <X aria-hidden="true" className="size-5" />
                        </DialogPrimitive.Close>
                        <div className="text-center">
                            <DialogPrimitive.Title className="text-[17px] font-semibold tracking-[-0.43px]">
                                {title}
                            </DialogPrimitive.Title>
                            <p className="text-[13px] text-muted-foreground">
                                {dayName}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label={action}
                            onClick={() => onSave(range)}
                            className="inline-flex size-11 items-center justify-center rounded-full bg-brand text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)] outline-none hover:bg-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <Check
                                aria-hidden="true"
                                className="size-5.5"
                                strokeWidth={2.4}
                            />
                        </button>
                    </div>

                    {/* Desktop: the title on the left, X on the right. */}
                    <div className="hidden items-center gap-3 md:flex">
                        <div className="flex-1">
                            <h2 className="text-[22px] font-bold tracking-[-0.26px]">
                                {title}
                            </h2>
                            <p className="mt-0.5 text-[15px] text-muted-foreground">
                                {dayName}
                            </p>
                        </div>
                        <DialogPrimitive.Close
                            aria-label="Chiudi"
                            className={cn(roundClassName, 'size-10')}
                        >
                            <X aria-hidden="true" className="size-4.5" />
                        </DialogPrimitive.Close>
                    </div>

                    <div className="flex items-start gap-3 px-2 md:px-3">
                        <WheelPicker
                            label="Dalle"
                            options={START_OPTIONS}
                            value={timeLabel(range.start)}
                            onChange={(value) => {
                                const start = minutes(value);
                                const length = range.end - range.start;
                                setRange({
                                    start,
                                    end: Math.min(start + length, LAST_MINUTE),
                                });
                            }}
                        />
                        <span
                            aria-hidden="true"
                            className="mt-[94px] text-[22px] text-muted-foreground"
                        >
                            –
                        </span>
                        <WheelPicker
                            label="Alle"
                            options={endOptions}
                            value={timeLabel(range.end)}
                            onChange={(value) =>
                                setRange({ ...range, end: minutes(value) })
                            }
                        />
                    </div>

                    <p className="flex items-center justify-center gap-2 text-[15px] text-muted-foreground">
                        <Clock aria-hidden="true" className="size-4" />
                        <b className="font-semibold text-foreground">
                            {formatHours((range.end - range.start) / 60)}
                        </b>
                    </p>

                    <div className="hidden gap-2 md:flex">
                        <DialogPrimitive.Close className="h-11 flex-1 rounded-full border border-white/10 bg-white/[0.08] text-[15px] tracking-[-0.23px] outline-none hover:bg-white/[0.14] focus-visible:ring-[3px] focus-visible:ring-ring/50">
                            Annulla
                        </DialogPrimitive.Close>
                        <button
                            type="button"
                            onClick={() => onSave(range)}
                            className="h-11 flex-1 rounded-full bg-brand text-[15px] font-semibold tracking-[-0.23px] text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)] outline-none hover:bg-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {action}
                        </button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

/** "Regole di prenotazione": a row with a menu for each rule, then the auto-confirm. */
function Rules({
    rules,
    autoConfirm,
    update,
}: {
    rules: BookingRules;
    autoConfirm: boolean;
    update: StepProps['update'];
}) {
    const id = useId();

    return (
        <Section title="Regole di prenotazione">
            <DarkCard className="gap-0 border-t py-0">
                {bookingRuleOptions.map((rule) => {
                    const value = rules[rule.name];

                    return (
                        <div
                            key={rule.name}
                            className="flex min-h-15 items-center justify-between gap-3 border-b border-separator py-2 last:border-b-0"
                        >
                            <label
                                htmlFor={`${id}-${rule.name}`}
                                className="text-[17px] leading-5.5"
                            >
                                {rule.label}
                            </label>
                            <div className="relative flex items-center">
                                <select
                                    id={`${id}-${rule.name}`}
                                    value={value === null ? '' : String(value)}
                                    onChange={(event) =>
                                        update({
                                            rules: {
                                                ...rules,
                                                [rule.name]:
                                                    event.target.value === ''
                                                        ? null
                                                        : Number(
                                                              event.target
                                                                  .value,
                                                          ),
                                            },
                                        })
                                    }
                                    className="h-11 cursor-pointer appearance-none rounded-full border-0 bg-transparent pr-9 pl-4 text-right text-[17px] font-semibold text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-[15px]"
                                >
                                    {rule.options.map((option) => (
                                        <option
                                            key={option ?? 'none'}
                                            value={
                                                option === null
                                                    ? ''
                                                    : String(option)
                                            }
                                        >
                                            {option === null
                                                ? 'Nessun limite'
                                                : rule.name ===
                                                    'maxSessionsPerDay'
                                                  ? `Max ${option}`
                                                  : rule.format(option)}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    aria-hidden="true"
                                    className="pointer-events-none absolute right-3 size-4.5 text-brand"
                                />
                            </div>
                        </div>
                    );
                })}
            </DarkCard>
            <DarkCard>
                <SwitchRow
                    title="Conferma automatica"
                    description={
                        autoConfirm
                            ? 'Le prenotazioni sono confermate da subito.'
                            : 'Ogni richiesta la confermi tu: hai 24 ore di tempo per rispondere.'
                    }
                    checked={autoConfirm}
                    onCheckedChange={(value) => update({ autoConfirm: value })}
                />
            </DarkCard>
        </Section>
    );
}
