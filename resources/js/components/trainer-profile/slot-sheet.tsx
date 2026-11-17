import { useState } from 'react';
import { Chip } from '@/components/mp/filter-chips';
import ModalSheet, {
    ModalSheetBody,
    ModalSheetFooter,
} from '@/components/mp/modal-sheet';
import MonthCalendar, {
    monthsBetween,
    romeToday,
    shiftMonth,
} from '@/components/mp/month-calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import type { TrainerBooking } from '@/hooks/use-trainer-booking';
import { freeStarts, weeklyLabel } from '@/lib/booking';
import { darkCheckboxClassName } from '@/lib/dark-form';
import {
    formatDayLong,
    formatDayShort,
    formatDuration,
    formatTimeRange,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AvailabilityDay } from '@/types';

/**
 * "Scegli data e ora" (designs "Giorno e ora 4" / "Desktop · Giorno e
 * ora"): the duration, the month with a turquoise dot on the days with free
 * times, the free times of the chosen day. "Conferma" sends the request.
 */
export default function SlotSheet({
    open,
    onOpenChange,
    booking,
    availability,
    waitlistDays,
    onBack,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking: TrainerBooking;
    /** The next 21 days of the trainer (Rome days). */
    availability: AvailabilityDay[];
    /** The full days where the client asked "Avvisami se si libera". */
    waitlistDays: string[];
    /** Back to "Servizi". */
    onBack: () => void;
}) {
    return (
        <ModalSheet
            open={open}
            onOpenChange={onOpenChange}
            title="Scegli data e ora"
            size="xl"
            onBack={onBack}
            backLabel="Torna ai servizi"
        >
            {open && (
                <SlotPicker
                    booking={booking}
                    availability={availability}
                    waitlistDays={waitlistDays}
                    onBack={onBack}
                />
            )}
        </ModalSheet>
    );
}

