import { ChevronDown, Copy, Plus, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Section, TimeSelect } from '@/components/onboarding/dark-fields';
import {
    Counter,
    DarkCard,
    SwitchRow,
} from '@/components/onboarding/trainer/dark-bits';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import { weeklyHours } from '@/components/onboarding/trainer/draft';
import { bookingRuleOptions } from '@/components/trainer/hours/booking-rules-fields';
import { Switch } from '@/components/ui/switch';
import { darkSwitchClassName } from '@/lib/dark-form';
import { cn } from '@/lib/utils';
import type { BookingRules } from '@/types';

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

/** The trainer works in whole hours, from 6 to 24 (TrainerProfileRequest). */
const FIRST_HOUR = 6;
const LAST_HOUR = 24;

/** A range of work: from `start` to `end` (end excluded), whole hours. */
type HourRange = { start: number; end: number };

const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
const hourOptions = Array.from(
    { length: LAST_HOUR - FIRST_HOUR + 1 },
    (_, index) => pad(FIRST_HOUR + index),
);

/** [7, 8, 9, 18, 19] → 07:00–10:00 and 18:00–20:00. */
export function toRanges(hours: number[]): HourRange[] {
    const ranges: HourRange[] = [];

    [...hours]
        .sort((a, b) => a - b)
        .forEach((hour) => {
            const last = ranges.at(-1);

            if (last && last.end === hour) {
                last.end = hour + 1;
            } else {
                ranges.push({ start: hour, end: hour + 1 });
            }
        });

    return ranges;
}

/** The ranges back to the start hours the server keeps. */
function fromRanges(ranges: HourRange[]): number[] {
    const hours = new Set<number>();

    ranges.forEach(({ start, end }) => {
        for (let hour = start; hour < end; hour++) {
            if (hour >= FIRST_HOUR && hour < LAST_HOUR) {
                hours.add(hour);
            }
        }
    });

    return [...hours].sort((a, b) => a - b);
}

/** "07:00–12:00". */
export function rangeLabel({ start, end }: HourRange): string {
    return `${pad(start)}–${pad(end)}`;
}

/** "46 ore a settimana · 6 giorni". */
export function hoursSummary(hours: number[][]): string {
    const total = weeklyHours(hours);
    const days = hours.filter((day) => day.length > 0).length;

    return `${total} ${total === 1 ? 'ora' : 'ore'} a settimana · ${days} ${days === 1 ? 'giorno' : 'giorni'}`;
}

/** A new range after the last one: 2 hours, where there is room. */
function nextRange(ranges: HourRange[]): HourRange {
    const start = Math.min(ranges.at(-1)?.end ?? 9, LAST_HOUR - 1);

    return { start, end: Math.min(start + 2, LAST_HOUR) };
}

/**
 * Step 5 "Orari e regole": the ranges of each day (whole hours, 06:00–24:00)
 * and the booking rules. The same values are in "Disponibilità".
 */
export default function StepHours({ draft, update }: StepProps) {
    const total = weeklyHours(draft.hours);

    return (
        <div className="flex flex-col gap-10 md:gap-12">
            <WorkingHours
                hours={draft.hours}
                onChange={(hours) => update({ hours })}
                total={total}
            />
            <Rules
                rules={draft.rules}
                autoConfirm={draft.autoConfirm}
                update={update}
            />
        </div>
    );
}

