import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, Copy, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import TrainerAvailabilityController from '@/actions/App/Http/Controllers/TrainerAvailabilityController';
import { AreaSwitch } from '@/components/mp/area-bits';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import ProfilePage, {
    SaveBar,
} from '@/components/trainer/profile-pages/profile-page';
import { bookingRuleOptions } from '@/components/trainer/hours/booking-rules-fields';
import ClosureDialog from '@/components/trainer/hours/closure-dialog';
import type { FasciaEditing } from '@/components/trainer/hours/fascia-dialog';
import FasciaDialog, {
    WEEKDAYS,
} from '@/components/trainer/hours/fascia-dialog';
import { addDays, mondayOf, weekDates } from '@/lib/calendar';
import type { DayChanges } from '@/lib/day-overrides';
import {
    changesPayload,
    closedBlocks,
    dayChanges,
    setDay,
} from '@/lib/day-overrides';
import {
    formatDayMonth,
    formatDayMonthShort,
    formatDayRange,
    formatHours,
} from '@/lib/format';
import type { HourRange } from '@/lib/hours';
import { nextRange, normalizeRanges, rangeLabel } from '@/lib/hours';
import { cn } from '@/lib/utils';
import { register } from '@/routes/trainer';
import type {
    BookingRules,
    TrainerAvailability,
    TrainerDayOverrideBlock,
} from '@/types';

type AvailabilityProps = {
    /** null until the registration is sent. */
    availability: TrainerAvailability | null;
    /** The days with other hours or closed, from today on. */
    overrides: TrainerDayOverrideBlock[];
    /** Rome date of today. */
    today: string;
};

/** "Orari", "Ferie e chiusure", "Regole di prenotazione". */
const sectionTitleClassName =
    'text-[22px] leading-7 font-bold tracking-[-0.01em]';

export default function Availability({
    availability,
    overrides,
    today,
}: AvailabilityProps) {
    return (
        <>
            <Head title="Le tue disponibilità" />

            <ProfilePage
                title="Disponibilità"
                intro="Quando i clienti possono prenotarti e con quali regole."
                introClassName="hidden md:block"
                className="lg:max-w-295"
            >
                {availability === null ? (
                    <p className="text-[15px] text-muted-foreground">
                        Scegli i tuoi orari nella{' '}
                        <Link
                            href={register()}
                            className="font-semibold text-brand underline-offset-4 hover:underline"
                        >
                            registrazione da trainer
                        </Link>
                        : poi potrai cambiarli da qui.
                    </p>
                ) : (
                    <AvailabilityForm
                        availability={availability}
                        overrides={overrides}
                        today={today}
                    />
                )}
            </ProfilePage>
        </>
    );
}

type FormData = TrainerAvailability & { days: DayChanges };

/**
 * "Disponibilità" (design "Trainer · Disponibilità · nuovo"): "Orari" with
 * "Orari abituali" and "Per settimana", "Ferie e chiusure" (in the second
 * tab), "Regole di prenotazione" and "Salva modifiche", which saves it all.
 * Desktop: the hours on the left, the rules on the right.
 */
