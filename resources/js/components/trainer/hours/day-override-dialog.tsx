import { useForm } from '@inertiajs/react';
import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import TrainerAvailabilityController from '@/actions/App/Http/Controllers/TrainerAvailabilityController';
import { pillFieldClassName } from '@/components/onboarding/dark-fields';
import { weeklyHours } from '@/components/onboarding/trainer/draft';
import { WorkingHours } from '@/components/onboarding/trainer/step-hours';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { addDays, hourLabel, mondayOf } from '@/lib/calendar';
import { formatDayLong, formatDayRange } from '@/lib/format';
import { cn } from '@/lib/utils';

type Kind = 'day' | 'week' | 'period';

const kinds: { value: Kind; label: string }[] = [
    { value: 'day', label: 'Un giorno' },
    { value: 'week', label: 'Una settimana' },
    { value: 'period', label: 'Più giorni (ferie)' },
];

/** As in TrainerDayOverrideRequest. */
const MAX_DAYS = 92;
const NOTE_MAX = 60;
/** Start hours of the grid, 6:00 … 23:00. */
const allHours = Array.from({ length: 18 }, (_, index) => 6 + index);

const pill =
    'chip h-10 px-3.5 text-sm first:rounded-full last:rounded-full hover:bg-white/5';

/** 0 = Monday … 6 = Sunday, as in the grid. */
const weekdayOf = (date: string) =>
    (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;

type DayOverrideDialogProps = {
    /** "Orari di base": the starting point of "Orari diversi". */
    baseHours: number[][];
    /** Rome date: no day before it. */
    today: string;
    trigger: ReactNode;
};

/**
 * "Modifica un giorno o una settimana": what (a day, a week, the holidays),
 * when, and how (closed, or other hours). Saved right away
 * (TrainerAvailabilityController::storeOverride).
 */
export default function DayOverrideDialog({
    baseHours,
    today,
    trigger,
}: DayOverrideDialogProps) {
    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState<Kind>('day');
    const fromId = useId();
    const toId = useId();
    const noteId = useId();

    const form = useForm({
        from: today,
        to: today,
        closed: true,
        hours: baseHours,
        note: '',
    });
    const { data, setData, errors } = form;

    // Every time it opens it starts again from the weekly hours.
    const changeOpen = (next: boolean) => {
        setOpen(next);

        if (next) {
            setKind('day');
            form.clearErrors();
            setData({
                from: today,
                to: today,
                closed: true,
                hours: baseHours,
                note: '',
            });
        }
    };

    const changeKind = (next: Kind) => {
        setKind(next);

        if (next === 'week') {
            // The week of the chosen day, never starting in the past.
            const monday = mondayOf(data.from);
            setData({
                ...data,
                from: monday < today ? today : monday,
                to: addDays(monday, 6),
            });
        } else {
            setData({ ...data, to: data.from });
        }
    };

    const changeFrom = (from: string) => {
        if (from === '') {
            return;
        }

        if (kind === 'week') {
            const monday = mondayOf(from);
            setData({
                ...data,
                from: monday < today ? today : monday,
                to: addDays(monday, 6),
            });
        } else if (kind === 'day') {
            setData({ ...data, from, to: from });
        } else {
            setData({ ...data, from, to: data.to < from ? from : data.to });
        }
    };

    // One day: the hours of that weekday only.
    const weekday = weekdayOf(data.from);
    const dayHours = data.hours[weekday] ?? [];
    const setDayHours = (hours: number[]) =>
        setData(
            'hours',
            data.hours.map((current, index) =>
                index === weekday ? [...hours].sort((a, b) => a - b) : current,
            ),
        );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(TrainerAvailabilityController.storeOverride.url(), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    const hoursError = Object.entries(errors as Record<string, string>).find(
        ([field]) => field.startsWith('hours'),
    )?.[1];
    const when =
        data.from === data.to
            ? formatDayLong(data.from)
            : formatDayRange(data.from, data.to);

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[26px] sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Modifica un giorno o una settimana
                    </DialogTitle>
                    <DialogDescription>
                        Vale solo per i giorni che scegli: nelle altre settimane
                        restano gli orari di base.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <ToggleGroup
                        type="single"
                        aria-label="Cosa vuoi modificare"
                        value={kind}
                        onValueChange={(value) =>
                            value !== '' && changeKind(value as Kind)
                        }
                        className="flex-wrap gap-2"
                    >
                        {kinds.map((option) => (
                            <ToggleGroupItem
                                key={option.value}
                                value={option.value}
                                className={pill}
                            >
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor={fromId} className="font-semibold">
                                {kind === 'day'
                                    ? 'Giorno'
                                    : kind === 'week'
                                      ? 'Un giorno della settimana'
                                      : 'Dal'}
                            </Label>
                            <Input
                                id={fromId}
                                type="date"
                                min={today}
                                value={data.from}
                                onChange={(event) =>
                                    changeFrom(event.target.value)
                                }
                                aria-invalid={!!errors.from}
                                className={pillFieldClassName}
                            />
                        </div>
                        {kind === 'period' && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={toId} className="font-semibold">
                                    Al (compreso)
                                </Label>
                                <Input
                                    id={toId}
                                    type="date"
                                    min={data.from}
                                    max={addDays(data.from, MAX_DAYS - 1)}
                                    value={data.to}
                                    onChange={(event) =>
                                        event.target.value !== '' &&
                                        setData('to', event.target.value)
                                    }
                                    aria-invalid={!!errors.to}
                                    className={pillFieldClassName}
                                />
                            </div>
                        )}
                    </div>
                    <p className="-mt-2 text-sm text-muted-foreground">
                        {when}
                    </p>
                    {(errors.from ?? errors.to) && (
                        <p
                            role="alert"
                            className="-mt-3 text-sm text-destructive"
                        >
                            {errors.from ?? errors.to}
                        </p>
                    )}

                    <ToggleGroup
                        type="single"
                        aria-label="Come"
                        value={data.closed ? 'closed' : 'hours'}
                        onValueChange={(value) =>
                            value !== '' &&
                            setData('closed', value === 'closed')
                        }
                        className="grid grid-cols-2 gap-1 rounded-full p-1 shadow-[inset_0_0_0_1px_var(--field)]"
                    >
                        <ToggleGroupItem
                            value="closed"
                            className="h-10.5 rounded-full first:rounded-full data-[state=on]:bg-transparent data-[state=on]:font-semibold data-[state=on]:text-brand data-[state=on]:shadow-[inset_0_0_0_1.5px_var(--brand)]"
                        >
                            Chiuso
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="hours"
                            className="h-10.5 rounded-full last:rounded-full data-[state=on]:bg-transparent data-[state=on]:font-semibold data-[state=on]:text-brand data-[state=on]:shadow-[inset_0_0_0_1.5px_var(--brand)]"
                        >
                            Orari diversi
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {!data.closed &&
                        (kind === 'day' ? (
                            <DayHours hours={dayHours} onChange={setDayHours} />
                        ) : (
                            <WorkingHours
                                hours={data.hours}
                                onChange={(hours) => setData('hours', hours)}
                                total={weeklyHours(data.hours)}
                            />
                        ))}
                    {!data.closed && kind === 'period' && (
                        <p className="-mt-2 text-sm text-muted-foreground">
                            Ogni giorno del periodo prende gli orari del suo
                            giorno della settimana.
                        </p>
                    )}
                    {hoursError && (
                        <p role="alert" className="text-sm text-destructive">
                            {hoursError}
                        </p>
                    )}

                    <div className="flex flex-col gap-2">
                        <Label htmlFor={noteId} className="font-semibold">
                            Nota per te{' '}
                            <span className="font-normal text-muted-foreground">
                                · facoltativa, es. «Ferie»
                            </span>
                        </Label>
                        <Input
                            id={noteId}
                            value={data.note}
                            maxLength={NOTE_MAX}
                            onChange={(event) =>
                                setData('note', event.target.value)
                            }
                            className={pillFieldClassName}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            data-fill
                            className="h-12 px-6 font-semibold"
                        >
                            Salva
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** The hours of one day, one button per hour. */
function DayHours({
    hours,
    onChange,
}: {
    hours: number[];
    onChange: (hours: number[]) => void;
}) {
    return (
        <div
            role="group"
            aria-label="Orari di quel giorno"
            className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5"
        >
            {allHours.map((hour) => {
                const on = hours.includes(hour);

                return (
                    <button
                        key={hour}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                            onChange(
                                on
                                    ? hours.filter((item) => item !== hour)
                                    : [...hours, hour],
                            )
                        }
                        className={cn(
                            'h-9 rounded-full border text-[13px] font-medium tabular-nums',
                            on
                                ? 'border-brand bg-transparent text-brand'
                                : 'border-dashed border-field bg-transparent hover:border-brand',
                        )}
                    >
                        {hourLabel(hour)}
                    </button>
                );
            })}
        </div>
    );
}
