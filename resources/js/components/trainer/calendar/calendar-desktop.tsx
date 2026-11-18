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
import MiniMonth from '@/components/trainer/calendar/mini-month';
import type { CalendarViewProps } from '@/components/trainer/calendar/types';
import ViewSwitch from '@/components/trainer/calendar/view-switch';
import {
    brandButtonClassName,
    listLabelClassName,
    pageTitleClassName,
    panelClassName,
    pressableRowClassName,
    roundSoftClassName,
    softButtonClassName,
} from '@/components/trainer/ui/styles';
import {
    addDays,
    hourLabel,
    mondayOf,
    monthName,
    sessionsLabel,
    shiftMonth,
    weekDates,
} from '@/lib/calendar';
import { formatDayLong, formatDayRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import { availability } from '@/routes/trainer';

/**
 * "Calendario" on desktop (Calendario A): on the left the small month and
 * the sessions of the chosen day; on the right the day hour by hour (or the
 * week, or the month), with "Aggiungi seduta".
 */
export default function CalendarDesktop(props: CalendarViewProps) {
    const {
        view,
        focus,
        today,
        minDate,
        maxDate,
        items,
        monthCounts,
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

    const period = {
        day: {
            kicker:
                selectedDay === today
                    ? 'Oggi'
                    : selectedDay < today
                      ? 'Giorno passato'
                      : 'In programma',
            title: formatDayLong(selectedDay),
            previous: addDays(selectedDay, -1),
            next: addDays(selectedDay, 1),
            canGoBack: selectedDay > minDate,
            canGoForward: selectedDay < maxDate,
            unit: 'Giorno',
        },
        week: {
            kicker: 'Settimana',
            title: `${formatDayRange(week[0], week[6])} ${week[6].slice(0, 4)}`,
            previous: addDays(week[0], -7),
            next: addDays(week[0], 7),
            canGoBack: week[0] > minDate,
            canGoForward: week[6] < maxDate,
            unit: 'Settimana',
        },
        month: {
            kicker: 'Mese',
            title: monthName(month).replace(/^./u, (letter) =>
                letter.toUpperCase(),
            ),
            previous: `${shiftMonth(month, -1)}-01`,
            next: `${shiftMonth(month, 1)}-01`,
            canGoBack: `${month}-01` > minDate,
            canGoForward: month < maxDate.slice(0, 7),
            unit: 'Mese',
        },
    }[view];

    // The small month shows the month of the chosen day.
    const counts =
        selectedDay.slice(0, 7) === month
            ? monthCounts
            : Object.fromEntries(
                  items.map((item) => [
                      item.date,
                      items.filter((other) => other.date === item.date).length,
                  ]),
              );

    return (
        <div className="flex h-full min-h-0 gap-6">
            <section
                aria-label="Scegli il giorno"
                className={cn(
                    panelClassName,
                    'flex w-85 shrink-0 [scrollbar-width:none] flex-col gap-5 overflow-y-auto px-3 py-4',
                )}
            >
                <div className="flex items-center justify-between px-2.5 pt-1">
                    <h1 className={pageTitleClassName}>Calendario</h1>
                    <button
                        type="button"
                        disabled={selectedDay === today && view === 'day'}
                        onClick={() => show('day', today)}
                        className={cn(softButtonClassName, 'h-9')}
                    >
                        Oggi
                    </button>
                </div>

                <MiniMonth
                    month={selectedDay.slice(0, 7)}
                    selectedDay={selectedDay}
                    today={today}
                    counts={counts}
                    minDate={minDate}
                    maxDate={maxDate}
                    onPick={(date) =>
                        show(view === 'month' ? 'month' : 'day', date)
                    }
                />

                {selected && view !== 'day' ? (
                    <SessionDetails
                        item={selected}
                        today={today}
                        onClose={() => onSelect(null)}
                    />
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <h2 className={listLabelClassName}>
                                Sedute del giorno
                            </h2>
                            <span className="pr-2.5 text-xs text-muted-foreground">
                                {sessionsLabel(dayItems.length)}
                            </span>
                        </div>
                        {dayItems.length === 0 ? (
                            <p className="rounded-[18px] border border-dashed border-[#3a3a3a] p-3.5 text-[13px] text-muted-foreground">
                                Nessuna seduta. Usa “Aggiungi seduta” per
                                inserirne una.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-0.5 rounded-[18px] bg-card p-1">
                                {dayItems.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        aria-current={item.id === selectedId}
                                        onClick={() => {
                                            onSelect(item.id);

                                            if (view !== 'day') {
                                                show('day', item.date);
                                            }
                                        }}
                                        className={cn(
                                            'flex items-center gap-3 rounded-[14px] p-2.5 text-left',
                                            pressableRowClassName,
                                            item.id === selectedId &&
                                                'bg-brand-soft',
                                        )}
                                    >
                                        <span className="w-11 shrink-0 text-[15px] font-bold tabular-nums">
                                            {hourLabel(item.from)}
                                        </span>
                                        <span className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-[15px] font-semibold">
                                                {item.title}
                                            </span>
                                            <span className="truncate text-[13px] text-muted-foreground">
                                                {item.detail}
                                            </span>
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.kind === 'pending'
                                                ? 'In attesa'
                                                : new Date(item.end) <= now
                                                  ? 'Completata'
                                                  : 'In programma'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <WeekSummary
                    days={week}
                    items={items}
                    selectedDay={selectedDay}
                />
                <OpenHoursCard />
            </section>

            <main className="flex min-w-0 flex-1 [scrollbar-width:none] flex-col gap-5 overflow-y-auto pt-6 pr-6 pb-12">
                <header className="flex flex-wrap items-center gap-3">
                    <div className="flex min-w-55 flex-1 flex-col gap-0.5">
                        <span className="text-[15px] text-muted-foreground">
                            {period.kicker}
                        </span>
                        <h2 className={pageTitleClassName}>{period.title}</h2>
                    </div>
                    <ViewSwitch
                        view={view}
                        onChange={(next) => show(next, selectedDay)}
                    />
                    <button
                        type="button"
                        disabled={!period.canGoBack}
                        onClick={() => show(view, period.previous)}
                        aria-label={`${period.unit} precedente`}
                        title={`${period.unit} precedente`}
                        className={roundSoftClassName}
                    >
                        <ChevronLeft aria-hidden="true" className="size-4.5" />
                    </button>
                    <button
                        type="button"
                        disabled={!period.canGoForward}
                        onClick={() => show(view, period.next)}
                        aria-label={`${period.unit} successivo`}
                        title={`${period.unit} successivo`}
                        className={roundSoftClassName}
                    >
                        <ChevronRight aria-hidden="true" className="size-4.5" />
                    </button>
                    {sessionOptions && (
                        <button
                            type="button"
                            onClick={onAdd}
                            className={brandButtonClassName}
                        >
                            <Plus
                                aria-hidden="true"
                                className="size-4.5"
                                strokeWidth={2.5}
                            />
                            Aggiungi seduta
                        </button>
                    )}
                    <Link
                        href={availability()}
                        aria-label="Gestisci disponibilità"
                        title="Gestisci disponibilità"
                        className={roundSoftClassName}
                    >
                        <Clock aria-hidden="true" className="size-4.5" />
                    </Link>
                </header>

                <section
                    aria-label={period.title}
                    className={cn(
                        panelClassName,
                        view === 'day' ? 'px-4 py-2' : 'overflow-hidden',
                    )}
                >
                    {view === 'day' && (
                        <DayAgenda
                            date={selectedDay}
                            items={dayItems}
                            today={today}
                            now={now}
                            openId={selectedId}
                            onToggle={(id) =>
                                onSelect(selectedId === id ? null : id)
                            }
                            emptyHint="Nessuna seduta in questo giorno. Usa “Aggiungi seduta” per inserirne una."
                        />
                    )}
                    {view === 'week' && (
                        <WeekGrid
                            days={week}
                            items={items}
                            today={today}
                            selectedDay={selectedDay}
                            selectedId={selectedId}
                            onSelect={(item) => onSelect(item.id)}
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
            </main>
        </div>
    );
}
