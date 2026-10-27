import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The 7 steps of "Diventa trainer", as named in the sidebar. */
export const steps = [
    { label: 'Account' },
    { label: 'Profilo pubblico' },
    { label: 'Discipline e città' },
    { label: 'Servizi e prezzi' },
    { label: 'Orari e regole' },
    { label: 'Certificazioni' },
    { label: 'Riepilogo' },
];

type StepNavProps = {
    /** The open step; 8 after sending, when every step is done. */
    step: number;
    /** Highest step reached: the ones after it can't be opened yet. */
    reached: number;
    /** 2 when a trainer fixes the profile: the account step is closed. */
    firstStep?: number;
    onSelect: (step: number) => void;
};

/**
 * The list of the 7 steps in the black sidebar: done (✓), open (white) or
 * still closed (grey). Only the steps already reached can be opened.
 */
export default function StepNav({
    step,
    reached,
    firstStep = 1,
    onSelect,
}: StepNavProps) {
    return (
        <nav aria-label="Passi della registrazione">
            <ol className="flex flex-col gap-1">
                {steps.map((item, index) => {
                    const number = index + 1;
                    const current = number === step;
                    const done = number < step;
                    const open = number <= reached && number >= firstStep;

                    return (
                        <li key={item.label}>
                            <button
                                type="button"
                                aria-current={current ? 'step' : undefined}
                                disabled={!open || current}
                                onClick={() => onSelect(number)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors disabled:cursor-default',
                                    current
                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                        : open || done
                                          ? 'text-sidebar-foreground enabled:hover:bg-sidebar-foreground/6'
                                          : 'text-muted-foreground',
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'flex size-7 flex-none items-center justify-center rounded-full text-[13px] font-bold tabular-nums',
                                        current
                                            ? 'bg-sidebar-primary-foreground text-sidebar-primary'
                                            : done
                                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                              : 'border-[1.5px] border-sidebar-border',
                                    )}
                                >
                                    {done ? (
                                        <Check
                                            strokeWidth={3}
                                            className="size-3.5"
                                        />
                                    ) : (
                                        number
                                    )}
                                </span>
                                <span className="min-w-0 text-sm font-semibold">
                                    {item.label}
                                    {done && (
                                        <span className="sr-only">
                                            , completato
                                        </span>
                                    )}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
