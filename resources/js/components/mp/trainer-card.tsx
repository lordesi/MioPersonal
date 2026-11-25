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
    /** The fixed width of the rows that scroll sideways (250px); in a grid it fills the cell. */
    rail?: boolean;
    /** Two cards side by side on phones ("Preferiti"): smaller text. */
    size?: 'md' | 'sm';
    className?: string;
};

/**
 * The card of a trainer (design "TrainerCard", Home F): the square photo
 * with the first free slot and the heart, then name and discipline, city and
 * mode, price and rating. The whole card is the link; the heart (guests and
 * clients only) sits on top of it.
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
    const rating =
        trainer.rating === null ? 'Nuovo' : `★ ${formatRating(trainer.rating)}`;

    return (
        <article
            className={cn(
                'group/card relative flex min-w-0 flex-col',
                rail && 'w-62.5 shrink-0',
                className,
            )}
        >
            <Link
                prefetch={hoverPrefetch}
                href={trainer.href}
                aria-label={`${trainer.name}, ${trainer.city}, da ${price} a seduta`}
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
                    {trainer.nextSlotLabel && (
                        <span className="absolute top-3 left-3 max-w-[calc(100%-4.5rem)] truncate rounded-full bg-chip-media px-3 py-1.75 text-[13px] leading-4 font-semibold text-black">
                            Libero {trainer.nextSlotLabel}
                        </span>
                    )}
                </span>
                <span
                    className={cn(
                        'mt-3 truncate font-semibold',
                        small
                            ? 'text-[15px] leading-5 lg:text-[17px] lg:leading-5.5'
                            : 'text-[17px] leading-5.5',
                    )}
                >
                    {discipline
                        ? `${trainer.name} · ${discipline}`
                        : trainer.name}
                </span>
                <span
                    className={cn(
                        'mt-0.5 truncate text-muted-foreground',
                        small
                            ? 'text-[13px] leading-4.5 lg:text-[15px] lg:leading-5'
                            : 'text-[15px] leading-5',
                    )}
                >
                    {trainer.city === 'Solo online'
                        ? trainer.city
                        : `${trainer.city} · ${trainingModeLabel(trainer.online)}`}
                </span>
                <span
                    className={cn(
                        'mt-0.5 truncate text-muted-foreground',
                        small
                            ? 'text-[13px] leading-4.5 lg:text-[15px] lg:leading-5'
                            : 'text-[15px] leading-5',
                    )}
                >
                    <b className="font-semibold text-foreground">{price}</b> a
                    seduta · {rating}
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