function AvailabilityForm({
    availability,
    overrides,
    today,
}: {
    availability: TrainerAvailability;
    overrides: TrainerDayOverrideBlock[];
    today: string;
}) {
    const form = useForm<FormData>({
        ...availability,
        days: dayChanges(overrides),
    });
    const [tab, setTab] = useState<'base' | 'week'>('base');
    const errors: Partial<Record<string, string>> = form.errors;
    const firstError = (prefixes: string[]) =>
        Object.entries(errors).find(([field]) =>
            prefixes.some((prefix) => field.startsWith(prefix)),
        )?.[1];
    const messages = [
        firstError(['hours']),
        ...bookingRuleOptions.map((rule) => errors[rule.field]),
        errors.auto_confirm,
        firstError(['days', 'reset']),
    ].filter((message): message is string => Boolean(message));

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            hours: data.hours,
            notice_hours: data.rules.noticeHours,
            booking_window_days: data.rules.bookingWindowDays,
            break_minutes: data.rules.breakMinutes,
            // Not on the page: sent back as it is.
            max_sessions_per_day: data.rules.maxSessionsPerDay,
            free_cancellation_hours: data.rules.freeCancellationHours,
            auto_confirm: data.autoConfirm,
            // Only the days changed since the page was loaded (or saved).
            ...changesPayload(dayChanges(overrides), data.days),
        }));
        form.put(TrainerAvailabilityController.update.url(), {
            preserveScroll: true,
            onSuccess: () => form.setDefaults(),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-9">
            {messages.length > 0 && (
                <StepErrors errors={messages} title="Da sistemare:" />
            )}

            <div className="flex flex-col gap-9 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-14">
                <div className="flex min-w-0 flex-col gap-9">
                    <HoursSection
                        tab={tab}
                        onTab={setTab}
                        hours={form.data.hours}
                        days={form.data.days}
                        today={today}
                        onHours={(hours) => form.setData('hours', hours)}
                        onDays={(days) => form.setData('days', days)}
                    />
                    {tab === 'week' && (
                        <ClosuresSection
                            hours={form.data.hours}
                            days={form.data.days}
                            today={today}
                            onDays={(days) => form.setData('days', days)}
                        />
                    )}
                </div>

                <div className="lg:sticky lg:top-6">
                    <RulesSection
                        rules={form.data.rules}
                        autoConfirm={form.data.autoConfirm}
                        onRules={(rules) => form.setData('rules', rules)}
                        onAutoConfirm={(autoConfirm) =>
                            form.setData('autoConfirm', autoConfirm)
                        }
                    />
                </div>
            </div>

            <SaveBar start disabled={!form.isDirty} saving={form.processing} />
        </form>
    );
}

const WEEK_NAMES = [
    'Questa settimana',
    'Prossima settimana',
    'Tra 2 settimane',
    'Tra 3 settimane',
];

const LETTERS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

/** The hours of a day switched on again: 09:00–13:00. */
const DEFAULT_DAY: HourRange[] = [{ start: 9 * 60, end: 13 * 60 }];

/**
 * "Orari": the two tabs, the week with its arrows ("Per settimana"), then a
 * row for each day with "Copia", the switch, the ranges and "+ Fascia".
 */
