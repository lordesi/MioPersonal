import { useState } from 'react';
import ModalSheet, {
    ModalSheetBody,
    ModalSheetFooter,
} from '@/components/mp/modal-sheet';
import MonthCalendar, {
    monthsBetween,
    romeToday,
    shiftMonth,
} from '@/components/mp/month-calendar';
import { addDays } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import type { SearchFilters } from '@/lib/search';

export { romeToday };

export type TimeBand = NonNullable<SearchFilters['fascia']>;

/** "Scegli data" reaches this many days from today (TrainerSearchController::DATE_MAX_DAYS). */
export const DATE_MAX_DAYS = 60;

export const timeBandOptions: { value: TimeBand | null; label: string }[] = [
    { value: null, label: 'Qualsiasi ora' },
    { value: 'mattina', label: 'Mattina' },
    { value: 'pomeriggio', label: 'Pomeriggio' },
    { value: 'sera', label: 'Sera' },
];

type DateSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    date: string | null;
    band: TimeBand | null;
    onApply: (date: string, band: TimeBand | null) => void;
};

/**
 * "Scegli data" (design "DataCalendario" / "DkDataDueMesi"): one month with
 * arrows on phones, two side by side on desktop. Past days are struck
 * through, today has a grey outline, the chosen day a turquoise one.
 */
export default function DateSheet({
    open,
    onOpenChange,
    date,
    band,
    onApply,
}: DateSheetProps) {
    return (
        <ModalSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Scegli data"
            size="lg"
        >
            {/* Mounted only while open: it starts again from the chosen day. */}
            {open && (
                <DatePicker
                    initialDate={date}
                    initialBand={band}
                    onApply={(day, part) => {
                        onApply(day, part);
                        onOpenChange(false);
                    }}
                />
            )}
        </ModalSheet>
    );
}

function DatePicker({
    initialDate,
    initialBand,
    onApply,
}: {
    initialDate: string | null;
    initialBand: TimeBand | null;
    onApply: (date: string, band: TimeBand | null) => void;
}) {
    const today = romeToday();
    const last = addDays(today, DATE_MAX_DAYS);
    const [chosen, setChosen] = useState(initialDate);
    const [band, setBand] = useState(initialBand);

    const [todayYear, todayMonth] = today.split('-').map(Number);
    // How many months after this one hold a day to choose.
    const maxOffset = monthsBetween(today, last);
    const startOffset = chosen
        ? Math.min(maxOffset, monthsBetween(today, chosen))
        : 0;
    const [offset, setOffset] = useState(Math.max(0, startOffset));

    /** One month, `by` months after this one; past days and days out of reach are off. */
    const calendar = (
        by: number,
        arrows: {
            previous?: { disabled: boolean; onClick: () => void };
            next?: { disabled: boolean; onClick: () => void };
        },
        className?: string,
    ) => {
        const { year, month } = shiftMonth(todayYear, todayMonth, by);

        return (
            <MonthCalendar
                year={year}
                month={month}
                today={today}
                selected={chosen}
                onSelect={setChosen}
                day={(day) => ({
                    disabled: day < today || day > last,
                    past: day < today,
                })}
                className={className}
                {...arrows}
            />
        );
    };

    // On desktop the pair moves together: the second month can't pass the last one.
    const desktopMax = Math.max(0, maxOffset - 1);
    const desktopOffset = Math.min(offset, desktopMax);

    return (
        <>
            <ModalSheetBody className="flex flex-col gap-5">
                {calendar(
                    offset,
                    {
                        previous: {
                            disabled: offset === 0,
                            onClick: () => setOffset(offset - 1),
                        },
                        next: {
                            disabled: offset >= maxOffset,
                            onClick: () => setOffset(offset + 1),
                        },
                    },
                    'md:hidden',
                )}
                <div className="hidden grid-cols-2 gap-10 md:grid">
                    {calendar(desktopOffset, {
                        previous:
                            desktopMax > 0
                                ? {
                                      disabled: desktopOffset === 0,
                                      onClick: () =>
                                          setOffset(desktopOffset - 1),
                                  }
                                : undefined,
                    })}
                    {calendar(desktopOffset + 1, {
                        next:
                            desktopMax > 0
                                ? {
                                      disabled: desktopOffset >= desktopMax,
                                      onClick: () =>
                                          setOffset(desktopOffset + 1),
                                  }
                                : undefined,
                    })}
                </div>

                <fieldset>
                    <legend className="mb-2.5 text-[15px] font-semibold">
                        Fascia oraria
                    </legend>
                    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
                        {timeBandOptions.map((option) => (
                            <button
                                key={option.label}
                                type="button"
                                aria-pressed={band === option.value}
                                onClick={() => setBand(option.value)}
                                className="chip justify-center"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </fieldset>
            </ModalSheetBody>

            <ModalSheetFooter>
                {/* Desktop only, as in the design: on phones the day stays marked in sight. */}
                <p
                    className="hidden text-[15px] text-muted-foreground md:block"
                    aria-live="polite"
                >
                    {chosen ? (
                        <>
                            Selezionato:{' '}
                            <strong className="font-semibold text-foreground">
                                {formatDayLong(chosen).toLowerCase()}
                            </strong>
                        </>
                    ) : (
                        'Scegli un giorno nel calendario'
                    )}
                </p>
                <button
                    type="button"
                    disabled={chosen === null}
                    onClick={() => chosen && onApply(chosen, band)}
                    className="btn-brand h-12.5 w-full text-[17px] md:w-55"
                >
                    Applica
                </button>
            </ModalSheetFooter>
        </>
    );
}