function WorkingHours({
    hours,
    onChange,
    total,
}: {
    hours: number[][];
    onChange: (hours: number[][]) => void;
    total: number;
}) {
    const [editing, setEditing] = useState<{
        day: number;
        index: number;
    } | null>(null);
    // The hours of a day switched off, to put them back when switched on.
    const lastHours = useRef<Record<number, number[]>>({});

    const setDay = (day: number, ranges: HourRange[]) =>
        onChange(
            hours.map((current, index) =>
                index === day ? fromRanges(ranges) : current,
            ),
        );

    const switchDay = (day: number, on: boolean) => {
        if (on) {
            onChange(
                hours.map((current, index) =>
                    index === day
                        ? (lastHours.current[day] ?? [9, 10, 11, 12])
                        : current,
                ),
            );
        } else {
            lastHours.current[day] = hours[day];
            setDay(day, []);
            setEditing(null);
        }
    };

    const copyMonday = () =>
        onChange(
            hours.map((current, day) =>
                day === 0 || current.length === 0 ? current : [...hours[0]],
            ),
        );

    return (
        <Section
            title="Orari di lavoro"
            aside={<Counter>{total} h / settimana</Counter>}
        >
            <ul className="flex flex-col rounded-[26px] bg-card px-4 md:rounded-none md:bg-transparent md:px-0">
                {hours.map((dayHours, day) => {
                    const ranges = toRanges(dayHours);
                    const on = ranges.length > 0;
                    const edited =
                        editing?.day === day ? ranges[editing.index] : null;

                    return (
                        <li
                            key={weekdays[day]}
                            className="flex flex-col gap-3 border-b border-separator py-3 last:border-b-0 md:border-border"
                        >
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                                <Switch
                                    checked={on}
                                    onCheckedChange={(value) =>
                                        switchDay(day, value)
                                    }
                                    aria-label={`Lavoro di ${weekdays[day].toLowerCase()}`}
                                    className={darkSwitchClassName}
                                />
                                <span className="flex w-26 shrink-0 flex-col">
                                    <span className="text-[17px] leading-5.5 font-semibold">
                                        {weekdays[day]}
                                    </span>
                                    <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                        {on
                                            ? `${dayHours.length} ${dayHours.length === 1 ? 'ora' : 'ore'}`
                                            : 'Non lavoro'}
                                    </span>
                                </span>
                                {on && (
                                    <div className="flex min-w-0 basis-full flex-wrap gap-2 md:flex-1 md:basis-0">
                                        {ranges.map((range, index) => {
                                            const open =
                                                editing?.day === day &&
                                                editing.index === index;

                                            return (
                                                <span
                                                    key={range.start}
                                                    className={cn(
                                                        'flex h-10 items-center rounded-full text-[15px] font-semibold tabular-nums',
                                                        open
                                                            ? 'text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]'
                                                            : 'shadow-[inset_0_0_0_1px_var(--field)]',
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        aria-expanded={open}
                                                        aria-label={`${weekdays[day]}, ${rangeLabel(range)}: modifica`}
                                                        onClick={() =>
                                                            setEditing(
                                                                open
                                                                    ? null
                                                                    : {
                                                                          day,
                                                                          index,
                                                                      },
                                                            )
                                                        }
                                                        className="h-10 rounded-l-full pr-1.5 pl-3.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    >
                                                        {rangeLabel(range)}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Togli la fascia ${rangeLabel(range)} di ${weekdays[day].toLowerCase()}`}
                                                        onClick={() => {
                                                            setDay(
                                                                day,
                                                                ranges.filter(
                                                                    (_, i) =>
                                                                        i !==
                                                                        index,
                                                                ),
                                                            );
                                                            setEditing(null);
                                                        }}
                                                        className="flex size-10 items-center justify-center rounded-r-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    >
                                                        <X
                                                            aria-hidden="true"
                                                            className="size-4"
                                                        />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                        {ranges.at(-1)!.end < LAST_HOUR && (
                                            <button
                                                type="button"
                                                aria-label={`Aggiungi una fascia a ${weekdays[day].toLowerCase()}`}
                                                onClick={() => {
                                                    const added =
                                                        nextRange(ranges);
                                                    setDay(day, [
                                                        ...ranges,
                                                        added,
                                                    ]);
                                                    setEditing(null);
                                                }}
                                                className="flex h-10 items-center gap-1 rounded-full border border-dashed border-field pr-3.5 pl-2.5 text-[15px] font-semibold text-brand outline-none hover:bg-brand/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            >
                                                <Plus
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                                Fascia
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {edited && editing && (
                                <div className="flex flex-wrap items-center gap-2 md:ml-16">
                                    <TimeSelect
                                        label={`${weekdays[day]}: inizio`}
                                        value={pad(edited.start)}
                                        options={hourOptions.slice(0, -1)}
                                        onChange={(value) =>
                                            setDay(
                                                day,
                                                ranges.map((range, i) =>
                                                    i === editing.index
                                                        ? {
                                                              start: parseInt(
                                                                  value,
                                                              ),
                                                              end: Math.max(
                                                                  range.end,
                                                                  parseInt(
                                                                      value,
                                                                  ) + 1,
                                                              ),
                                                          }
                                                        : range,
                                                ),
                                            )
                                        }
                                        className="w-30"
                                    />
                                    <span aria-hidden="true">–</span>
                                    <TimeSelect
                                        label={`${weekdays[day]}: fine`}
                                        value={pad(edited.end)}
                                        options={hourOptions}
                                        from={pad(edited.start)}
                                        onChange={(value) =>
                                            setDay(
                                                day,
                                                ranges.map((range, i) =>
                                                    i === editing.index
                                                        ? {
                                                              ...range,
                                                              end: parseInt(
                                                                  value,
                                                              ),
                                                          }
                                                        : range,
                                                ),
                                            )
                                        }
                                        className="w-30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setEditing(null)}
                                        className="min-h-11 px-2 text-[15px] font-semibold underline underline-offset-3 outline-none hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        Fatto
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            <button
                type="button"
                onClick={copyMonday}
                className="flex min-h-11 items-center gap-2 self-start text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <Copy aria-hidden="true" className="size-4" />
                Copia lunedì sugli altri giorni
            </button>
        </Section>
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
            <DarkCard className="gap-0 py-1 md:p-0 md:px-5">
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
                                    className="h-11 cursor-pointer appearance-none rounded-full border-0 bg-transparent pr-9 pl-4 text-right text-[15px] font-semibold text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
