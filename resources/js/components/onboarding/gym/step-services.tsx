import { Check, ChevronRight, Copy, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { GymDraft, OpeningRange } from '@/components/onboarding/gym/draft';
import {
    amenityGroups,
    copyMondayToWeekdays,
    dayLabel,
    dayLength,
    MAX_RANGES_PER_DAY,
    nextRange,
    weekdays,
} from '@/components/onboarding/gym/draft';
import {
    DarkError,
    errorOf,
    Field,
    Optional,
    pillFieldClassName,
    Section,
    TimeSelect,
} from '@/components/onboarding/gym/gym-fields';
import { Switch } from '@/components/ui/switch';
import { darkSwitchClassName } from '@/lib/dark-form';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type StepServicesProps = {
    draft: GymDraft;
    update: (changes: Partial<GymDraft>) => void;
    errors: Partial<Record<string, string>>;
    amenities: CatalogOption[];
};

/** "2 servizi · aperta 6 giorni su 7": the summary above "Continua" on phones. */
export function servicesSummary(draft: GymDraft): string {
    const services = draft.amenities.length;
    const days = draft.hours.filter((ranges) => ranges.length > 0).length;

    return `${services} ${services === 1 ? 'servizio' : 'servizi'} · ${
        days === 0 ? 'sempre chiusa' : `aperta ${days} giorni su 7`
    }`;
}

/** Step 3, "Servizi e orari". Desktop: the hours on the left, the services on the right. */
export default function StepServices({
    draft,
    update,
    errors,
    amenities,
}: StepServicesProps) {
    return (
        <div className="flex flex-col gap-10 md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-start md:gap-14">
            <div className="md:order-2">
                <Services
                    value={draft.amenities}
                    onChange={(values) => update({ amenities: values })}
                    options={amenities}
                    error={errorOf(errors, 'amenities')}
                />
            </div>

            <div className="flex flex-col gap-5 md:order-1">
                <Hours
                    hours={draft.hours}
                    onChange={(hours) => update({ hours })}
                    error={errorOf(errors, 'hours')}
                />
                <Field
                    label={
                        <>
                            Note sugli orari <Optional>facoltative</Optional>
                        </>
                    }
                    error={errors.opening_notes}
                >
                    {({ id, describedBy }) => (
                        <input
                            id={id}
                            aria-describedby={describedBy}
                            maxLength={200}
                            value={draft.openingNotes}
                            onChange={(event) =>
                                update({ openingNotes: event.target.value })
                            }
                            placeholder="Es. Chiusa ad agosto, festivi 9–13"
                            className={pillFieldClassName}
                        />
                    )}
                </Field>
            </div>
        </div>
    );
}

/** The services as chips, in 3 groups; turquoise with a tick when chosen. */
function Services({
    value,
    onChange,
    options,
    error,
}: {
    value: string[];
    onChange: (values: string[]) => void;
    options: CatalogOption[];
    error?: string;
}) {
    const grouped = new Set(amenityGroups.flatMap((group) => group.values));
    const groups = amenityGroups.map((group, index) => ({
        title: group.title,
        options: options.filter(
            (option) =>
                group.values.includes(option.value) ||
                // Services added later on the server: in the last group.
                (index === amenityGroups.length - 1 &&
                    !grouped.has(option.value)),
        ),
    }));

    const toggle = (amenity: string) =>
        onChange(
            value.includes(amenity)
                ? value.filter((item) => item !== amenity)
                : [...value, amenity],
        );

    return (
        <Section
            title="Servizi"
            aside={
                value.length > 0 && (
                    <span className="text-[13px] font-semibold text-brand">
                        {value.length}{' '}
                        {value.length === 1 ? 'scelto' : 'scelti'}
                    </span>
                )
            }
            className="gap-5"
        >
            {groups.map(
                (group) =>
                    group.options.length > 0 && (
                        <div
                            key={group.title}
                            className="flex flex-col gap-2.5"
                        >
                            <h3 className="text-xs font-semibold tracking-[0.6px] text-muted-foreground uppercase">
                                {group.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {group.options.map((option) => {
                                    const on = value.includes(option.value);

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            aria-pressed={on}
                                            onClick={() => toggle(option.value)}
                                            className={cn(
                                                'flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:h-10 md:px-3.5',
                                                on
                                                    ? 'pl-3 font-semibold text-brand shadow-[inset_0_0_0_1.5px_var(--brand)] md:pl-2.5'
                                                    : 'text-foreground shadow-[inset_0_0_0_1px_var(--field)] hover:bg-foreground/5',
                                            )}
                                        >
                                            {on && (
                                                <Check
                                                    aria-hidden="true"
                                                    strokeWidth={2.5}
                                                    className="size-4"
                                                />
                                            )}
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ),
            )}
            <DarkError message={error} />
        </Section>
    );
}

type HoursProps = {
    hours: OpeningRange[][];
    onChange: (hours: OpeningRange[][]) => void;
    error?: string;
};

/**
 * "Orari di apertura". Phones: one day open at a time, the others as rows
 * with their hours. Desktop: a row per day with a switch and the ranges as
 * chips; a click on a chip shows its two times under the row.
 */
function Hours({ hours, onChange, error }: HoursProps) {
    const [openDay, setOpenDay] = useState(0);
    const [editing, setEditing] = useState<{
        day: number;
        index: number;
    } | null>(null);
    // The ranges of a day switched off, to put them back when switched on.
    const lastRanges = useRef<Record<number, OpeningRange[]>>({});

    const setDay = (day: number, ranges: OpeningRange[]) =>
        onChange(
            hours.map((current, index) => (index === day ? ranges : current)),
        );

    const setRange = (day: number, index: number, range: OpeningRange) =>
        setDay(
            day,
            hours[day].map((item, i) => (i === index ? range : item)),
        );

    const removeRange = (day: number, index: number) => {
        setDay(
            day,
            hours[day].filter((_, i) => i !== index),
        );
        setEditing(null);
    };

    const addRange = (day: number) => {
        setDay(day, [...hours[day], nextRange(hours[day])]);
        setEditing({ day, index: hours[day].length });
    };

    const switchDay = (day: number, open: boolean) => {
        if (open) {
            setDay(
                day,
                lastRanges.current[day] ?? [
                    { opens: '09:00', closes: '18:00' },
                ],
            );
        } else {
            lastRanges.current[day] = hours[day];
            setDay(day, []);
            setEditing(null);
        }
    };

    const copyMonday = () => onChange(copyMondayToWeekdays(hours));

    return (
        <Section
            title="Orari di apertura"
            aside={
                <button
                    type="button"
                    onClick={copyMonday}
                    className="hidden min-h-11 text-[15px] font-semibold text-foreground underline underline-offset-3 outline-none hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50 md:block"
                >
                    Copia lunedì su martedì–venerdì
                </button>
            }
        >
            {/* Phones. */}
            <div className="overflow-hidden rounded-[26px] bg-card md:hidden">
                {hours.map((ranges, day) =>
                    day === openDay ? (
                        <div
                            key={weekdays[day]}
                            className="flex flex-col gap-3.5 rounded-[26px] p-4 shadow-[inset_0_0_0_1.5px_var(--brand)]"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-[17px] font-semibold">
                                    {weekdays[day]}
                                </h3>
                                <label className="flex min-h-11 items-center gap-2.5 text-[15px] text-muted-foreground">
                                    {ranges.length > 0 ? 'Aperta' : 'Chiusa'}
                                    <Switch
                                        checked={ranges.length > 0}
                                        onCheckedChange={(open) =>
                                            switchDay(day, open)
                                        }
                                        aria-label={`${weekdays[day]} aperta`}
                                        className={darkSwitchClassName}
                                    />
                                </label>
                            </div>
                            {ranges.map((range, index) => (
                                <RangeRow
                                    key={index}
                                    day={day}
                                    index={index}
                                    range={range}
                                    onChange={(changed) =>
                                        setRange(day, index, changed)
                                    }
                                    onRemove={() => removeRange(day, index)}
                                />
                            ))}
                            {ranges.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {ranges.length < MAX_RANGES_PER_DAY && (
                                        <SmallButton
                                            onClick={() => addRange(day)}
                                        >
                                            <Plus
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Fascia
                                        </SmallButton>
                                    )}
                                    <SmallButton
                                        onClick={() =>
                                            setDay(day, [
                                                {
                                                    opens: '00:00',
                                                    closes: '24:00',
                                                },
                                            ])
                                        }
                                    >
                                        24 ore
                                    </SmallButton>
                                </div>
                            )}
                            {day === 0 && (
                                <button
                                    type="button"
                                    onClick={copyMonday}
                                    className="btn-brand h-11 text-[15px]"
                                >
                                    <Copy
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Copia su martedì–venerdì
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            key={weekdays[day]}
                            type="button"
                            onClick={() => setOpenDay(day)}
                            aria-label={`${weekdays[day]}: ${dayLabel(ranges)}. Modifica`}
                            className={cn(
                                'flex min-h-13 w-full items-center justify-between gap-3 px-4 text-left text-[17px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
                                day !== openDay + 1 &&
                                    day !== 0 &&
                                    'border-t border-separator',
                            )}
                        >
                            {weekdays[day]}
                            <span
                                className={cn(
                                    'flex items-center gap-1.5 tabular-nums',
                                    ranges.length > 0
                                        ? 'font-semibold'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {dayLabel(ranges)}
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-4.5 text-muted-foreground"
                                />
                            </span>
                        </button>
                    ),
                )}
            </div>

            {/* Desktop. */}
            <ul className="hidden flex-col md:flex">
                {hours.map((ranges, day) => (
                    <li
                        key={weekdays[day]}
                        className="flex flex-col gap-3 border-b border-border py-2.5 last:border-b-0"
                    >
                        <div className="flex min-h-12 items-center gap-4">
                            <Switch
                                checked={ranges.length > 0}
                                onCheckedChange={(open) => switchDay(day, open)}
                                aria-label={`${weekdays[day]} aperta`}
                                className={darkSwitchClassName}
                            />
                            <span className="flex w-26 shrink-0 flex-col">
                                <span className="text-[17px] leading-5.5 font-semibold">
                                    {weekdays[day]}
                                </span>
                                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                    {ranges.length > 0
                                        ? dayLength(ranges)
                                        : 'Chiusa'}
                                </span>
                            </span>
                            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                                {ranges.map((range, index) => {
                                    const open =
                                        editing?.day === day &&
                                        editing.index === index;

                                    return (
                                        <span
                                            key={index}
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
                                                aria-label={`${weekdays[day]}, ${dayLabel([range], '–')}: modifica`}
                                                onClick={() =>
                                                    setEditing(
                                                        open
                                                            ? null
                                                            : { day, index },
                                                    )
                                                }
                                                className="h-10 rounded-l-full pr-1.5 pl-3.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            >
                                                {dayLabel([range], '–')}
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Togli la fascia ${dayLabel([range], '–')} di ${weekdays[day]}`}
                                                onClick={() =>
                                                    removeRange(day, index)
                                                }
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
                                {ranges.length > 0 &&
                                    ranges.length < MAX_RANGES_PER_DAY && (
                                        <button
                                            type="button"
                                            aria-label={`Aggiungi una fascia a ${weekdays[day].toLowerCase()}`}
                                            onClick={() => addRange(day)}
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
                        </div>
                        {editing?.day === day && ranges[editing.index] && (
                            <div className="ml-16 flex items-center gap-2 pb-1">
                                <RangeRow
                                    day={day}
                                    index={editing.index}
                                    range={ranges[editing.index]}
                                    onChange={(changed) =>
                                        setRange(day, editing.index, changed)
                                    }
                                    onRemove={() =>
                                        removeRange(day, editing.index)
                                    }
                                    className="max-w-90 flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDay(day, [
                                            { opens: '00:00', closes: '24:00' },
                                        ])
                                    }
                                    className="min-h-11 px-2 text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    24 ore
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="min-h-11 px-2 text-[15px] font-semibold text-foreground underline underline-offset-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    Fatto
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            <DarkError message={error} />
        </Section>
    );
}

/** "07:00 – 22:00 ✕": the two times of a range and its remove button. */
function RangeRow({
    day,
    index,
    range,
    onChange,
    onRemove,
    className,
}: {
    day: number;
    index: number;
    range: OpeningRange;
    onChange: (range: OpeningRange) => void;
    onRemove: () => void;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-[minmax(0,1fr)_1rem_minmax(0,1fr)_2.75rem] items-center gap-1.5',
                className,
            )}
        >
            <TimeSelect
                label={`${weekdays[day]}, fascia ${index + 1}, apre alle`}
                value={range.opens}
                onChange={(opens) => onChange({ ...range, opens })}
            />
            <span
                aria-hidden="true"
                className="text-center text-muted-foreground"
            >
                –
            </span>
            <TimeSelect
                label={`${weekdays[day]}, fascia ${index + 1}, chiude alle`}
                value={range.closes}
                from={range.opens}
                onChange={(closes) => onChange({ ...range, closes })}
            />
            <button
                type="button"
                aria-label={`Togli la fascia ${index + 1} di ${weekdays[day]}`}
                onClick={onRemove}
                className="flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <X aria-hidden="true" className="size-5" />
            </button>
        </div>
    );
}

function SmallButton({
    onClick,
    children,
}: {
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold shadow-[inset_0_0_0_1px_var(--field)] outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            {children}
        </button>
    );
}
