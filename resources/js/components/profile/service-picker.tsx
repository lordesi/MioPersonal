import { servicePriceLabel } from '@/lib/booking';
import { cn } from '@/lib/utils';
import type { TrainerService } from '@/types';

type ServicePickerProps = {
    services: TrainerService[];
    value: number;
    onChange: (serviceId: number) => void;
    legend: string;
    /**
     * 'detailed' shows the note and bigger text (mobile "Servizi e prezzi");
     * 'dark' is for the black booking box (the chosen one turns white).
     */
    variant?: 'compact' | 'detailed' | 'dark';
    className?: string;
};

/** Radio list of the trainer's services, as in the design (role="radio"). */
export default function ServicePicker({
    services,
    value,
    onChange,
    legend,
    variant = 'compact',
    className,
}: ServicePickerProps) {
    const detailed = variant === 'detailed';
    const dark = variant === 'dark';

    return (
        <fieldset className={cn('flex flex-col gap-2', className)}>
            <legend
                className={cn(
                    'pb-2',
                    dark
                        ? 'text-xs leading-4 font-semibold tracking-[0.08em] text-primary-foreground/60 uppercase'
                        : detailed
                          ? 'text-sm text-muted-foreground'
                          : 'text-sm font-medium',
                )}
            >
                {legend}
            </legend>
            {services.map((service) => {
                const checked = service.id === value;

                return (
                    <button
                        key={service.id}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => onChange(service.id)}
                        className={cn(
                            'flex items-center gap-3 text-left',
                            dark
                                ? cn(
                                      'min-h-14 rounded-[14px] border px-3.5 py-3 outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/50',
                                      checked
                                          ? 'border-primary-foreground bg-primary-foreground text-primary'
                                          : 'border-primary-foreground/15 text-primary-foreground hover:border-primary-foreground/40',
                                  )
                                : cn(
                                      'bg-background text-foreground',
                                      detailed
                                          ? 'min-h-16 rounded-xl px-3.5 py-2.5'
                                          : 'min-h-13 rounded-lg px-3 py-2',
                                      checked
                                          ? 'border-2 border-primary'
                                          : 'border',
                                  ),
                        )}
                    >
                        {dark ? (
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'flex size-4.5 shrink-0 items-center justify-center rounded-full border-2',
                                    checked
                                        ? 'border-primary'
                                        : 'border-primary-foreground/30',
                                )}
                            >
                                {checked && (
                                    <span className="size-2 rounded-full bg-primary" />
                                )}
                            </span>
                        ) : (
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'shrink-0 rounded-full',
                                    detailed ? 'size-4.5' : 'size-4',
                                    checked
                                        ? detailed
                                            ? 'border-6 border-primary'
                                            : 'border-5 border-primary'
                                        : 'border border-input',
                                )}
                            />
                        )}
                        {/* min-w-0 + break-words: a long note wraps instead of widening the row. */}
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5 break-words">
                            <span
                                className={cn(
                                    detailed
                                        ? 'text-base font-semibold'
                                        : dark
                                          ? 'text-sm font-semibold'
                                          : 'text-sm font-medium',
                                )}
                            >
                                {service.name}
                            </span>
                            <span
                                className={cn(
                                    'tabular-nums',
                                    detailed ? 'text-sm' : 'text-xs',
                                    dark && !checked
                                        ? 'text-primary-foreground/60'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {detailed && service.note
                                    ? `${service.durationLabel} · ${service.note}`
                                    : service.durationLabel}
                            </span>
                        </span>
                        <span
                            className={cn(
                                'shrink-0 tabular-nums',
                                detailed
                                    ? 'text-lg leading-7 font-bold tracking-tight'
                                    : dark
                                      ? 'text-[15px] leading-5 font-bold'
                                      : 'text-sm font-semibold',
                            )}
                        >
                            {servicePriceLabel(service)}
                        </span>
                    </button>
                );
            })}
        </fieldset>
    );
}
