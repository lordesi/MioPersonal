import TrainerHeaderActions from '@/components/trainer/area/trainer-header-actions';
import {
    DayStrip,
    HourRows,
    PeriodBar,
    SessionList,
    SmallMonth,
    ViewTabs,
    periodOf,
} from '@/components/trainer/calendar/calendar-bits';
import type { CalendarViewProps } from '@/components/trainer/calendar/types';
import { mondayOf, sessionsLabel, weekDates } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';

/**
 * "Calendario" on phones (design "Trainer · Calendario · nuovo"): the title
 * with "+" and the photo, the three views, the period with its arrows.
 * "Giorno" is the week strip and the day hour by hour, "Settimana" the
 * sessions day by day, "Mese" the month and the sessions of the chosen day.
 * Each session opens its details in place.
 */
export default function CalendarMobile(props: CalendarViewProps) {
    const {
        view,
        focus,
        today,
        minDate,
        maxDate,
        items,
        monthCounts,
        canAdd,
        selectedDay,
        selectedId,
        onSelect,
        show,
        onAdd,
        onPickSlot,
        onAddOnDay,
        context,
    } = props;
    const week = weekDates(mondayOf(selectedDay));
    const period = periodOf(view, selectedDay, focus, minDate, maxDate);
    const dayItems = items
        .filter((item) => item.date === selectedDay)
        .sort((a, b) => a.from - b.from);
    const weekCount = items.filter((item) => week.includes(item.date)).length;
    const toggle = (id: number) => onSelect(selectedId === id ? null : id);

    return (
        <div className="flex flex-col">
            <header className="flex items-start justify-between gap-4">
                <h1 className="m-0 text-[34px] leading-[1.08] font-bold tracking-[-0.03em]">
                    Calendario
                </h1>
                <div className="flex items-center gap-1.5">
                    {canAdd && (
                        <button
                            type="button"
                            onClick={(event) => onAdd(event.currentTarget)}
                            aria-label="Aggiungi una seduta"
                            className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-[#42D7D9] text-black outline-none hover:bg-[#7FE6E7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]"
                        >
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </button>
                    )}
                    <TrainerHeaderActions bell={false} />
                </div>
            </header>

            <div className="mt-5 flex flex-col gap-5">
                <ViewTabs
                    view={view}
                    onChange={(next) => show(next, selectedDay)}
                />

                <PeriodBar
                    view={view}
                    title={period.title}
                    canGoBack={period.canGoBack}
                    canGoForward={period.canGoForward}
                    onBack={() => show(view, period.previous)}
                    onForward={() => show(view, period.next)}
                />

                {view === 'day' && (
                    <div className="flex flex-col gap-5">
                        <DayStrip
                            week={week}
                            items={items}
                            selectedDay={selectedDay}
                            today={today}
                            onPick={(date) => show('day', date)}
                        />
                        <span className="text-[15px] leading-5 text-muted-foreground">
                            {sessionsLabel(dayItems.length)}
                        </span>
                        <HourRows
                            date={selectedDay}
                            today={today}
                            items={dayItems}
                            selectedId={selectedId}
                            onToggle={toggle}
                            onAddAt={canAdd ? onPickSlot : null}
                            context={context}
                        />
                    </div>
                )}

                {view === 'week' && (
                    <div className="flex flex-col gap-4">
                        <span className="text-[15px] leading-5 text-muted-foreground">
                            {sessionsLabel(weekCount)}
                        </span>
                        <div className="flex flex-col gap-5.5">
                            {week.map((date) => {
                                const list = items
                                    .filter((item) => item.date === date)
                                    .sort((a, b) => a.from - b.from);

                                return (
                                    <section
                                        key={date}
                                        aria-label={formatDayLong(date)}
                                        className="flex flex-col gap-2"
                                    >
                                        <b className="text-base font-bold">
                                            {formatDayLong(date)}
                                        </b>
                                        {list.length > 0 ? (
                                            <SessionList
                                                items={list}
                                                selectedId={selectedId}
                                                onToggle={toggle}
                                                context={context}
                                            />
                                        ) : (
                                            canAdd && (
                                                <button
                                                    type="button"
                                                    aria-label={`Aggiungi una seduta ${formatDayLong(date).toLowerCase()}`}
                                                    disabled={date < today}
                                                    onClick={(event) =>
                                                        onAddOnDay(
                                                            date,
                                                            event.currentTarget,
                                                        )
                                                    }
                                                    className="h-11 cursor-pointer rounded-[14px] border-0 bg-transparent text-[22px] font-medium text-muted-foreground shadow-[inset_0_0_0_1px_#1C1E21] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9] disabled:cursor-default disabled:opacity-40"
                                                >
                                                    +
                                                </button>
                                            )
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                )}

                {view === 'month' && (
                    <div className="flex flex-col gap-6">
                        <SmallMonth
                            month={focus.slice(0, 7)}
                            counts={monthCounts}
                            selectedDay={selectedDay}
                            today={today}
                            minDate={minDate}
                            maxDate={maxDate}
                            onPick={(date) => show('month', date)}
                        />
                        <section
                            aria-label={formatDayLong(selectedDay)}
                            className="flex flex-col gap-2.5"
                        >
                            <div className="flex items-baseline justify-between">
                                <h3 className="m-0 text-lg font-bold">
                                    {formatDayLong(selectedDay)}
                                </h3>
                                <span className="text-[13px] leading-4.5 text-muted-foreground">
                                    {sessionsLabel(dayItems.length)}
                                </span>
                            </div>
                            {dayItems.length > 0 && (
                                <SessionList
                                    items={dayItems}
                                    selectedId={selectedId}
                                    onToggle={toggle}
                                    context={context}
                                />
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
