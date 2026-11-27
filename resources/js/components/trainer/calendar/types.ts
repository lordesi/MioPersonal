import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import type { SessionRowContext } from '@/components/trainer/calendar/session-row';
import type { CalendarItem } from '@/lib/calendar';

/** What the desktop and the phone calendars get from the page. */
export type CalendarViewProps = {
    view: CalendarView;
    focus: string;
    today: string;
    minDate: string;
    maxDate: string;
    /** The sessions loaded, with the ones cancelled in this visit ("Annullata"). */
    items: CalendarItem[];
    monthCounts: Record<string, number>;
    /** False until the trainer has a profile: no "Aggiungi seduta". */
    canAdd: boolean;
    /** The day chosen (in the strip, the month, the arrows). */
    selectedDay: string;
    /** The session open. */
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    /** Loads another day or view: `?vista=` and `?giorno=`. */
    show: (view: CalendarView, day: string) => void;
    /** "+": the popover opens under it on desktop, the sheet on phones. */
    onAdd: (button: HTMLElement) => void;
    /** A free hour of the day or of the week: "Nuova seduta" at that time. */
    onPickSlot: (date: string, time: string, cell: HTMLElement) => void;
    /** The "+" of an empty day of the week (phones): "Nuova seduta" that day. */
    onAddOnDay: (date: string, button: HTMLElement) => void;
    /** The new session being added from the grid, drawn as "Nuova seduta". */
    draft: { date: string; time: string } | null;
    /** The time now, the kind of each session and its actions. */
    context: SessionRowContext;
};

export const VIEWS: { value: CalendarView; label: string }[] = [
    { value: 'day', label: 'Giorno' },
    { value: 'week', label: 'Settimana' },
    { value: 'month', label: 'Mese' },
];
