import { Clock } from 'lucide-react';
import type { CalendarView } from '@/components/trainer/area/calendar-nav';
import { VIEWS } from '@/components/trainer/calendar/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * "Giorno · Settimana · Mese": a round button next to "+" in the header,
 * with the clock; the menu marks the view shown.
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
    const current = VIEWS.find((item) => item.value === view)?.label ?? '';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Cambia vista (ora: ${current})`}
                title="Cambia vista"
                className={cn(
                    'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors outline-none hover:bg-[#3a3a3a] focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    className,
                )}
            >
                <Clock aria-hidden="true" className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-52 rounded-[18px] p-1.5"
            >
                <DropdownMenuLabel className="px-2.5 text-xs font-semibold tracking-[0.4px] text-muted-foreground uppercase">
                    Vista
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={view}
                    onValueChange={(value) => onChange(value as CalendarView)}
                >
                    {VIEWS.map((item) => (
                        <DropdownMenuRadioItem
                            key={item.value}
                            value={item.value}
                            className="h-10 rounded-xl text-[15px]"
                        >
                            {item.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
