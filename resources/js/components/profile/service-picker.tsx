import { servicePriceLabel } from '@/lib/booking';
import { cn } from '@/lib/utils';
import type { TrainerService } from '@/types';

type ServicePickerProps = {
    services: TrainerService[];
    value: number;
    onChange: (serviceId: number) => void;
    legend: string;
    /** 'detailed' shows the note and bigger text (mobile "Servizi e prezzi"). */
    variant?: 'compact' | 'detailed';
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

    return (
        <fieldset className={cn('flex flex-col gap-2', className)}>
            <legend
                className={cn(
                    'pb-2 text-sm',
                    detailed ? 'text-muted-foreground' : 'font-medium',
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
                            'flex items-center gap-3 bg-background text-left text-foreground',
                            detailed
                                ? 'min-h-16 rounded-xl px-3.5 py-2.5'
                                : 'min-h-13 rounded-lg px-3 py-2',
                            checked ? 'border-2 border-primary' : 'border',
                        )}
                    >
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
                        <span className="flex flex-1 flex-col">
                            <span
                                className={cn(
                                    detailed
                                        ? 'text-base font-semibold'
                                        : 'text-sm font-medium',
                                )}
                            >
                                {service.name}
                            </span>
                            <span
                                className={cn(
                                    'text-muted-foreground',
                                    detailed ? 'text-sm' : 'text-xs',
                                )}
                            >
                                {detailed
                                    ? `${service.durationLabel} · ${service.note}`
                                    : service.durationLabel}
                            </span>
                        </span>
                        <span
                            className={cn(
                                'tabular-nums',
                                detailed
                                    ? 'text-lg leading-7 font-bold tracking-tight'
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
