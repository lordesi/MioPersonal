import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AddSessionDialog from '@/components/trainer/area/add-session-dialog';
import type { PopoverAnchor } from '@/components/trainer/area/add-session-dialog';
import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import CalendarDesktop from '@/components/trainer/calendar/calendar-desktop';
import CalendarMobile from '@/components/trainer/calendar/calendar-mobile';
import ReschedulePanel from '@/components/trainer/calendar/reschedule-panel';
import type { SessionRowContext } from '@/components/trainer/calendar/session-row';
import {
    nextSessionId,
    sessionKind,
} from '@/components/trainer/calendar/session-status';
import { useIsMobile } from '@/hooks/use-mobile';
import { calendarItems, romeParts } from '@/lib/calendar';
import type { CalendarItem } from '@/lib/calendar';
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
 * "Calendario" (design "Trainer · Calendario · nuovo"): the day hour by
 * hour (the default), the week or the month. Desktop and phones have two
 * different drawings on the same data (calendar-desktop.tsx,
 * calendar-mobile.tsx). "+" and a free hour open "Nuova seduta"; a session
 * opens its details, with "Sposta" and "Annulla".
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
    const [now, setNow] = useState(() => new Date());
    const today = romeParts(now).date;

    // "Tra 1 h 30" and "Fatta" follow the clock.
    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 60_000);

        return () => window.clearInterval(timer);
    }, []);

    // The sessions cancelled in this visit stay in the list as "Annullata".
    const [cancelled, setCancelled] = useState<CalendarItem[]>([]);
    const items = useMemo(() => {
        const gone = new Set(cancelled.map((item) => item.id));

        return [
            ...calendarItems(events).filter((item) => !gone.has(item.id)),
            ...cancelled,
        ];
    }, [events, cancelled]);

    // The day chosen and the session open: back to the shown day after each move.
    const [selectedDay, setSelectedDay] = useState(focus);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [shownFocus, setShownFocus] = useState(focus);
    // "Nuova seduta": the day, the hour clicked, where it opens.
    const [adding, setAdding] = useState<{
        date: string;
        time?: string;
        anchor: PopoverAnchor | null;
        fromSlot: boolean;
    } | null>(null);
    // "Sposta": the session and the button it opens from.
    const [moving, setMoving] = useState<{
        item: CalendarItem;
        anchor: PopoverAnchor;
    } | null>(null);

    if (focus !== shownFocus) {
        setShownFocus(focus);
        setSelectedDay(focus);
    }

    /** Loads only the bookings of the new period: the page stays as it is. */
    const show = (nextView: CalendarView, day: string) => {
        setSelectedDay(day);

        if (nextView !== view) {
            setSelectedId(null);
        }

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

    const nextId = nextSessionId(
        items.filter((item) => !cancelled.includes(item)),
        today,
        now,
    );
    const context: SessionRowContext = {
        now,
        desktop: !isMobile,
        kindOf: (item) =>
            sessionKind(item, now, nextId, cancelled.includes(item)),
        onMove: (item, button) =>
            setMoving({
                item,
                anchor: {
                    rect: button.getBoundingClientRect(),
                    placement: 'side',
                },
            }),
        onCancelled: (item) =>
            setCancelled((list) => [
                ...list.filter((other) => other.id !== item.id),
                item,
            ]),
    };

    const viewProps = {
        view,
        focus,
        today,
        minDate,
        maxDate,
        items,
        monthCounts: Array.isArray(monthCounts) ? {} : monthCounts,
        canAdd: sessionOptions !== null,
        selectedDay,
        selectedId,
        onSelect: setSelectedId,
        show,
        onAdd: (button: HTMLElement) =>
            setAdding({
                date: selectedDay,
                anchor: {
                    rect: button.getBoundingClientRect(),
                    placement: 'below',
                },
                fromSlot: false,
            }),
        onPickSlot: (date: string, time: string, cell: HTMLElement) =>
            setAdding({
                date,
                time,
                anchor: {
                    rect: cell.getBoundingClientRect(),
                    placement: 'side',
                },
                fromSlot: true,
            }),
        onAddOnDay: (date: string, button: HTMLElement) =>
            setAdding({
                date,
                anchor: {
                    rect: button.getBoundingClientRect(),
                    placement: 'side',
                },
                fromSlot: false,
            }),
        draft: adding?.time ? { date: adding.date, time: adding.time } : null,
        context,
    };

    return (
        <>
            <Head title="Calendario" />

            {sessionOptions && (
                <AddSessionDialog
                    open={adding !== null}
                    onOpenChange={(next) => !next && setAdding(null)}
                    options={sessionOptions}
                    date={adding?.date ?? selectedDay}
                    time={adding?.time}
                    anchor={adding?.anchor}
                    fromSlot={adding?.fromSlot ?? false}
                    today={today}
                />
            )}

            {moving && (
                <ReschedulePanel
                    key={moving.item.id}
                    item={moving.item}
                    anchor={isMobile ? null : moving.anchor}
                    onClose={() => setMoving(null)}
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

Calendar.layout = { section: 'calendar' };
