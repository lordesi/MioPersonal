import { useState } from 'react';
import ModalSheet, {
    ModalSheetBody,
    ModalSheetFooter,
} from '@/components/mp/modal-sheet';
import MonthCalendar, { monthsBetween } from '@/components/mp/month-calendar';
import { brandFilledButtonClassName } from '@/components/trainer/ui/styles';
import { addDays, shiftYearMonth } from '@/lib/calendar';
import { formatDayMonthShort } from '@/lib/format';
import { cn } from '@/lib/utils';

/** As TrainerDashboardController::MAX_RANGE_DAYS. */
const MAX_RANGE_DAYS = 366;

/** How far back the months go: two years of statistics. */
const MONTHS_BACK = 24;

type RangeSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Rome date of today: no day after it. */
    today: string;
    from: string;
    to: string;
    onApply: (from: string, to: string) => void;
};

/**
 * "Intervallo personalizzato" of "Statistiche", with the calendar of "Scegli
 * data": a sheet with one month and the arrows on phones, a window with two
 * months side by side on desktop. The first tap is "Dal", the second "Al".
 */
export default function RangeSheet({
    open,
    onOpenChange,
    today,
    from,
    to,
    onApply,
}: RangeSheetProps) {
    return (
        <ModalSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Scegli intervallo"
            size="lg"
        >
            {/* Mounted only while open: it starts again from the saved range. */}
            {open && (
                <RangePicker
                    today={today}
                    initialFrom={from}
                    initialTo={to}
                    onApply={(start, end) => {
                        onApply(start, end);
                        onOpenChange(false);
                    }}
                />
            )}
        </ModalSheet>
    );
}

function RangePicker({
    today,
    initialFrom,
    initialTo,
    onApply,
}: {
    today: string;
    initialFrom: string;
    initialTo: string;
    onApply: (from: string, to: string) => void;
}) {
    const [range, setRange] = useState<{ from: string; to: string | null }>({
        from: initialFrom,
        to: initialTo,
    });
    const [todayYear, todayMonth] = today.split('-').map(Number);
    // Months back from this one: 0 = this month. Starts on the month of "Al".
    const [offset, setOffset] = useState(() =>
        Math.min(MONTHS_BACK, Math.max(0, monthsBetween(initialTo, today))),
    );

    const choose = (day: string) => {
        // A new range, or the end of the one just started (before "Dal": they swap).
        if (range.to !== null) {
            setRange({ from: day, to: null });
        } else if (day < range.from) {
            setRange({ from: day, to: range.from });
        } else {
            setRange({ from: range.from, to: day });
        }
    };

    /** While choosing "Al": not further than MAX_RANGE_DAYS from "Dal". */
    const outOfReach = (day: string) =>
        range.to === null &&
        (day > addDays(range.from, MAX_RANGE_DAYS - 1) ||
            day < addDays(range.from, -(MAX_RANGE_DAYS - 1)));

    /** The month `back` months before this one. */
    const calendar = (
        back: number,
        arrows: {
            previous?: { disabled: boolean; onClick: () => void };
            next?: { disabled: boolean; onClick: () => void };
        },
        className?: string,
    ) => {
        const { year, month } = shiftYearMonth(todayYear, todayMonth, -back);

        return (
            <MonthCalendar
                year={year}
                month={month}
                today={today}
                selected={null}
                range={range}
                onSelect={choose}
                day={(day) => ({
                    disabled: day > today || outOfReach(day),
                })}
                className={className}
                {...arrows}
            />
        );
    };

    // Desktop: the month before on the left, this one on the right.
    const desktopOffset = Math.max(0, Math.min(offset, MONTHS_BACK - 1));
    const days = range.to === null ? 0 : daysBetween(range.from, range.to);

    return (
        <>
            <ModalSheetBody className="flex flex-col gap-5">
                {calendar(
                    offset,
                    {
                        previous: {
                            disabled: offset >= MONTHS_BACK,
                            onClick: () => setOffset(offset + 1),
                        },
                        next: {
                            disabled: offset === 0,
                            onClick: () => setOffset(offset - 1),
                        },
                    },
                    'md:hidden',
                )}
                <div className="hidden grid-cols-2 gap-10 md:grid">
                    {calendar(desktopOffset + 1, {
                        previous: {
                            disabled: desktopOffset >= MONTHS_BACK - 1,
                            onClick: () => setOffset(desktopOffset + 1),
                        },
                    })}
                    {calendar(desktopOffset, {
                        next: {
                            disabled: desktopOffset === 0,
                            onClick: () => setOffset(desktopOffset - 1),
                        },
                    })}
                </div>
            </ModalSheetBody>

            <ModalSheetFooter>
                <p
                    className="text-center text-[15px] text-muted-foreground md:text-left"
                    aria-live="polite"
                >
                    {range.to === null ? (
                        <>
                            Dal{' '}
                            <strong className="font-semibold text-foreground">
                                {formatDayMonthShort(range.from)}
                            </strong>
                            : ora scegli l’ultimo giorno
                        </>
                    ) : (
                        <>
                            <strong className="font-semibold text-foreground">
                                {formatDayMonthShort(range.from)} –{' '}
                                {formatDayMonthShort(range.to)}
                            </strong>{' '}
                            · {days} {days === 1 ? 'giorno' : 'giorni'}
                        </>
                    )}
                </p>
                <button
                    type="button"
                    disabled={range.to === null}
                    onClick={() => range.to && onApply(range.from, range.to)}
                    className={cn(
                        brandFilledButtonClassName,
                        'h-12.5 w-full text-[17px] md:w-55',
                    )}
                >
                    Applica
                </button>
            </ModalSheetFooter>
        </>
    );
}

/** The days from `from` to `to`, both included ("YYYY-MM-DD"). */
function daysBetween(from: string, to: string): number {
    const day = 24 * 60 * 60 * 1000;

    return Math.round((Date.parse(to) - Date.parse(from)) / day) + 1;
}
