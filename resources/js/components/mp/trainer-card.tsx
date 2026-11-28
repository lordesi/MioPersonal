import { Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { useFavorite } from '@/hooks/use-favorite';
import { useInitials } from '@/hooks/use-initials';
import { formatPrice, formatRating } from '@/lib/format';
import { hoverPrefetch } from '@/lib/prefetch';
import { cn } from '@/lib/utils';
import type { TrainerSummary } from '@/types';

/** "Dal vivo e online", "Dal vivo", "Online". */
export function trainingModeLabel(online: TrainerSummary['online']): string {
    switch (online) {
        case 'also':
            return 'Dal vivo e online';
        case 'only':
            return 'Online';
        default:
            return 'Dal vivo';
    }
}

type TrainerCardProps = {
    trainer: TrainerSummary;
    /** The fixed width of the rows that scroll sideways (272px); in a grid it fills the cell. */
    rail?: boolean;
    /** Two cards side by side on phones ("Preferiti"): smaller text. */
    size?: 'md' | 'sm';
    className?: string;
};

/**
 * The card of a trainer (design "TrainerCard", Home F): the square photo
 * with "Nuovo" (no reviews yet) and the heart, then the name with the rating,
 * the discipline, city and mode, and the price "/ seduta". The whole card is
 * the link; the heart (guests and clients only) sits on top of it.
 */
export default function TrainerCard({
    trainer,
    rail = false,
    size = 'md',
    className,
}: TrainerCardProps) {
    const small = size === 'sm';
    const getInitials = useInitials();
    const favorite = useFavorite(
        trainer.slug,
        trainer.favorite ?? false,
        'trainer',
    );
    const price = formatPrice(trainer.priceFromCents);
    const discipline = trainer.disciplines[0];
    // No reviews yet: "Nuovo" on the photo, no stars.
    const isNew = trainer.rating === null;
    const rating = isNew
        ? null
        : {
              score: formatRating(trainer.rating ?? 0),
              count: trainer.reviewCount,
          };
    // The gray lines under the name: discipline, place, price.
    const line = cn(
        'truncate text-muted-foreground',
        small
            ? 'text-[13px] leading-4.5 lg:text-sm lg:leading-5'
            : 'text-sm leading-5',
    );
    const ratingLabel = isNew
        ? 'nuovo'
        : `voto ${formatRating(trainer.rating ?? 0)} su ${trainer.reviewCount === 1 ? '1 recensione' : `${trainer.reviewCount} recensioni`}`;

    return (
        <article
            className={cn(
                'group/card relative flex min-w-0 flex-col',
                rail && 'w-68 shrink-0',
                className,
            )}
        >
            <Link
                prefetch={hoverPrefetch}
                href={trainer.href}
                aria-label={`${trainer.name}, ${trainer.city}, da ${price} a seduta, ${ratingLabel}`}
                className="flex flex-col rounded-[28px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
                <span className="relative block aspect-square overflow-hidden rounded-[28px] bg-card">
                    {trainer.photoUrl ? (
                        <img
                            src={trainer.photoUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                        />
                    ) : (
                        <span
                            aria-hidden="true"
                            className="flex size-full items-center justify-center text-6xl font-bold tracking-[-0.045em] text-muted-foreground/40"
                        >
                            {getInitials(trainer.name)}
                        </span>
                    )}
                    {isNew && (
                        <span
                            className={cn(
                                'absolute rounded-full bg-chip-media font-semibold text-black',
                                small
                                    ? 'top-2.5 left-2.5 px-2.5 py-1.25 text-xs leading-3.5'
                                    : 'top-3 left-3 px-3 py-1.75 text-[13px] leading-4',
                            )}
                        >
                            Nuovo
                        </span>
                    )}
                </span>
                {/*
                 * Like Airbnb: the title is the name alone, with the rating
                 * on its right; the gray lines below say what and where;
                 * the price closes the card.
                 */}
                <span
                    className={cn(
                        'mt-3 flex items-baseline justify-between gap-2',
                        small
                            ? 'text-[15px] leading-5 lg:text-base lg:leading-5.5'
                            : 'text-base leading-5.5',
                    )}
                >
                    <span className="min-w-0 truncate font-semibold">
                        {trainer.name}
                    </span>
                    {rating && (
                        <span
                            className={cn(
                                'shrink-0 tabular-nums',
                                small ? 'text-[13px] lg:text-sm' : 'text-sm',
                            )}
                        >
                            ★ {rating.score}
                            {/* Small cards on phones: no room for the count. */}
                            <span
                                className={cn(
                                    'text-muted-foreground',
                                    small && 'max-lg:hidden',
                                )}
                            >
                                {' '}
                                ({rating.count})
                            </span>
                        </span>
                    )}
                </span>
                {discipline && (
                    <span className={cn('mt-0.5', line)}>{discipline}</span>
                )}
                <span className={cn('mt-0.5', line)}>
                    {trainer.city === 'Solo online'
                        ? trainer.city
                        : `${trainer.city} · ${trainingModeLabel(trainer.online)}`}
                </span>
                <span className={cn('mt-1.5', line)}>
                    <b className="font-semibold text-foreground tabular-nums">
                        {price}
                    </b>{' '}
                    / seduta
                </span>
            </Link>

            {favorite.canSave && (
                <button
                    type="button"
                    aria-pressed={favorite.pressed}
                    aria-label={`${favorite.pressed ? 'Togli dai preferiti' : 'Salva nei preferiti'}: ${trainer.name}`}
                    onClick={() => favorite.change(!favorite.pressed)}
                    className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <span className="flex size-9 items-center justify-center rounded-full bg-glass-media text-brand backdrop-blur-md">
                        <Heart
                            aria-hidden="true"
                            className={cn(
                                'size-5',
                                favorite.pressed && 'fill-current',
                            )}
                        />
                    </span>
                </button>
            )}
        </article>
    );
}
