import { Head } from '@inertiajs/react';
import { useState } from 'react';
import SegmentedControl from '@/components/shared/segmented-control';
import CalendarSyncs from '@/components/trainer/area/calendar-syncs';
import DayAgenda from '@/components/trainer/area/day-agenda';
import MonthHeatmap from '@/components/trainer/area/month-heatmap';
import PageHeading from '@/components/trainer/area/page-heading';
import WeekGrid, { itemStyles } from '@/components/trainer/area/week-grid';
import type { CalendarItem } from '@/lib/calendar';
import { blockKey, romeParts, weekDates } from '@/lib/calendar';
import { formatDayRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarSync } from '@/types';

type CalendarProps = {
    /** Monday of the current week, "YYYY-MM-DD". */
    weekStart: string;
    events: CalendarEvent[];
    syncs: CalendarSync[];
    /** Confirmed sessions per day, for the month view. */
    sessionCounts: Record<string, number>;
};

type View = 'week' | 'month';

/** How many months after the current one the month view can show. */
const MONTHS_AHEAD = 2;

const legend: { kind: CalendarItem['kind']; label: string }[] = [
    { kind: 'confirmed', label: 'Confermata' },
    { kind: 'pending', label: 'Da confermare' },
    { kind: 'busy', label: 'Dal tuo calendario' },
    { kind: 'block', label: 'Bloccato' },
];

export default function Calendar({
    weekStart,
    events,
    syncs: initialSyncs,
    sessionCounts,
}: CalendarProps) {
    const days = weekDates(weekStart);
    const today = romeParts(new Date()).date;
    const currentMonth = today.slice(0, 7);

    const [view, setView] = useState<View>('week');
    // TODO: blocks and sync changes only live in the page for now.
    const [syncs, setSyncs] = useState(initialSyncs);
    const [blocks, setBlocks] = useState<Set<string>>(new Set());
    const [mobileDay, setMobileDay] = useState(
        days.includes(today) ? today : days[0],
    );
    const [monthOffset, setMonthOffset] = useState(0);
    const [monthDay, setMonthDay] = useState(today);

    const connected = new Set(
        syncs.filter((sync) => sync.connected).map((sync) => sync.id),
    );

    const items: CalendarItem[] = [
        ...events
            // Imported appointments disappear when their calendar is unlinked.
            .filter((event) => !event.source || connected.has(event.source))
            .map((event) => {
                const start = romeParts(event.start);

                return {
                    key: `event-${event.id}`,
                    date: start.date,
                    from: start.hour,
                    to: romeParts(event.end).hour,
                    title: event.title,
                    detail: event.detail,
                    place: event.place,
                    kind: event.kind,
                };
            }),
        ...[...blocks].map((key) => {
            const date = key.slice(0, 10);
            const hour = Number(key.slice(11));

            return {
                key: `block-${key}`,
                date,
                from: hour,
                to: hour + 1,
                title: 'Bloccato',
                detail: 'Non prenotabile',
                place: '',
                kind: 'block' as const,
            };
        }),
    ];

    const toggleBlock = (date: string, hour: number) => {
        const next = new Set(blocks);
        const key = blockKey(date, hour);

        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }

        setBlocks(next);
    };

    const month = shiftMonth(currentMonth, monthOffset);

    const changeMonth = (step: -1 | 1) => {
        const offset = monthOffset + step;
        setMonthOffset(offset);
        setMonthDay(`${shiftMonth(currentMonth, offset)}-01`);
    };

    const viewSwitch = (labels: Record<View, string>, className: string) => (
        <SegmentedControl
            aria-label="Vista"
            className={className}
            value={view}
            onChange={setView}
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
                        Tocca uno spazio libero per bloccarlo; toccalo di nuovo
                        per liberarlo.
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

            <CalendarSyncs
                syncs={syncs}
                className="max-md:order-last"
                onToggle={(id) =>
                    setSyncs(
                        syncs.map((sync) =>
                            sync.id === id
                                ? { ...sync, connected: !sync.connected }
                                : sync,
                        ),
                    )
                }
            />

            {view === 'week' ? (
                <>
                    <section
                        aria-label={`Settimana ${formatDayRange(days[0], days[6])}`}
                        className="hidden flex-col gap-3 rounded-xl border bg-card p-4 md:flex"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="font-semibold tabular-nums">
                                {formatDayRange(days[0], days[6])}{' '}
                                {days[6].slice(0, 4)}
                            </span>
                            <div className="flex flex-wrap gap-3.5 text-xs text-muted-foreground">
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
                        </div>
                        <WeekGrid
                            days={days}
                            items={items}
                            today={today}
                            blocks={blocks}
                            onToggleBlock={toggleBlock}
                        />
                    </section>

                    <div className="md:hidden">
                        <DayAgenda
                            days={days}
                            selected={mobileDay}
                            onSelect={setMobileDay}
                            items={items}
                        />
                    </div>
                </>
            ) : (
                <MonthHeatmap
                    month={month}
                    monthLabel={monthName(month)}
                    canGoBack={monthOffset > 0}
                    canGoForward={monthOffset < MONTHS_AHEAD}
                    onMonthChange={changeMonth}
                    counts={sessionCounts}
                    today={today}
                    selected={monthDay}
                    onSelect={setMonthDay}
                    onOpenWeek={() => setView('week')}
                />
            )}
        </>
    );
}

/** "2026-10" + 2 → "2026-12" */
function shiftMonth(month: string, offset: number): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));

    return date.toISOString().slice(0, 7);
}

/** "2026-10" → "ottobre 2026" */
function monthName(month: string): string {
    return new Intl.DateTimeFormat('it-IT', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${month}-15T12:00:00Z`));
}

Calendar.layout = { section: 'calendar' };
