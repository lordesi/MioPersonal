import { useId } from 'react';
import { perPersonLabel } from '@/lib/booking';
import { cn } from '@/lib/utils';

type PeoplePickerProps = {
    /** The most people of the chosen duration, the booker included (≥ 2). */
    max: number;
    value: number;
    onChange: (people: number) => void;
    /** The total for the chosen people, to show the share. */
    totalCents: number;
    /** dark: in the black booking box. */
    variant?: 'light' | 'dark';
};

/**
 * "Quante persone?": "Invita un amico", when the trainer opened the service
 * to more people. The friends join later with the link of the booking.
 */
export default function PeoplePicker({
    max,
    value,
    onChange,
    totalCents,
    variant = 'light',
}: PeoplePickerProps) {
    const labelId = useId();
    const dark = variant === 'dark';

    return (
        <div className="flex flex-col gap-1.5">
            <span
                id={labelId}
                className={cn(
                    'text-xs font-semibold',
                    dark
                        ? 'text-primary-foreground/60'
                        : 'text-muted-foreground',
                )}
            >
                Quante persone?
            </span>
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                className="flex flex-wrap gap-1.5"
            >
                {Array.from({ length: max }, (_, index) => index + 1).map(
                    (people) => {
                        const checked = people === value;

                        return (
                            <button
                                key={people}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                onClick={() => onChange(people)}
                                className={cn(
                                    'h-10 min-w-12 rounded-xl border px-3 text-sm font-semibold tabular-nums outline-none focus-visible:ring-[3px]',
                                    dark
                                        ? checked
                                            ? 'border-primary-foreground bg-primary-foreground text-primary focus-visible:ring-primary-foreground/50'
                                            : 'border-primary-foreground/20 text-primary-foreground hover:border-primary-foreground/40 focus-visible:ring-primary-foreground/50'
                                        : checked
                                          ? 'border-primary bg-primary text-primary-foreground focus-visible:ring-primary/30'
                                          : 'bg-background hover:border-foreground/40 focus-visible:ring-primary/30',
                                )}
                            >
                                {people === 1 ? 'Solo io' : people}
                            </button>
                        );
                    },
                )}
            </div>
            <span
                className={cn(
                    'text-xs',
                    dark
                        ? 'text-primary-foreground/60'
                        : 'text-muted-foreground',
                )}
            >
                {value > 1
                    ? `${perPersonLabel(totalCents, value)} · dopo la prenotazione inviti gli amici con un link`
                    : 'Puoi venire con degli amici: dopo la prenotazione li inviti con un link.'}
            </span>
        </div>
    );
}
