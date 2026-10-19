import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import SegmentedControl from '@/components/shared/segmented-control';
import DayAgenda from '@/components/trainer/area/day-agenda';
import MonthCalendar from '@/components/trainer/area/month-calendar';
import PageHeading from '@/components/trainer/area/page-heading';
import WeekGrid, { itemStyles } from '@/components/trainer/area/week-grid';
import { Button } from '@/components/ui/button';
import type { CalendarItem } from '@/lib/calendar';
import {
    addDays,
    calendarItems,
    mondayOf,
    monthName,
    romeParts,
    shiftMonth,
    weekDates,
} from '@/lib/calendar';
import { formatDayRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import { calendar } from '@/routes/trainer';
import type { CalendarEvent } from '@/types';

type View = 'week' | 'month';

type CalendarProps = {
    view: View;
    /** The day shown, "YYYY-MM-DD": its week or its month. */
    focus: string;
    /** First and last day the arrows can reach: 12 months around today. */
    minDate: string;
    maxDate: string;
    /** The bookings of the week or month shown, confirmed or waiting. */
    events: CalendarEvent[];
};

const legend: { kind: CalendarItem['kind']; label: string }[] = [
    { kind: 'confirmed', label: 'Confermata' },
    { kind: 'pending', label: 'Da confermare' },
];

export default function Calendar({
    view,
    focus,
    minDate,
    maxDate,
    events,
}: CalendarProps) {
    const today = romeParts(new Date()).date;
    const items = calendarItems(events);

    // The day chosen in the list; back to the shown day after each move.
    const [selected, setSelected] = useState(focus);
    const [shownFocus, setShownFocus] = useState(focus);

    if (focus !== shownFocus) {
        setShownFocus(focus);
        setSelected(focus);
    }

    const days = weekDates(mondayOf(focus));
    const month = focus.slice(0, 7);

    const period =
        view === 'week'
            ? {
                  label: `${formatDayRange(days[0], days[6])} ${days[6].slice(0, 4)}`,
                  previous: addDays(days[0], -7),
                  next: addDays(days[0], 7),
                  canGoBack: days[0] > minDate,
                  canGoForward: days[6] < maxDate,
              }
            : {
                  label: monthName(month),
                  previous: `${shiftMonth(month, -1)}-01`,
                  next: `${shiftMonth(month, 1)}-01`,
                  canGoBack: `${month}-01` > minDate,
                  canGoForward: month < maxDate.slice(0, 7),
              };

    /** Loads only the bookings of the new period: the page stays as it is. */
    const show = (nextView: View, day: string) =>
        router.get(
            calendar.url({
                query: {
                    vista: nextView === 'month' ? 'mese' : 'settimana',
                    giorno: day,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['view', 'focus', 'minDate', 'maxDate', 'events'],
            },
        );

    const viewSwitch = (labels: Record<View, string>, className: string) => (
        <SegmentedControl
            aria-label="Vista"
            className={className}
            value={view}
            onChange={(value) => show(value, selected)}
            options={[
                { value: 'week', label: labels.week },
                { value: 'month', label: labels.month },
            ]}
        />
    );

    return (
        <>
            <Head title="Calendario" />

            <PageHeading
                title="Calendario"
                description={
                    <span className="hidden md:inline">
                        Le tue sedute confermate e quelle da confermare.
                    </span>
                }
                action={
                    <>
                        {viewSwitch(
                            { week: 'Giorno', month: 'Mese' },
                            'md:hidden',
                        )}
                        {viewSwitch(
                            { week: 'Settimana', month: 'Mese' },
                            'hidden md:flex',
                        )}
                    </>
                }
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={
                            view === 'week'
                                ? 'Settimana precedente'
                                : 'Mese precedente'
                        }
                        disabled={!period.canGoBack}
                        onClick={() => show(view, period.previous)}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={
                            view === 'week'
                                ? 'Settimana successiva'
                                : 'Mese successivo'
                        }
                        disabled={!period.canGoForward}
                        onClick={() => show(view, period.next)}
                    >
                        <ChevronRight />
                    </Button>
                    <span
                        aria-live="polite"
                        className={cn(
                            'font-semibold tabular-nums',
                            // "ottobre 2026" → "Ottobre 2026"; the week stays "12 – 18 ottobre".
                            view === 'month' && 'capitalize',
                        )}
                    >
                        {period.label}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3.5">
                    <div className="hidden flex-wrap gap-3.5 text-xs text-muted-foreground md:flex">
                        {legend.map((entry) => (
                            <span
                                key={entry.kind}
                                className="inline-flex items-center gap-1.5"
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'size-3 rounded-[3px]',
                                        itemStyles[entry.kind],
                                    )}
                                />
                                {entry.label}
                            </span>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => show(view, today)}
                    >
                        Oggi
                    </Button>
                </div>
            </div>

            {view === 'week' ? (
                <>
                    <section
                        aria-label={`Settimana ${period.label}`}
                        className="hidden rounded-[20px] border bg-card p-5 md:block"
                    >
                        <WeekGrid days={days} items={items} today={today} />
                    </section>

                    <div className="md:hidden">
                        <DayAgenda
                            days={days}
                            selected={
                                days.includes(selected) ? selected : days[0]
                            }
                            onSelect={setSelected}
                            items={items}
                        />
                    </div>
                </>
            ) : (
                <MonthCalendar
                    month={month}
                    items={items}
                    today={today}
                    selected={
                        selected.startsWith(month) ? selected : `${month}-01`
                    }
                    onSelect={setSelected}
                    onOpenWeek={() => show('week', selected)}
                />
            )}
        </>
    );
}

Calendar.layout = { section: 'calendar' };
