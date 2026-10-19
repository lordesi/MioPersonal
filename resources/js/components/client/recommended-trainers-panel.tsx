import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import Panel from '@/components/trainer/area/panel';
import { formatPrice } from '@/lib/format';
import type { TrainerSummary } from '@/types';

type RecommendedTrainersPanelProps = {
    trainers: TrainerSummary[];
    /** "Vedi tutti": the search in the client's city. */
    searchHref: string;
};

/**
 * "Consigliati per te": in place of "I tuoi trainer" while the client has
 * no trainers yet (no confirmed session, no favorites).
 */
export default function RecommendedTrainersPanel({
    trainers,
    searchHref,
}: RecommendedTrainersPanelProps) {
    return (
        <Panel
            title="Consigliati per te"
            className="gap-3.5"
            action={
                <Link
                    href={searchHref}
                    className="inline-flex min-h-11 items-center text-sm font-medium hover:underline"
                >
                    Vedi tutti
                </Link>
            }
        >
            {trainers.map((trainer, index) => (
                <Fragment key={trainer.slug}>
                    {index > 0 && (
                        <div aria-hidden="true" className="h-px bg-border/70" />
                    )}
                    <div className="flex items-center gap-3">
                        <UserAvatar
                            name={trainer.name}
                            src={trainer.photoUrl}
                            size="lg"
                            className="size-11 text-[13px] [&_[data-slot=avatar-fallback]]:bg-secondary"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                            <Link
                                href={trainer.href}
                                className="truncate text-[15px] leading-5.5 font-semibold hover:underline"
                            >
                                {trainer.name}
                            </Link>
                            <span className="truncate text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                {trainer.disciplines[0] ?? trainer.city} · da{' '}
                                {formatPrice(trainer.priceFromCents)}
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
