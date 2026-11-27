import {
    BigMonth,
    HourRows,
    PeriodBar,
    SessionList,
    SmallMonth,
    ViewTabs,
    periodOf,
} from '@/components/trainer/calendar/calendar-bits';
import {
    Avatar,
    SessionDetails,
} from '@/components/trainer/calendar/session-row';
import type { CalendarViewProps } from '@/components/trainer/calendar/types';
import WeekTimeGrid from '@/components/trainer/calendar/week-time-grid';
import { mondayOf, monthName, sessionsLabel, weekDates } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';

/** "2026-11" → "Novembre 2026". */
function monthTitle(month: string): string {
    return monthName(month).replace(/^./u, (letter) => letter.toUpperCase());
}

/**
 * "Calendario" on desktop (design "Trainer · Calendario · nuovo ·
 * desktop"): the title, the three views in the middle and "+" on the right,
 * then the period with its arrows. "Giorno" is the small month and the day
 * hour by hour; "Settimana" the 7 days hour by hour with the details of the
 * session chosen on the right; "Mese" the big month with the sessions of
 * the chosen day on the right.
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
        canAdd,
        selectedDay,
        selectedId,
        onSelect,
        show,
        onAdd,
        onPickSlot,
        draft,
        context,
    } = props;
    const week = weekDates(mondayOf(selectedDay));
    const period = periodOf(view, selectedDay, focus, minDate, maxDate);
    const dayItems = items
        .filter((item) => item.date === selectedDay)
        .sort((a, b) => a.from - b.from);
    const weekCount = items.filter((item) => week.includes(item.date)).length;
    const selected = items.find((item) => item.id === selectedId) ?? null;
    const toggle = (id: number) => onSelect(selectedId === id ? null : id);

    return (
        <div className="flex flex-col">
            <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                <h1 className="m-0 text-[40px] leading-[1.08] font-bold tracking-[-0.03em]">
                    Calendario
                </h1>
                <ViewTabs
                    view={view}
                    onChange={(next) => show(next, selectedDay)}
                    className="w-100"
                />
                <div className="justify-self-end">
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
                </div>
            </header>

            <div className="mt-7 flex flex-col gap-6">
                <PeriodBar
                    view={view}
                    title={period.title}
                    canGoBack={period.canGoBack}
                    canGoForward={period.canGoForward}
                    onBack={() => show(view, period.previous)}
                    onForward={() => show(view, period.next)}
                />

                {view === 'day' && (
                    <div className="grid grid-cols-[340px_minmax(0,1fr)] items-start gap-14">
                        <div className="flex flex-col gap-2.5">
                            <b className="text-base font-bold">
                                {monthTitle(selectedDay.slice(0, 7))}
                            </b>
                            <SmallMonth
                                month={selectedDay.slice(0, 7)}
                                counts={monthCounts}
                                selectedDay={selectedDay}
                                today={today}
                                minDate={minDate}
                                maxDate={maxDate}
                                onPick={(date) => show('day', date)}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
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
                    </div>
                )}

                {view === 'week' && (
                    <div className="flex flex-col gap-3">
                        <span className="text-[15px] leading-5 text-muted-foreground">
                            {sessionsLabel(weekCount)}
                        </span>
                        <div className="flex items-start gap-5">
                            <WeekTimeGrid
                                days={week}
                                items={items}
                                today={today}
                                selectedDay={selectedDay}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                onPickDay={(date) => show('week', date)}
                                onAddAt={canAdd ? onPickSlot : null}
                                draft={draft}
                                context={context}
                            />
                            <aside
                                aria-label="Dettagli della seduta"
                                className="sticky top-6 flex w-85 shrink-0 flex-col gap-4 rounded-3xl bg-[#121315] p-5"
                            >
                                {selected ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={selected.title}
                                                size={44}
                                            />
                                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <b className="truncate text-lg leading-5.5 font-semibold">
                                                    {selected.title}
                                                </b>
                                                <span className="truncate text-sm leading-5 text-muted-foreground">
                                                    {selected.detail}
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                aria-label="Chiudi"
                                                onClick={() => onSelect(null)}
                                                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[#1C1E21] text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]"
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M18 6 6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <SessionDetails
                                            key={selected.id}
                                            item={selected}
                                            kind={context.kindOf(selected)}
                                            context={context}
                                        />
                                    </div>
                                ) : (
                                    <p className="m-0 text-[15px] leading-5 text-muted-foreground">
                                        Tocca una seduta per vedere orario, note
                                        e per spostarla o annullarla.
                                    </p>
                                )}
                            </aside>
                        </div>
                    </div>
                )}

                {view === 'month' && (
                    <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-10">
                        <BigMonth
                            month={focus.slice(0, 7)}
                            items={items}
                            selectedDay={selectedDay}
                            today={today}
                            onPick={(date) => show('month', date)}
                            kindOf={context.kindOf}
                        />
                        <div className="flex flex-col gap-3">
                            <h3 className="m-0 text-lg font-bold">
                                {formatDayLong(selectedDay)}
                            </h3>
                            {dayItems.length > 0 ? (
                                <SessionList
                                    items={dayItems}
                                    selectedId={selectedId}
                                    onToggle={toggle}
                                    context={context}
                                />
                            ) : (
                                <p className="m-0 text-[15px] leading-5 text-muted-foreground">
                                    Nessuna seduta.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
