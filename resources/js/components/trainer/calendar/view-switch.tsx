import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import { VIEWS } from '@/components/trainer/calendar/types';
import { cn } from '@/lib/utils';

/**
 * "Giorno · Settimana · Mese" (design "Trainer · Calendario · nuovo"): the
 * three views always in sight, the one shown in turquoise.
 */
export default function ViewMenu({
    view,
    onChange,
    className,
}: {
    view: CalendarView;
    onChange: (view: CalendarView) => void;
    className?: string;
}) {
    return (
        <div
            role="tablist"
            aria-label="Vista del calendario"
            className={cn('flex rounded-full bg-card p-1', className)}
        >
            {VIEWS.map((item) => {
                const selected = item.value === view;

                return (
                    <button
                        key={item.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => !selected && onChange(item.value)}
                        className={cn(
                            'h-9 flex-1 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selected
                                ? 'bg-brand text-black'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