function HoursSection({
    tab,
    onTab,
    hours,
    days,
    today,
    onHours,
    onDays,
}: {
    tab: 'base' | 'week';
    onTab: (tab: 'base' | 'week') => void;
    hours: HourRange[][];
    days: DayChanges;
    today: string;
    onHours: (hours: HourRange[][]) => void;
    onDays: (days: DayChanges) => void;
}) {
    const id = useId();
    const [week, setWeek] = useState(0);
    const [copyFrom, setCopyFrom] = useState<number | null>(null);
    const [copyTo, setCopyTo] = useState<number[]>([]);
    const [editing, setEditing] = useState<FasciaEditing | null>(null);
    // The ranges of a usual day switched off, to put them back when switched on.
    const lastHours = useRef<Record<number, HourRange[]>>({});

    const byWeek = tab === 'week';
    const monday = addDays(mondayOf(today), week * 7);
    const dates = weekDates(monday);
    const past = (day: number) => byWeek && dates[day] < today;
    const rangesOf = (day: number) =>
        byWeek ? (days[dates[day]]?.hours ?? hours[day]) : hours[day];
    const changed = dates.filter((date) => date in days);

    // New ranges for some days: the usual week, or the dates of this week.
    const update = (changes: Record<number, HourRange[]>) => {
        if (byWeek) {
            let next = days;

            Object.entries(changes).forEach(([day, ranges]) => {
                next = setDay(
                    next,
                    dates[Number(day)],
                    normalizeRanges(ranges),
                    hours[Number(day)],
                );
            });
            onDays(next);
        } else {
            onHours(
                hours.map((ranges, day) =>
                    day in changes ? normalizeRanges(changes[day]) : ranges,
                ),
            );
        }
    };

    const switchDay = (day: number) => {
        const ranges = rangesOf(day);

        if (ranges.length > 0) {
            if (!byWeek) {
                lastHours.current[day] = ranges;
            }

            update({ [day]: [] });
        } else if (byWeek) {
            update({ [day]: hours[day].length > 0 ? hours[day] : DEFAULT_DAY });
        } else {
            update({ [day]: lastHours.current[day] ?? DEFAULT_DAY });
        }
    };

    const saveRange = (range: HourRange, chosen: number[]) => {
        if (!editing) {
            return;
        }

        if (editing.index !== null) {
            update({
                [editing.day]: [
                    ...rangesOf(editing.day).filter(
                        (_, index) => index !== editing.index,
                    ),
                    range,
                ],
            });
        } else {
            update(
                Object.fromEntries(
                    chosen.map((day) => [day, [...rangesOf(day), range]]),
                ),
            );
        }

        setEditing(null);
    };

    const goTab = (next: 'base' | 'week') => {
        setCopyFrom(null);
        onTab(next);
    };

    const tabClassName = (on: boolean) =>
        cn(
            'h-10 flex-1 rounded-full text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
            on
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-foreground',
        );
    const arrowClassName =
        'flex size-10 items-center justify-center rounded-xl bg-card text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-35';

    return (
        <section className="flex flex-col gap-3.5">
            <h2 className={sectionTitleClassName}>Orari</h2>
            <div
                role="tablist"
                aria-label="Quali orari modifichi"
                className="flex rounded-full bg-card p-1"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={!byWeek}
                    onClick={() => goTab('base')}
                    className={tabClassName(!byWeek)}
                >
                    Orari abituali
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={byWeek}
                    onClick={() => goTab('week')}
                    className={tabClassName(byWeek)}
                >
                    Per settimana
                </button>
            </div>

            {byWeek && (
                <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            aria-label="Settimana precedente"
                            disabled={week === 0}
                            onClick={() => setWeek(week - 1)}
                            className={arrowClassName}
                        >
                            <ChevronLeft
                                aria-hidden="true"
                                className="size-5"
                                strokeWidth={2.2}
                            />
                        </button>
                        <div
                            aria-live="polite"
                            className="flex min-w-0 flex-1 flex-col gap-0.5 text-center"
                        >
                            <b className="text-lg">
                                {formatDayRange(dates[0], dates[6])}
                            </b>
                            <span className="text-[13px] leading-4.5 text-muted-foreground">
                                {WEEK_NAMES[week]}
                            </span>
                        </div>
                        <button
                            type="button"
                            aria-label="Settimana successiva"
                            disabled={week === WEEK_NAMES.length - 1}
                            onClick={() => setWeek(week + 1)}
                            className={arrowClassName}
                        >
                            <ChevronRight
                                aria-hidden="true"
                                className="size-5"
                                strokeWidth={2.2}
                            />
                        </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-3.5 py-3">
                        <span
                            className={cn(
                                'text-sm font-semibold',
                                changed.length > 0
                                    ? 'text-brand'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {changed.length === 0
                                ? 'Uguale agli orari abituali'
                                : changed.length === 1
                                  ? '1 giorno diverso dal solito'
                                  : `${changed.length} giorni diversi dal solito`}
                        </span>
                        {changed.some((date) => date >= today) && (
                            <button
                                type="button"
                                onClick={() => {
                                    const next = { ...days };
                                    changed
                                        .filter((date) => date >= today)
                                        .forEach((date) => delete next[date]);
                                    onDays(next);
                                }}
                                className="h-8 shrink-0 rounded-[10px] bg-[#1c1e21] px-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Ripristina
                            </button>
                        )}
                    </div>
                </div>
            )}

            <ul className="flex flex-col">
                {WEEKDAYS.map((name, day) => {
                    const ranges = rangesOf(day);
                    const on = ranges.length > 0;
                    const date = byWeek ? dates[day] : null;
                    const mod = date !== null && date in days;
                    const locked = past(day);
                    const copying = !byWeek && copyFrom === day;
                    const labelId = `${id}-${day}`;

                    return (
                        <li key={name} className="flex flex-col gap-3 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex min-w-0 flex-1 items-baseline gap-2">
                                    <b
                                        id={labelId}
                                        className="text-[17px] font-bold"
                                    >
                                        {name}
                                    </b>
                                    {date && (
                                        <span className="text-[13px] leading-4.5 text-muted-foreground">
                                            {formatDayMonthShort(date)}
                                        </span>
                                    )}
                                </div>
                                {!byWeek && on && (
                                    <button
                                        type="button"
                                        aria-expanded={copying}
                                        onClick={() => {
                                            setCopyFrom(copying ? null : day);
                                            setCopyTo([]);
                                        }}
                                        className={cn(
                                            'inline-flex h-8.5 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                            copying
                                                ? 'bg-brand text-black'
                                                : 'bg-card text-foreground',
                                        )}
                                    >
                                        <Copy
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Copia
                                    </button>
                                )}
                                <AreaSwitch
                                    checked={on}
                                    onToggle={() => switchDay(day)}
                                    disabled={locked}
                                    labelledBy={labelId}
                                />
                            </div>

                            {on ? (
                                <div className="flex flex-wrap gap-2">
                                    {ranges.map((range, index) => (
                                        <span
                                            key={range.start}
                                            className={cn(
                                                'inline-flex h-10 items-center rounded-xl text-[15px] font-semibold tabular-nums',
                                                mod
                                                    ? 'bg-brand/12 text-brand'
                                                    : 'bg-card text-foreground',
                                            )}
                                        >
                                            <button
                                                type="button"
                                                disabled={locked}
                                                aria-label={`${name}, ${rangeLabel(range)}: modifica`}
                                                onClick={() =>
                                                    setEditing({
                                                        day,
                                                        index,
                                                        range,
                                                    })
                                                }
                                                className="h-10 rounded-l-xl pr-1 pl-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                {rangeLabel(range)}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={locked}
                                                aria-label={`Togli la fascia ${rangeLabel(range)} di ${name.toLowerCase()}`}
                                                onClick={() =>
                                                    update({
                                                        [day]: ranges.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    })
                                                }
                                                className="mr-1 flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <X
                                                    aria-hidden="true"
                                                    className="size-4"
                                                />
                                            </button>
                                        </span>
                                    ))}
                                    {/* Always next to the ranges, as in the design. */}
                                    {!locked && (
                                        <button
                                            type="button"
                                            aria-label={`Aggiungi una fascia a ${name.toLowerCase()}`}
                                            onClick={() =>
                                                setEditing({
                                                    day,
                                                    index: null,
                                                    range: nextRange(ranges),
                                                })
                                            }
                                            className="inline-flex h-10 items-center rounded-xl px-3 text-[15px] font-semibold text-brand outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            + Fascia
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <span className="text-[15px] text-muted-foreground">
                                    Non lavori
                                </span>
                            )}

                            {mod && !locked && (
                                <div className="flex items-center justify-between gap-2.5">
                                    <span className="text-[13px] font-semibold text-brand">
                                        {on
                                            ? 'Orari solo per questa settimana'
                                            : 'Giorno libero solo questa settimana'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = { ...days };
                                            delete next[date];
                                            onDays(next);
                                        }}
                                        className="text-[13px] font-semibold text-muted-foreground underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        Torna agli orari abituali
                                    </button>
                                </div>
                            )}

                            {copying && (
                                <CopyPanel
                                    day={day}
                                    chosen={copyTo}
                                    onChosen={setCopyTo}
                                    onCancel={() => setCopyFrom(null)}
                                    onApply={() => {
                                        update(
                                            Object.fromEntries(
                                                copyTo.map((other) => [
                                                    other,
                                                    ranges.map((range) => ({
                                                        ...range,
                                                    })),
                                                ]),
                                            ),
                                        );
                                        setCopyFrom(null);
                                    }}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>

            {editing && (
                <FasciaDialog
                    key={`${editing.day}-${editing.index}`}
                    editing={editing}
                    disabledDays={[0, 1, 2, 3, 4, 5, 6].filter(past)}
                    onClose={() => setEditing(null)}
                    onSave={saveRange}
                />
            )}
        </section>
    );
}

/** "Copia gli orari di lunedì su": the other days, then "Copia su 2 giorni". */
function CopyPanel({
    day,
    chosen,
    onChosen,
    onCancel,
    onApply,
}: {
    day: number;
    chosen: number[];
    onChosen: (days: number[]) => void;
    onCancel: () => void;
    onApply: () => void;
}) {
    const others = (days: number[]) => days.filter((other) => other !== day);
    const linkClassName =
        'text-sm font-semibold text-brand outline-none focus-visible:ring-2 focus-visible:ring-ring';

    return (
        <div className="flex flex-col gap-3 rounded-[18px] bg-card p-3.5">
            <b className="text-[15px]">
                Copia gli orari di {WEEKDAYS[day].toLowerCase()} su
            </b>
            <div className="grid grid-cols-7 gap-1.5">
                {LETTERS.map((letter, other) => {
                    const self = other === day;
                    const on = chosen.includes(other);

                    return (
                        <button
                            key={other}
                            type="button"
                            aria-label={WEEKDAYS[other]}
                            aria-pressed={on}
                            disabled={self}
                            onClick={() =>
                                onChosen(
                                    on
                                        ? chosen.filter((d) => d !== other)
                                        : [...chosen, other],
                                )
                            }
                            className={cn(
                                'h-11 w-full rounded-xl text-[15px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                self
                                    ? 'bg-transparent text-[#5e6268] shadow-[inset_0_0_0_1.5px_#2a2c30]'
                                    : on
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-[#1c1e21] text-foreground',
                            )}
                        >
                            {letter}
                        </button>
                    );
                })}
            </div>
            <div className="flex gap-3.5">
                <button
                    type="button"
                    onClick={() => onChosen(others([0, 1, 2, 3, 4]))}
                    className={linkClassName}
                >
                    Lun – Ven
                </button>
                <button
                    type="button"
                    onClick={() => onChosen(others([0, 1, 2, 3, 4, 5, 6]))}
                    className={linkClassName}
                >
                    Tutta la settimana
                </button>
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-11 rounded-full px-4 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Annulla
                </button>
                <button
                    type="button"
                    disabled={chosen.length === 0}
                    onClick={onApply}
                    className="h-11 flex-1 rounded-full bg-primary text-[15px] font-bold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                    {chosen.length === 0
                        ? 'Scegli i giorni'
                        : `Copia su ${chosen.length} ${chosen.length === 1 ? 'giorno' : 'giorni'}`}
                </button>
            </div>
        </div>
    );
}

/** "Ferie e chiusure": the closed days, removed with ✕, and "+ Aggiungi". */
function ClosuresSection({
    hours,
    days,
    today,
    onDays,
}: {
    hours: HourRange[][];
    days: DayChanges;
    today: string;
    onDays: (days: DayChanges) => void;
}) {
    const [adding, setAdding] = useState(false);
    const blocks = closedBlocks(days);

    return (
        <section className="flex flex-col gap-3">
            <h2 className={sectionTitleClassName}>Ferie e chiusure</h2>
            <p className="text-[15px] leading-5 text-muted-foreground">
                In questi giorni nessuno può prenotarti.
            </p>
            {blocks.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {blocks.map((block) => {
                        const label =
                            block.from === block.to
                                ? formatDayMonth(`${block.from}T12:00:00Z`)
                                : formatDayRange(block.from, block.to);

                        return (
                            <li
                                key={block.from}
                                className="flex items-center gap-3 rounded-2xl bg-card py-3.5 pr-2 pl-4"
                            >
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <b className="text-base">{label}</b>
                                    {block.note && (
                                        <span className="text-sm text-muted-foreground">
                                            {block.note}
                                        </span>
                                    )}
                                </span>
                                <button
                                    type="button"
                                    aria-label={`Rimuovi ${label}`}
                                    onClick={() => {
                                        const next = { ...days };
                                        block.dates.forEach(
                                            (date) => delete next[date],
                                        );
                                        onDays(next);
                                    }}
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <X
                                        aria-hidden="true"
                                        className="size-4"
                                        strokeWidth={2.4}
                                    />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
            <button
                type="button"
                onClick={() => setAdding(true)}
                className="h-11 self-start rounded-full bg-card px-4.5 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                + Aggiungi ferie o chiusura
            </button>
            <ClosureDialog
                open={adding}
                onOpenChange={setAdding}
                today={today}
                onAdd={(dates, note) => {
                    let next = days;

                    dates.forEach((date) => {
                        const weekday =
                            (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
                        next = setDay(next, date, [], hours[weekday], note);
                    });
                    onDays(next);
                }}
            />
        </section>
    );
}

type RuleName = Exclude<keyof BookingRules, 'maxSessionsPerDay'>;

/** The rules of the design, with its words; the values of bookingRuleOptions. */
const RULES: {
    name: RuleName;
    label: string;
    format: (n: number) => string;
}[] = [
    { name: 'noticeHours', label: 'Preavviso minimo', format: formatHours },
    {
        name: 'bookingWindowDays',
        label: 'Prenotabile fino a',
        format: (n) => `${n} giorni`,
    },
    {
        name: 'breakMinutes',
        label: 'Pausa tra sedute',
        format: (n) => (n === 0 ? 'Nessuna' : `${n} min`),
    },
    {
        name: 'freeCancellationHours',
        label: 'Cancellazione gratis',
        format: (n) => `${n} ore prima`,
    },
];

/** "Regole di prenotazione": four menus and "Conferma automatica". */
function RulesSection({
    rules,
    autoConfirm,
    onRules,
    onAutoConfirm,
}: {
    rules: BookingRules;
    autoConfirm: boolean;
    onRules: (rules: BookingRules) => void;
    onAutoConfirm: (on: boolean) => void;
}) {
    const id = useId();

    return (
        <section className="flex flex-col gap-4">
            <h2 className={sectionTitleClassName}>Regole di prenotazione</h2>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5">
                {RULES.map((rule) => {
                    const options =
                        bookingRuleOptions.find(
                            (option) => option.name === rule.name,
                        )?.options ?? [];

                    return (
                        <div
                            key={rule.name}
                            className="flex min-w-0 flex-col gap-2"
                        >
                            <label
                                htmlFor={`${id}-${rule.name}`}
                                className="text-sm font-semibold"
                            >
                                {rule.label}
                            </label>
                            <div className="relative">
                                <select
                                    id={`${id}-${rule.name}`}
                                    value={rules[rule.name]}
                                    onChange={(event) =>
                                        onRules({
                                            ...rules,
                                            [rule.name]: Number(
                                                event.target.value,
                                            ),
                                        })
                                    }
                                    className="h-12.5 w-full cursor-pointer appearance-none rounded-[14px] bg-card pr-10 pl-4 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {options.map(
                                        (option) =>
                                            option !== null && (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {rule.format(option)}
                                                </option>
                                            ),
                                    )}
                                </select>
                                <ChevronDown
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-1/2 right-3.5 size-4.5 -translate-y-1/2"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-3.5 py-1.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b id={`${id}-auto`} className="text-[17px] leading-5.5">
                        Conferma automatica
                    </b>
                    <span
                        id={`${id}-auto-note`}
                        className="text-sm text-muted-foreground"
                    >
                        {autoConfirm
                            ? 'Le richieste diventano subito sedute confermate.'
                            : 'Ogni richiesta la confermi tu, entro 24 ore.'}
                    </span>
                </span>
                <AreaSwitch
                    checked={autoConfirm}
                    onToggle={() => onAutoConfirm(!autoConfirm)}
                    labelledBy={`${id}-auto`}
                    describedBy={`${id}-auto-note`}
                />
            </div>
        </section>
    );
}

Availability.layout = { section: 'availability' };
