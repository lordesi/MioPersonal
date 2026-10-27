import { Link } from '@inertiajs/react';
import { Moon } from 'lucide-react';
import UserAvatar from '@/components/shared/user-avatar';
import { kindLabels } from '@/components/trainer/area/week-grid';
import { Button } from '@/components/ui/button';
import type { CalendarItem } from '@/lib/calendar';
import { hourLabel, hoursAmountLabel, sessionsLabel } from '@/lib/calendar';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';
import { availability } from '@/routes/trainer';

type DayViewProps = {
    date: string;
    /** The sessions of the day, in order. */
    items: CalendarItem[];
    today: string;
    selectedId: number | null;
    onSelect: (item: CalendarItem) => void;
};

/** Hours of sessions in a list: 13:00–14:00 + 14:00–15:30 → 2.5. */
export function totalHours(items: CalendarItem[]): number {
    return items.reduce((sum, item) => sum + item.to - item.from, 0);
}

/** "Giorno": the sessions of one day as black cards, or "Nessuna seduta". */
export default function DayView({
    date,
    items,
    today,
    selectedId,
    onSelect,
}: DayViewProps) {
    return (
        <div className="flex flex-col gap-4.5 p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[22px] leading-7.5 font-bold tracking-[-0.02em]">
                    {formatDayLong(date)}
                    {date === today && ' · oggi'}
                </h3>
                <span className="text-sm text-muted-foreground tabular-nums">
                    {items.length > 0
                        ? `${sessionsLabel(items.length)} · ${hoursAmountLabel(totalHours(items))}`
                        : 'Nessuna seduta'}
                </span>
            </div>

            {items.length > 0 ? (
                <ol className="flex flex-col gap-3">
                    {items.map((item) => (
                        <li key={item.key} className="flex gap-3 sm:gap-4">
                            <span className="flex w-13 flex-none flex-col pt-4 tabular-nums sm:w-16">
                                <span className="text-base leading-5.5 font-bold">
                                    {hourLabel(item.from)}
                                </span>
                                <span className="text-[13px] leading-4.5 text-muted-foreground">
                                    {hourLabel(item.to)}
                                </span>
                            </span>
                            <div
                                className={cn(
                                    'flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3 rounded-[18px] px-4.5 py-4',
                                    item.kind === 'confirmed'
                                        ? 'bg-sidebar text-sidebar-foreground'
                                        : 'border-[1.5px] border-dashed border-foreground bg-card',
                                    item.id === selectedId &&
                                        'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                                )}
                            >
                                <UserAvatar
                                    name={item.title}
                                    size="lg"
                                    className={cn(
                                        'size-11 text-sm',
                                        item.kind === 'confirmed'
                                            ? '[&_[data-slot=avatar-fallback]]:bg-sidebar-border [&_[data-slot=avatar-fallback]]:text-sidebar-foreground'
                                            : '[&_[data-slot=avatar-fallback]]:bg-secondary',
                                    )}
                                />
                                <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                                    <span className="text-base font-semibold">
                                        {item.title}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-sm',
                                            item.kind === 'confirmed'
                                                ? 'text-sidebar-muted-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {item.detail}
                                        {item.place && ` · ${item.place}`}
                                    </span>
                                </span>
                                <span
                                    className={cn(
                                        'inline-flex h-6.5 items-center rounded-full px-2.5 text-xs font-semibold',
                                        item.kind === 'confirmed'
                                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                            : 'bg-foreground text-background',
                                    )}
                                >
                                    {kindLabels[item.kind]}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-pressed={item.id === selectedId}
                                    aria-label={`Dettagli della seduta delle ${hourLabel(item.from)} con ${item.title}`}
                                    onClick={() => onSelect(item)}
                                    className={cn(
                                        'h-10 rounded-[10px] px-3.5 font-semibold shadow-none',
                                        item.kind === 'confirmed' &&
                                            'border-sidebar-foreground/25 bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                                    )}
                                >
                                    Dettagli
                                </Button>
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <div className="flex flex-col items-center gap-2.5 rounded-[18px] bg-secondary/60 px-6 py-14 text-center">
                    <span className="flex size-12 items-center justify-center rounded-[14px] bg-foreground text-background">
                        <Moon aria-hidden="true" className="size-5.5" />
                    </span>
                    <span className="text-[17px] leading-6 font-semibold">
                        Nessuna seduta
                    </span>
                    <span className="max-w-100 text-sm text-muted-foreground">
                        Nessuna seduta in programma. Se vuoi ricevere richieste
                        per questo giorno, controlla di avere slot liberi.
                    </span>
                    <Button
                        asChild
                        variant="outline"
                        className="mt-1 h-10 rounded-full px-4 font-semibold"
                    >
                        <Link href={availability()}>Apri disponibilità</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
