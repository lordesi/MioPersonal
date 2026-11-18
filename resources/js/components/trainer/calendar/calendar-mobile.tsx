import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import {
    OpenHoursCard,
    SessionDetails,
    WeekSummary,
} from '@/components/trainer/area/calendar-side';
import MonthCalendar from '@/components/trainer/area/month-calendar';
import WeekGrid from '@/components/trainer/area/week-grid';
import DayAgenda from '@/components/trainer/calendar/day-agenda';
import type { CalendarViewProps } from '@/components/trainer/calendar/types';
import ViewSwitch from '@/components/trainer/calendar/view-switch';
import WeekStrip, { monthLabel } from '@/components/trainer/home/week-strip';
import {
    brandButtonClassName,
    pageTitleClassName,
    roundSoftClassName,
} from '@/components/trainer/ui/styles';
import {
    addDays,
    mondayOf,
    monthName,
    shiftMonth,
    weekDates,
} from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';
import { availability } from '@/routes/trainer';

/**
 * "Calendario" on phones (Righe 1): the week strip, then the day as rows of
 * one hour with the sessions that open in place. "Settimana" and "Mese"
 * show the grid and the month, with the details of the chosen session.
 */
export default function CalendarMobile(props: CalendarViewProps) {
    const {
        view,
        focus,
        today,
        minDate,
        maxDate,
        items,
        sessionOptions,
        now,
        selectedDay,
        selectedId,
        onSelect,
        show,
        onAdd,
    } = props;
    const week = weekDates(mondayOf(selectedDay));
    const month = focus.slice(0, 7);
    const dayItems = items
        .filter((item) => item.date === selectedDay)
        .sort((a, b) => a.from - b.from);
    const selected = items.find((item) => item.id === selectedId) ?? null;
    const weekDays = week.map((date) => ({
        date,
        count: items.filter((item) => item.date === date).length,
    }));

    return (
        <>
            <header className="flex min-h-13 items-center gap-2">
                <h1 className={cn(pageTitleClassName, 'mr-auto')}>
                    Calendario
                </h1>
                <Link
                    href={availability()}
                    aria-label="Gestisci disponibilità"
                    className={cn(roundSoftClassName, 'size-11')}
                >
                    <Clock aria-hidden="true" className="size-5" />
                </Link>
                {sessionOptions && (
                    <button
                        type="button"
                        onClick={onAdd}
                        aria-label="Aggiungi seduta"
                        className={cn(brandButtonClassName, 'size-11 px-0')}
                    >
                        <Plus
                            aria-hidden="true"
                            className="size-5"
                            strokeWidth={2.5}
                        />
                    </button>
                )}
            </header>

            <ViewSwitch
                view={view}
                onChange={(next) => show(next, selectedDay)}
            />

            {view === 'month' ? (
                <section
                    aria-label={monthName(month)}
                    className="flex flex-col gap-3"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-[17px] font-semibold first-letter:uppercase">
                            {monthName(month)}
                        </h2>
                        <div className="flex">
                            <button
                                type="button"
                                disabled={`${month}-01` <= minDate}
                                onClick={() =>
                                    show('month', `${shiftMonth(month, -1)}-01`)
                                }
                                aria-label="Mese precedente"
                                className={cn(
                                    roundSoftClassName,
                                    'size-11 bg-transparent',
                                )}
                            >
                                <ChevronLeft
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </button>
                            <button
                                type="button"
                                disabled={month >= maxDate.slice(0, 7)}
                                onClick={() =>
                                    show('month', `${shiftMonth(month, 1)}-01`)
                                }
                                aria-label="Mese successivo"
                                className={cn(
                                    roundSoftClassName,
                                    'size-11 bg-transparent',
                                )}
                            >
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-[26px] bg-[#121212] shadow-[inset_0_0_0_1px_#2c2c2c]">
                        <MonthCalendar
                            month={month}
                            items={items}
                            today={today}
                            selectedDay={selectedDay}
                            onOpenDay={(date) => show('day', date)}
                        />
                    </div>
                </section>
            ) : (
                <WeekStrip
                    week={weekDays}
                    day={selectedDay}
                    today={today}
                    minDate={minDate}
                    maxDate={maxDate}
                    onPick={(date) => show(view, date)}
                />
            )}

            {view === 'day' && (
                <section
                    aria-label={formatDayLong(selectedDay)}
                    className="flex flex-col gap-2"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-[22px] leading-7 font-bold">
                            {selectedDay === today
                                ? 'Oggi'
                                : formatDayLong(selectedDay)}
                        </h2>
                        <div className="flex">
                            <button
                                type="button"
                                disabled={selectedDay <= minDate}
                                onClick={() =>
                                    show('day', addDays(selectedDay, -1))
                                }
                                aria-label="Giorno precedente"
                                className={cn(
                                    roundSoftClassName,
                                    'size-11 bg-transparent',
                                )}
                            >
                                <ChevronLeft
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </button>
                            <button
                                type="button"
                                disabled={selectedDay >= maxDate}
                                onClick={() =>
                                    show('day', addDays(selectedDay, 1))
                                }
                                aria-label="Giorno successivo"
                                className={cn(
                                    roundSoftClassName,
                                    'size-11 bg-transparent',
                                )}
                            >
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </button>
                        </div>
                    </div>
                    <DayAgenda
                        date={selectedDay}
                        items={dayItems}
                        today={today}
                        now={now}
                        openId={selectedId}
                        onToggle={(id) =>
                            onSelect(selectedId === id ? null : id)
                        }
                        emptyHint="Nessuna seduta in programma. Tocca + per aggiungerne una."
                    />
                </section>
            )}

            {view === 'week' && (
                <section
                    aria-label={`Settimana di ${monthLabel(week[3])}`}
                    className="-mx-4 overflow-x-auto px-4"
                >
                    <div className="overflow-hidden rounded-[26px] bg-[#121212] shadow-[inset_0_0_0_1px_#2c2c2c]">
                        <WeekGrid
                            days={week}
                            items={items}
                            today={today}
                            selectedDay={selectedDay}
                            selectedId={selectedId}
                            onSelect={(item) => onSelect(item.id)}
                        />
                    </div>
                </section>
            )}

            {selected && view !== 'day' && (
                <SessionDetails
                    item={selected}
                    today={today}
                    onClose={() => onSelect(null)}
                />
            )}

            {view !== 'month' && (
                <WeekSummary
                    days={week}
                    items={items}
                    selectedDay={selectedDay}
                />
            )}
            <OpenHoursCard />
        </>
    );
}
