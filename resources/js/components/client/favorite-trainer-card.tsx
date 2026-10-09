import { Link } from '@inertiajs/react';
import FavoriteButton from '@/components/shared/favorite-button';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { formatPrice, formatRating } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerSummary } from '@/types';

type FavoriteTrainerCardProps = {
    trainer: TrainerSummary;
    /** True after the heart was tapped: the card offers "Annulla". */
    removed: boolean;
    onRemovedChange: (removed: boolean) => void;
};

/** A saved trainer in "Preferiti", with "Prenota" and the heart to remove it. */
export default function FavoriteTrainerCard({
    trainer,
    removed,
    onRemovedChange,
}: FavoriteTrainerCardProps) {
    const getInitials = useInitials();

    return (
        <article
            aria-label={trainer.name}
            className={cn(
                'relative flex flex-col overflow-hidden rounded-xl border bg-card',
                // Only as tall as the "tolto dai preferiti" line, not the whole grid row.
                removed && 'self-start',
            )}
        >
            {removed ? (
                <div
                    role="status"
                    className="flex items-center justify-between gap-2 p-4 text-sm"
                >
                    <span>
                        <strong>{trainer.name}</strong> tolto dai preferiti
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9"
                        onClick={() => onRemovedChange(false)}
                    >
                        Annulla
                    </Button>
                </div>
            ) : (
                <>
                    <Link
                        href={trainer.href}
                        className="flex flex-col text-foreground"
                    >
                        <span className="flex aspect-4/3 items-center justify-center overflow-hidden bg-muted text-[40px] font-bold text-muted-foreground">
                            {trainer.photoUrl ? (
                                <img
                                    src={trainer.photoUrl}
                                    alt=""
                                    className="size-full object-cover"
                                />
                            ) : (
                                getInitials(trainer.name)
                            )}
                        </span>
                        <span className="flex flex-col gap-1 p-4">
                            <span className="text-lg font-semibold">
                                {trainer.name}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                {trainer.disciplines.join(' · ')} ·{' '}
                                {trainer.zone}
                            </span>
                            <span className="text-[13px] tabular-nums">
                                {trainer.rating === null
                                    ? 'Nuovo'
                                    : `★ ${formatRating(trainer.rating)}`}{' '}
                                · da{' '}
                                <strong>
                                    {formatPrice(trainer.priceFromCents)}
                                </strong>
                            </span>
                            <span className="text-[13px] font-semibold tabular-nums">
                                Primo slot libero: {trainer.nextSlotLabel}
                            </span>
                        </span>
                    </Link>
                    <div className="flex px-4 pb-4">
                        <Button asChild className="h-10 flex-1 font-semibold">
                            <Link href={trainer.href}>Prenota</Link>
                        </Button>
                    </div>
                    <FavoriteButton
                        trainerName={trainer.name}
                        pressed
                        onPressedChange={() => onRemovedChange(true)}
                        className="absolute top-3 right-3 size-10 bg-background"
                    />
                </>
            )}
        </article>
    );
}
