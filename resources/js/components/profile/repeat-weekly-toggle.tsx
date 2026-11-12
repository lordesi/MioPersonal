import { Repeat } from 'lucide-react';
import { useId } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type RepeatWeeklyToggleProps = {
    /** ISO UTC start of the chosen slot. */
    start: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** dark: in the black booking box. */
    variant?: 'light' | 'dark';
};

/** "ogni martedì alle 18:00", in Rome time like the slots. */
export function weeklyLabel(start: string): string {
    const date = new Date(start);
    const weekday = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        weekday: 'long',
    }).format(date);
    const time = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(date);

    return `ogni ${weekday} alle ${time}`;
}

/**
 * "Ripeti ogni settimana": the client asks for "sedute fisse" at the same
 * day and time. The trainer accepts them, or only this session.
 */
export default function RepeatWeeklyToggle({
    start,
    checked,
    onChange,
    variant = 'light',
}: RepeatWeeklyToggleProps) {
    const id = useId();
    const dark = variant === 'dark';

    return (
        <label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm',
                dark
                    ? 'border-primary-foreground/15 text-primary-foreground'
                    : 'bg-background',
            )}
        >
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => onChange(value === true)}
                className={cn(
                    'mt-0.5',
                    dark &&
                        'border-primary-foreground/60 data-[state=checked]:border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary',
                )}
            />
            <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-semibold">
                    <Repeat aria-hidden="true" className="size-3.5" />
                    Ripeti ogni settimana
                </span>
                <span
                    className={cn(
                        'text-xs',
                        dark
                            ? 'text-primary-foreground/60'
                            : 'text-muted-foreground',
                    )}
                >
                    Chiedi la stessa seduta {weeklyLabel(start)}. Il trainer può
                    accettare anche solo questa.
                </span>
            </span>
        </label>
    );
}
