import { ChevronLeft, ChevronRight } from 'lucide-react';
import ResponsiveText from '@/components/shared/responsive-text';
import { Button } from '@/components/ui/button';
import { monthCells, sessionsLabel } from '@/lib/calendar';
import { formatDayNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

/** From "no sessions" to "6 or more", darker means busier. */
const heat = [
    'border-border bg-background',
    'border-transparent bg-foreground/10',
    'border-transparent bg-foreground/20',
    'border-transparent bg-foreground/35',
    'border-transparent bg-foreground/55 text-background',
    'border-transparent bg-foreground/75 text-background',
    'border-transparent bg-foreground text-background',
];

const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

type MonthHeatmapProps = {
    /** "YYYY-MM" */
    month: string;
    monthLabel: string;
    canGoBack: boolean;
    canGoForward: boolean;
    onMonthChange: (step: -1 | 1) => void;
    counts: Record<string, number>;
    today: string;
    selected: string;
    onSelect: (date: string) => void;
    onOpenWeek: () => void;
};

/** Month at a glance: each day is coloured by its number of sessions. */
export default function MonthHeatmap({
    month,
    monthLabel,
    canGoBack,
    canGoForward,
    onMonthChange,
    counts,
    today,
    selected,
    onSelect,
    onOpenWeek,
}: MonthHeatmapProps) {
    const [year, monthNumber] = month.split('-').map(Number);
    const cells = monthCells(year, monthNumber);
    const level = (date: string) => Math.min(counts[date] ?? 0, 6);
    const monthTotal = cells.reduce(
        (total, date) => total + (date ? level(date) : 0),
        0,
    );

    return (
        <section
            aria-label="Mese"
            className="flex flex-wrap gap-6 rounded-xl border bg-card p-4 md:p-5"
        >
            <div className="flex min-w-0 flex-[2_1_460px] flex-col gap-2.5">
                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Mese precedente"
                        disabled={!canGoBack}
                        onClick={() => onMonthChange(-1)}
                    >
                        <ChevronLeft />
                    </Button>
                    <span className="font-semibold capitalize tabular-nums">
                        {monthLabel}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Mese successivo"
                        disabled={!canGoForward}
                        onClick={() => onMonthChange(1)}
                    >
                        <ChevronRight />
                    </Button>
                </div>

                <div
                    aria-hidden="true"
                    className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground"
                >
                    {weekdays.map((day) => (
                        <span key={day}>
                            <ResponsiveText
                                mobile={day.charAt(0)}
                                desktop={day}
                            />
                        </span>
                    ))}
                </div>

                <div
                    role="group"
                    aria-label="Giorni del mese"
                    className="grid grid-cols-7 gap-1.5"
                >
                    {cells.map((date, index) =>
                        date === null ? (
                            <span key={`blank-${index}`} aria-hidden="true" />
                        ) : (
                            <button
                                key={date}
                                type="button"
                                aria-pressed={date === selected}
                                aria-label={`${formatDayNumber(date)} ${monthLabel.split(' ')[0]}: ${sessionsLabel(level(date)).toLowerCase()}`}
                                onClick={() => onSelect(date)}
                                className={cn(
                                    'flex h-12 flex-col justify-between rounded-lg border px-1.5 py-1 text-left md:h-15 md:px-1.75',
                                    heat[level(date)],
                                    date === selected &&
                                        'border-2 border-foreground',
                                    date === today &&
                                        'outline-2 outline-offset-2 outline-muted-foreground outline-dashed',
                                )}
                            >
                                <span className="text-[13px] leading-4 font-semibold tabular-nums">
                                    {formatDayNumber(date)}
                                </span>
                                <span className="self-end text-xs leading-3.5 font-semibold tabular-nums">
                                    {level(date)}
                                </span>
                            </button>
                        ),
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Meno</span>
                    {heat.map((classes) => (
                        <span
                            key={classes}
                            aria-hidden="true"
                            className={cn('size-3.5 rounded border', classes)}
                        />
                    ))}
                    <ResponsiveText
                        mobile="Più"
                        desktop="Più sedute · il numero in basso a destra è il totale del giorno"
                    />
                </div>
            </div>

            <div className="flex flex-[1_1_240px] flex-col gap-1.5">
                <span className="font-semibold">
                    {formatDayNumber(selected)} {monthLabel.split(' ')[0]}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                    {sessionsLabel(level(selected))} · {monthTotal} sedute nel
                    mese
                </span>
                <Button
                    type="button"
                    variant="outline"
                    className="mt-2 hidden self-start md:inline-flex"
                    onClick={onOpenWeek}
                >
                    Apri la settimana
                </Button>
            </div>
        </section>
    );
}
