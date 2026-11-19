import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    SessionDetails,
    WeekSummary,
} from '@/components/trainer/area/calendar-side';
import MonthCalendar from '@/components/trainer/area/month-calendar';
import DayAgenda from '@/components/trainer/calendar/day-agenda';
import TimeGrid from '@/components/trainer/calendar/time-grid';
import type { CalendarViewProps } from '@/components/trainer/calendar/types';
import ViewMenu from '@/components/trainer/calendar/view-switch';
import WeekStrip from '@/components/trainer/home/week-strip';
import {
    brandFilledButtonClassName,
    pageTitleClassName,
} from '@/components/trainer/ui/styles';
import {
    addDays,
    mondayOf,
    monthName,
    shiftMonth,
    weekDates,
} from '@/lib/calendar';
import { formatDayLong, formatDayNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const weekdayLetters = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

/** "2026-11" → "Novembre 2026". */
function monthTitle(month: string): string {
    return monthName(month).replace(/^./u, (letter) => letter.toUpperCase());
}

/**
 * "Calendario" on phones: the title with the view menu and "+" on the right.
 * "Giorno" is the day as rows of one hour; "Settimana" the week strip and
 * two days side by side (design "Settimana A · Due giorni"); "Mese" the
 * month with the sessions of each day (design "Mese A").
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
        onPickSlot,
        draft,
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
    // The chosen day and the next one; on Sunday the Saturday before, so
    // both days are in the week loaded from the server.
    const pair =
        selectedDay === week[6]
            ? [week[5], week[6]]
            : [selectedDay, addDays(selectedDay, 1)];

    return (
        <>
            <header className="flex min-h-13 items-center gap-2">
                <h1 className={cn(pageTitleClassName, 'mr-auto')}>
                    Calendario
                </h1>
                <ViewMenu
                    view={view}
                    onChange={(next) => show(next, selectedDay)}
                />
                {sessionOptions && (
                    <button
                        type="button"
                        onClick={(event) => onAdd(event.currentTarget)}
                        aria-label="Nuova seduta"
                        className={cn(
                            brandFilledButtonClassName,
                            'size-11 px-0',
                        )}
                    >
                        <Plus
                            aria-hidden="true"
                            className="size-5.5"
                            strokeWidth={2.25}
                        />
                    </button>
                )}
            </header>

            {view === 'month' && (
                <section
                    aria-label={monthTitle(month)}
                    className="flex flex-col"
                >
                    <PeriodBar
                        title={monthTitle(month)}
                        unit="Mese"
                        gender="m"
                        canGoBack={`${month}-01` > minDate}
                        canGoForward={month < maxDate.slice(0, 7)}
                        onBack={() =>
                            show('month', `${shiftMonth(month, -1)}-01`)
                        }
                        onForward={() =>
                            show('month', `${shiftMonth(month, 1)}-01`)
                        }
                    />
                    <div className="-mx-1 mt-2">
                        <MonthCalendar
                            month={month}
                            items={items}
                            today={today}
                            selectedDay={selectedDay}
                            onOpenDay={(date) => show('day', date)}
                        />
                    </div>
                </section>
            )}

            {view === 'week' && (
                <section
                    aria-label={`${formatDayLong(pair[0])} e ${formatDayLong(pair[1]).toLowerCase()}`}
                    className="flex flex-col"
                >
                    <PeriodBar
                        title={monthTitle(pair[0].slice(0, 7))}
                        unit="Giorni"
                        gender="plural"
                        canGoBack={pair[0] > minDate}
                        canGoForward={pair[1] < maxDate}
                        onBack={() => show('week', addDays(pair[0], -2))}
                        onForward={() => show('week', addDays(pair[0], 2))}
                    />
                    <div className="mt-2 grid grid-cols-7">
                        {week.map((date, index) => {
                            const inPair = pair.includes(date);
                            const isToday = date === today;

                            return (
                                <div
                                    key={date}
                                    className="flex flex-col items-stretch gap-1"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="text-center text-xs leading-4 text-muted-foreground"
                                    >
                                        {weekdayLetters[index]}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`${formatDayLong(date)}${isToday ? ', oggi' : ''}`}
                                        aria-pressed={inPair}
                                        disabled={
                                            date < minDate || date > maxDate
                                        }
                                        onClick={() => show('week', date)}
                                        className={cn(
                                            'flex h-11 items-center justify-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40',
                                            inPair && 'bg-white/[0.07]',
                                            inPair &&
                                                date === pair[0] &&
                                                'rounded-l-xl',
                                            inPair &&
                                                date === pair[1] &&
                                                'rounded-r-xl',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex h-11 w-full max-w-10.5 items-center justify-center rounded-xl text-[19px] font-semibold tabular-nums',
                                                // The chosen day: a turquoise rounded square; today, turquoise digits.
                                                date === selectedDay
                                                    ? 'bg-brand text-[#0a0a0a]'
                                                    : isToday
                                                      ? 'text-brand'
                                                      : date < today
                                                        ? 'text-muted-foreground'
                                                        : 'text-foreground',
                                            )}
                                        >
                                            {formatDayNumber(date)}
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <div className="-mx-4 mt-3 pr-4">
                        <TimeGrid
                            days={pair}
                            items={items}
                            today={today}
                            now={now}
                            selectedDay={selectedDay}
                            selectedId={selectedId}
                            onSelect={(item) => onSelect(item.id)}
                            onPickSlot={onPickSlot}
                            draft={draft}
                            // Down to the tab bar: the header, the strip and the bar are above and below.
                            height="max(22rem, calc(100dvh - 320px))"
                        />
                    </div>
                </section>
            )}

            {view === 'day' && (
                <>
                    <WeekStrip
                        week={weekDays}
                        day={selectedDay}
                        today={today}
                        minDate={minDate}
                        maxDate={maxDate}
                        onPick={(date) => show('day', date)}
                    />
                    <section
                        aria-label={formatDayLong(selectedDay)}
                        className="flex flex-col gap-2"
                    >
                        <PeriodBar
                            title={
                                selectedDay === today
                                    ? 'Oggi'
                                    : formatDayLong(selectedDay)
                            }
                            unit="Giorno"
                            gender="m"
                            canGoBack={selectedDay > minDate}
                            canGoForward={selectedDay < maxDate}
                            onBack={() => show('day', addDays(selectedDay, -1))}
                            onForward={() =>
                                show('day', addDays(selectedDay, 1))
                            }
                            large
                        />
                        <DayAgenda
                            date={selectedDay}
                            items={dayItems}
                            today={today}
                            now={now}
                            openId={selectedId}
                            onToggle={(id) =>
                                onSelect(selectedId === id ? null : id)
                            }
                        />
                    </section>
                </>
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
        </>
    );
}

/** The title of the period with the two arrows on the right. */
function PeriodBar({
    title,
    unit,
    gender,
    canGoBack,
    canGoForward,
    onBack,
    onForward,
    large = false,
}: {
    title: ReactNode;
    unit: string;
    gender: 'm' | 'plural';
    canGoBack: boolean;
    canGoForward: boolean;
    onBack: () => void;
    onForward: () => void;
    large?: boolean;
}) {
    const [before, after] =
        gender === 'plural'
            ? ['precedenti', 'successivi']
            : ['precedente', 'successivo'];
    const arrowClassName =
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-foreground outline-none transition-colors hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40';

    return (
        <div className="-mr-2 flex items-center gap-1 pt-2">
            <h2
                className={cn(
                    'mr-auto font-semibold',
                    large
                        ? 'text-[22px] leading-7 font-bold'
                        : 'text-[20px] leading-6.25 tracking-[-0.45px]',
                )}
            >
                {title}
            </h2>
            <button
                type="button"
                disabled={!canGoBack}
                onClick={onBack}
                aria-label={`${unit} ${before}`}
                className={arrowClassName}
            >
                <ChevronLeft aria-hidden="true" className="size-5.5" />
            </button>
            <button
                type="button"
                disabled={!canGoForward}
                onClick={onForward}
                aria-label={`${unit} ${after}`}
                className={arrowClassName}
            >
                <ChevronRight aria-hidden="true" className="size-5.5" />
            </button>
        </div>
    );
}