function SlotPicker({
    booking,
    availability,
    waitlistDays,
    onBack,
}: {
    booking: TrainerBooking;
    availability: AvailabilityDay[];
    waitlistDays: string[];
    onBack: () => void;
}) {
    const { minutes, date, start } = booking;
    const today = romeToday();
    const days = new Map(availability.map((day) => [day.date, day]));
    const first = availability[0]?.date ?? today;
    const last = availability[availability.length - 1]?.date ?? today;

    // The months from today to the last day the trainer can be booked.
    const [todayYear, todayMonth] = today.split('-').map(Number);
    const maxOffset = Math.max(0, monthsBetween(today, last));
    const [offset, setOffset] = useState(() =>
        Math.min(maxOffset, Math.max(0, monthsBetween(today, date ?? first))),
    );
    const { year, month } = shiftMonth(todayYear, todayMonth, offset);

    const chosenDay = date ? days.get(date) : undefined;
    const starts = chosenDay ? freeStarts(chosenDay, minutes) : [];
    // A day open but with nothing long enough: "pieno", with "Avvisami".
    const full =
        chosenDay !== undefined && !chosenDay.closed && starts.length === 0;
    const waiting = date !== null && waitlistDays.includes(date);
    const hours = minutes / 60;

    return (
        <>
            <ModalSheetBody className="flex flex-col gap-5.5 md:grid md:grid-cols-[364px_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:items-start md:gap-x-10 md:gap-y-5.5">
                {/* Phones: the duration first; desktop: on the right, over the times. */}
                {booking.durations.length > 1 && (
                    <fieldset className="min-w-0 md:col-start-2 md:row-start-1 md:pt-1.5">
                        <legend className="mb-2.5 text-[15px] font-semibold">
                            Durata
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {booking.durations.map((option) => (
                                <Chip
                                    key={option}
                                    pressed={option === minutes}
                                    onClick={() =>
                                        booking.changeMinutes(option)
                                    }
                                >
                                    {formatDuration(option)}
                                </Chip>
                            ))}
                        </div>
                    </fieldset>
                )}

                <div className="flex flex-col gap-2 md:col-start-1 md:row-span-2 md:row-start-1">
                    <MonthCalendar
                        year={year}
                        month={month}
                        today={today}
                        selected={date}
                        onSelect={booking.changeDate}
                        day={(day) => {
                            const info = days.get(day);

                            if (!info || info.closed) {
                                return {
                                    disabled: true,
                                    past: day < today,
                                    note: info ? ', chiuso' : undefined,
                                };
                            }

                            const free = freeStarts(info, minutes).length > 0;

                            return free
                                ? {
                                      disabled: false,
                                      dot: true,
                                      note: ', orari liberi',
                                  }
                                : {
                                      disabled: false,
                                      dim: true,
                                      note: ', pieno',
                                  };
                        }}
                        previous={{
                            disabled: offset === 0,
                            onClick: () => setOffset(offset - 1),
                        }}
                        next={{
                            disabled: offset >= maxOffset,
                            onClick: () => setOffset(offset + 1),
                        }}
                    />
                    <div
                        aria-hidden="true"
                        className="hidden gap-5 px-1 pt-2 text-[13px] text-muted-foreground md:flex"
                    >
                        <span className="flex items-center gap-2">
                            <span className="size-1.25 rounded-full bg-brand" />
                            Orari liberi
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="size-4 rounded-[5px] shadow-[inset_0_0_0_1px_var(--field)]" />
                            Oggi
                        </span>
                    </div>
                </div>

                <fieldset className="min-w-0 md:col-start-2 md:row-start-2">
                    <legend className="mb-2.5 text-[15px] font-semibold">
                        {date
                            ? `Orari liberi · ${formatDayLong(date)}`
                            : 'Orari liberi'}
                    </legend>
                    {starts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {starts.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    aria-pressed={item === start}
                                    onClick={() =>
                                        booking.setStart(
                                            item === start ? null : item,
                                        )
                                    }
                                    className="chip justify-center px-2 tabular-nums"
                                >
                                    {formatTimeRange(item, hours)}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-start gap-3">
                            <p className="text-[15px] text-muted-foreground">
                                {full
                                    ? 'Giorno pieno. Scegli un giorno con il puntino turchese.'
                                    : 'Scegli un giorno con il puntino turchese.'}
                            </p>
                            {full && date && (
                                <Chip
                                    pressed={waiting}
                                    onClick={() =>
                                        booking.toggleWaitlist(date, waiting)
                                    }
                                >
                                    {waiting
                                        ? 'Ti avvisiamo se si libera'
                                        : 'Avvisami se si libera'}
                                </Chip>
                            )}
                        </div>
                    )}

                    {booking.canRepeat && start && (
                        <label className="mt-4 flex cursor-pointer items-start gap-3">
                            <Checkbox
                                checked={booking.wantsRepeat}
                                onCheckedChange={(value) =>
                                    booking.setRepeat(value === true)
                                }
                                className={cn(darkCheckboxClassName, 'mt-0.5')}
                            />
                            <span className="flex flex-col">
                                <span className="text-[15px] font-semibold">
                                    Ripeti ogni settimana
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {weeklyLabel(start)}
                                </span>
                            </span>
                        </label>
                    )}
                </fieldset>
            </ModalSheetBody>

            <ModalSheetFooter>
                <button
                    type="button"
                    onClick={onBack}
                    className="hidden min-h-11 px-2 text-[15px] font-semibold underline underline-offset-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:block"
                >
                    Torna ai servizi
                </button>
                <button
                    type="button"
                    disabled={!start || booking.booking}
                    onClick={booking.bookSlot}
                    className="btn-brand h-12.5 w-full text-[17px] md:w-auto md:min-w-85 md:px-6"
                >
                    {booking.booking && <Spinner />}
                    {start
                        ? `Conferma · ${formatDayShort(start)}, ${formatTimeRange(start, hours)}`
                        : 'Scegli un orario'}
                </button>
            </ModalSheetFooter>
        </>
    );
}
