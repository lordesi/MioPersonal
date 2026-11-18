import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AddSessionDialog from '@/components/trainer/area/add-session-dialog';
import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import CalendarDesktop from '@/components/trainer/calendar/calendar-desktop';
import CalendarMobile from '@/components/trainer/calendar/calendar-mobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { calendarItems, romeParts } from '@/lib/calendar';
import { calendar } from '@/routes/trainer';
import type { CalendarEvent, SessionOptions } from '@/types';

type CalendarProps = {
    view: CalendarView;
    /** The day shown, "YYYY-MM-DD": the day, its week or its month. */
    focus: string;
    /** First and last day the arrows can reach: 12 months around today. */
    minDate: string;
    maxDate: string;
    /** The bookings of the week (day and week) or of the weeks of the month, confirmed or waiting. */
    events: CalendarEvent[];
    /** Sessions per day of the month of `focus`: the dots of the small month. */
    monthCounts: Record<string, number>;
    /** "Aggiungi seduta": null until the trainer has a profile. */
    sessionOptions: SessionOptions | null;
};

/** The words of ?vista= in the URL. */
const viewParams: Record<CalendarView, string> = {
    day: 'giorno',
    week: 'settimana',
    month: 'mese',
};

/**
 * "Calendario": the day hour by hour (the default), the week or the month.
 * Desktop and phones have two different drawings on the same data
 * (calendar-desktop.tsx, calendar-mobile.tsx).
 */
export default function Calendar({
    view,
    focus,
    minDate,
    maxDate,
    events,
    monthCounts,
    sessionOptions,
}: CalendarProps) {
    const isMobile = useIsMobile();
    const [now] = useState(() => new Date());
    const today = romeParts(now).date;
    const items = calendarItems(events);

    // The day chosen and the session open: back to the shown day after each move.
    const [selectedDay, setSelectedDay] = useState(focus);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [shownFocus, setShownFocus] = useState(focus);
    // "Aggiungi seduta".
    const [adding, setAdding] = useState(false);

    if (focus !== shownFocus) {
        setShownFocus(focus);
        setSelectedDay(focus);
    }

    /** Loads only the bookings of the new period: the page stays as it is. */
    const show = (nextView: CalendarView, day: string) => {
        setSelectedDay(day);

        router.get(
            calendar.url({
                query: { vista: viewParams[nextView], giorno: day },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: [
                    'view',
                    'focus',
                    'minDate',
                    'maxDate',
                    'events',
                    'monthCounts',
                ],
            },
        );
    };

    const viewProps = {
        view,
        focus,
        today,
        minDate,
        maxDate,
        items,
        monthCounts: Array.isArray(monthCounts) ? {} : monthCounts,
        sessionOptions,
        now,
        selectedDay,
        selectedId,
        onSelect: setSelectedId,
        show,
        onAdd: () => setAdding(true),
    };

    return (
        <>
            <Head title="Calendario" />

            {sessionOptions && (
                <AddSessionDialog
                    open={adding}
                    onOpenChange={setAdding}
                    options={sessionOptions}
                    date={selectedDay}
                    today={today}
                />
            )}

            {isMobile ? (
                <CalendarMobile {...viewProps} />
            ) : (
                <CalendarDesktop {...viewProps} />
            )}
        </>
    );
}

Calendar.layout = { section: 'calendar', fill: true };
