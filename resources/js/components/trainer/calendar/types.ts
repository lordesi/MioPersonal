import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import type { CalendarItem } from '@/lib/calendar';
import type { SessionOptions } from '@/types';

/** What the desktop and the phone calendars get from the page. */
export type CalendarViewProps = {
    view: CalendarView;
    focus: string;
    today: string;
    minDate: string;
    maxDate: string;
    items: CalendarItem[];
    monthCounts: Record<string, number>;
    sessionOptions: SessionOptions | null;
    now: Date;
    /** The day chosen (in the strip, the month, the arrows). */
    selectedDay: string;
    /** The session open (day view) or shown in the details (week and month). */
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    /** Loads another day or view: `?vista=` and `?giorno=`. */
    show: (view: CalendarView, day: string) => void;
    onAdd: () => void;
};

export const VIEWS: { value: CalendarView; label: string }[] = [
    { value: 'day', label: 'Giorno' },
    { value: 'week', label: 'Settimana' },
    { value: 'month', label: 'Mese' },
];
