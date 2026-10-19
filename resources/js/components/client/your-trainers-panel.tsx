import { Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { Fragment } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import Panel from '@/components/trainer/area/panel';
import { formatRelativeSlot } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClientTrainer } from '@/types';

/**
 * "I tuoi trainer": the ones already booked (with their discipline) and the
 * favorites (with the first free slot), each with "Prenota".
 */
export default function YourTrainersPanel({
    trainers,
}: {
    trainers: ClientTrainer[];
}) {
    return (
        <Panel title="I tuoi trainer" className="gap-3.5">
            {trainers.map((trainer, index) => (
                <Fragment key={trainer.href}>
                    {index > 0 && (
                        <div aria-hidden="true" className="h-px bg-border/70" />
                    )}
                    <div className="flex items-center gap-3">
                        <UserAvatar
                            name={trainer.name}
                            size="lg"
                            className={cn(
                                'size-11 text-[13px]',
                                // The first one, the trainer of the last session, in black as in the design.
                                index === 0 && trainer.booked
                                    ? '[&_[data-slot=avatar-fallback]]:bg-primary [&_[data-slot=avatar-fallback]]:text-primary-foreground'
                                    : '[&_[data-slot=avatar-fallback]]:bg-secondary',
                            )}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-1.5 text-[15px] leading-5.5 font-semibold">
                                <Link
                                    href={trainer.href}
                                    className="truncate hover:underline"
                                >
                                    {trainer.name}
                                </Link>
                                {trainer.favorite && (
                                    <Heart
                                        role="img"
                                        aria-label="Preferito"
                                        className="size-3.25 flex-none fill-current"
                                    />
                                )}
                            </span>
                            <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                {subtitle(trainer)}
                            </span>
                        </span>
                        <Link
                            href={trainer.href}
                            aria-label={`Prenota con ${trainer.name}`}
                            className="inline-flex h-9 flex-none items-center rounded-[9px] border border-input px-3 text-[13px] font-semibold hover:bg-accent"
                        >
                            Prenota
                        </Link>
                    </div>
                </Fragment>
            ))}
        </Panel>
    );
}

/** The discipline for the trainers already booked, the first free slot for the others. */
function subtitle(trainer: ClientTrainer): string {
    if (trainer.booked && trainer.discipline) {
        return trainer.discipline;
    }

    return trainer.nextSlotStart
        ? `Primo slot libero: ${formatRelativeSlot(trainer.nextSlotStart)}`
        : 'Nessuno slot libero';
}
