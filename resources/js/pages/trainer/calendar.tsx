import { Head, Link, router } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import CalendarNav from '@/components/trainer/area/calendar-nav';
import {
    DayPanel,
    OpenHoursCard,
    SessionDetails,
    WeekSummary,
} from '@/components/trainer/area/calendar-side';
import DayView from '@/components/trainer/area/day-view';
import MonthCalendar from '@/components/trainer/area/month-calendar';
import PageHeading from '@/components/trainer/area/page-heading';
import WeekGrid from '@/components/trainer/area/week-grid';
import type { CalendarItem } from '@/lib/calendar';
import {
    addDays,
    calendarItems,
    mondayOf,
    monthName,
    romeParts,
    sessionsLabel,
    shiftMonth,
    weekDates,
} from '@/lib/calendar';
import { formatDayLong, formatDayRange } from '@/lib/format';
import { availability, calendar } from '@/routes/trainer';
import type { CalendarEvent } from '@/types';

type CalendarProps = {
    view: CalendarView;
    /** The day shown, "YYYY-MM-DD": the day, its week or its month. */
    focus: string;
    /** First and last day the arrows can reach: 12 months around today. */
    minDate: string;
    maxDate: string;
    /** The bookings of the week (day and week) or of the weeks of the month, confirmed or waiting. */
    events: CalendarEvent[];
    /** The sessions of today, for the line above the title. */
    todayCount: number;
};

/** The words of ?vista= in the URL. */
const viewParams: Record<CalendarView, string> = {
    day: 'giorno',
    week: 'settimana',
    month: 'mese',
};

export default function Calendar({
    view,
    focus,
    minDate,
    maxDate,
    events,
    todayCount,
}: CalendarProps) {
    const today = romeParts(new Date()).date;
    const items = calendarItems(events);

    // The day chosen in the strip or in the month, and the session whose
    // details are open: back to the shown day after each move.
    const [selectedDay, setSelectedDay] = useState(focus);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [shownFocus, setShownFocus] = useState(focus);

    if (focus !== shownFocus) {
        setShownFocus(focus);
        setSelectedDay(focus);
        setSelectedId(null);
    }

    const week = weekDates(mondayOf(selectedDay));
    const month = focus.slice(0, 7);
    const dayItems = (date: string) =>
        items
            .filter((item) => item.date === date)
            .sort((a, b) => a.from - b.from);
    const selected = items.find((item) => item.id === selectedId) ?? null;

    const period = {
        day: {
            label: `${formatDayLong(selectedDay)} ${selectedDay.slice(0, 4)}`,
            previous: addDays(selectedDay, -1),
            next: addDays(selectedDay, 1),
            canGoBack: selectedDay > minDate,
            canGoForward: selectedDay < maxDate,
        },
        week: {
            label: `${formatDayRange(week[0], week[6])} ${week[6].slice(0, 4)}`,
            previous: addDays(week[0], -7),
            next: addDays(week[0], 7),
            canGoBack: week[0] > minDate,
            canGoForward: week[6] < maxDate,
        },
        month: {
            // "ottobre 2026" → "Ottobre 2026"
            label: monthName(month).replace(/^./u, (letter) =>
                letter.toUpperCase(),
            ),
            previous: `${shiftMonth(month, -1)}-01`,
            next: `${shiftMonth(month, 1)}-01`,
            canGoBack: `${month}-01` > minDate,
            canGoForward: month < maxDate.slice(0, 7),
        },
    }[view];

    /** Loads only the bookings of the new period: the page stays as it is. */
    const show = (nextView: CalendarView, day: string) =>
        router.get(
            calendar.url({
                query: { vista: viewParams[nextView], giorno: day },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: [
                    'view',
                    'focus',
                    'minDate',
                    'maxDate',
                    'events',
                    'todayCount',
                ],
            },
        );

    const chooseDay = (date: string) => {
        setSelectedDay(date);
        setSelectedId(null);
    };

    const openSession = (item: CalendarItem) => {
        setSelectedDay(item.date);
        setSelectedId(item.id);
    };

    return (
        <>
            <Head title="Calendario" />

            <PageHeading
                title="Calendario"
                eyebrow={`Oggi, ${formatDayLong(today).toLowerCase()} · ${sessionsLabel(todayCount).toLowerCase()}`}
                action={
                    <Link
                        href={availability()}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-4.5 text-sm font-semibold text-background hover:bg-foreground/90"
                    >
                        <Clock aria-hidden="true" className="size-4" />
                        Gestisci disponibilità
                    </Link>
                }
            />

            <CalendarNav
                view={view}
                onViewChange={(next) => show(next, selectedDay)}
                label={period.label}
                canGoBack={period.canGoBack}
                canGoForward={period.canGoForward}
                onPrevious={() => show(view, period.previous)}
                onNext={() => show(view, period.next)}
                onToday={() => show(view, today)}
                days={view === 'month' ? [] : week}
                items={items}
                today={today}
                selectedDay={selectedDay}
                onSelectDay={chooseDay}
            />

            <div className="flex flex-wrap items-start gap-5">
                <section
                    aria-label={period.label}
                    className="min-w-0 flex-[3_1_600px] overflow-hidden rounded-3xl border bg-card"
                >
                    {view === 'week' && (
                        <WeekGrid
                            days={week}
                            items={items}
                            today={today}
                            selectedDay={selectedDay}
                            selectedId={selectedId}
                            onSelect={openSession}
                        />
                    )}
                    {view === 'day' && (
                        <DayView
                            date={selectedDay}
                            items={dayItems(selectedDay)}
                            today={today}
                            selectedId={selectedId}
                            onSelect={openSession}
                        />
                    )}
                    {view === 'month' && (
                        <MonthCalendar
                            month={month}
                            items={items}
                            today={today}
                            selectedDay={selectedDay}
                            onOpenDay={(date) => show('day', date)}
                        />
                    )}
                </section>

                <aside
                    aria-label="Dettagli"
                    className="flex min-w-0 flex-[1_1_290px] flex-col gap-4"
                >
                    {selected ? (
                        <SessionDetails
                            item={selected}
                            today={today}
                            onClose={() => setSelectedId(null)}
                        />
                    ) : (
                        <WeekSummary
                            days={week}
                            items={items}
                            selectedDay={selectedDay}
                        />
                    )}
                    <DayPanel
                        date={selectedDay}
                        items={dayItems(selectedDay)}
                        today={today}
                        onSelect={openSession}
                    />
                    <OpenHoursCard />
                </aside>
            </div>
        </>
    );
}

Calendar.layout = { section: 'calendar' };
