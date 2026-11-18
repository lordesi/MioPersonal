import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import { VIEWS } from '@/components/trainer/calendar/types';
import { cn } from '@/lib/utils';

/** "Giorno · Settimana · Mese": the white pill marks the view shown. */
export default function ViewSwitch({
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
            role="group"
            aria-label="Vista del calendario"
            className={cn(
                'grid grid-cols-3 rounded-full bg-card p-1',
                className,
            )}
        >
            {VIEWS.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    aria-pressed={view === item.value}
                    onClick={() => onChange(item.value)}
                    className={cn(
                        'h-9 rounded-full px-3.5 text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        view === item.value
                            ? 'text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
