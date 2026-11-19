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
    /** "Aggiungi seduta" from a button: the popover opens under it on desktop. */
    onAdd: (button?: HTMLElement) => void;
    /** A click on a free hour of the grid: "Aggiungi seduta" at that time. */
    onPickSlot: (date: string, time: string, cell: HTMLElement) => void;
    /** Right click on a day of the month: "Aggiungi seduta" that day. */
    onAddOnDay: (date: string, cell: HTMLElement) => void;
    /** The new session being added from the grid, drawn dashed. */
    draft: { date: string; time: string } | null;
};

export const VIEWS: { value: CalendarView; label: string }[] = [
    { value: 'day', label: 'Giorno' },
    { value: 'week', label: 'Settimana' },
    { value: 'month', label: 'Mese' },
];
