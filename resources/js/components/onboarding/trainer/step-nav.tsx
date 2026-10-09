import { Check } from 'lucide-react';
import ProgressBar from '@/components/shared/progress-bar';
import { cn } from '@/lib/utils';

export const stepLabels = [
    'Account',
    'Profilo pubblico',
    'Discipline e zone',
    'Servizi e prezzi',
    'Orari e regole',
    'Certificazioni',
    'Riepilogo',
];

type StepNavProps = {
    step: number;
    /** Highest step reached: the ones after it can't be opened yet. */
    reached: number;
    onSelect: (step: number) => void;
};

/** List of the 7 steps on desktop, progress bar with the step name on mobile. */
export default function StepNav({ step, reached, onSelect }: StepNavProps) {
    return (
        <>
            <div className="flex w-full flex-col gap-2 md:hidden">
                <div className="flex justify-between text-xs font-medium tabular-nums">
                    <span className="text-muted-foreground">
                        Passo {step} di 7
                    </span>
                    <span>{stepLabels[step - 1]}</span>
                </div>
                <ProgressBar
                    value={step}
                    max={7}
                    label="Avanzamento della registrazione"
                />
            </div>

            <nav
                aria-label="Passi della registrazione"
                className="hidden max-w-65 flex-[1_1_220px] flex-col gap-1 md:flex"
            >
                <span className="px-3 pb-3 text-xs font-medium text-muted-foreground uppercase tabular-nums">
                    Passo {step} di 7
                </span>
                {stepLabels.map((label, index) => {
                    const number = index + 1;
                    const current = number === step;
                    const done = number < step;

                    return (
                        <button
                            key={label}
                            type="button"
                            aria-current={current ? 'step' : undefined}
                            disabled={number > reached}
                            onClick={() => onSelect(number)}
                            className={cn(
                                'flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium disabled:cursor-not-allowed',
                                current
                                    ? 'bg-background text-foreground shadow-xs'
                                    : done
                                      ? 'text-foreground'
                                      : 'text-muted-foreground',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-6 flex-none items-center justify-center rounded-full text-xs font-semibold',
                                    current || done
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border border-input',
                                )}
                            >
                                {done ? (
                                    <Check
                                        aria-label="completato"
                                        className="size-3.5"
                                    />
                                ) : (
                                    number
                                )}
                            </span>
                            {label}
                        </button>
                    );
                })}
            </nav>
        </>
    );
}
