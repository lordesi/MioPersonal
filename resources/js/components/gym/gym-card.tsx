import { Link } from '@inertiajs/react';
import { Building2, MapPin, Tag, Users } from 'lucide-react';
import FavoriteButton from '@/components/shared/favorite-button';
import { Badge } from '@/components/ui/badge';
import { useFavorite } from '@/hooks/use-favorite';
import { monthlyLabel } from '@/lib/gym';
import { cn } from '@/lib/utils';
import type { GymSummary } from '@/types';

const pill = 'h-5.5 rounded-full px-2 text-xs font-medium';

/*
 * Classes for each layout, written out in full so Tailwind can find them.
 * results: search page and "Palestre". On phones a short row (small cover on
 * the left, one line of services) so more gyms fit on screen; from sm up a tile.
 * tile: home carousel, always the tile (cover on top), like TrainerCard.
 */
const layouts = {
    results: {
        root: 'rounded-2xl sm:rounded-[20px]',
        link: 'flex-row rounded-2xl sm:flex-col sm:rounded-[20px]',
        cover: 'min-h-28 w-28 sm:aspect-16/10 sm:min-h-0 sm:w-full',
        promoBadge:
            'bottom-2 left-2 h-6 px-2 sm:top-3 sm:bottom-auto sm:left-3 sm:h-7 sm:px-2.5',
        promoLabel: 'hidden sm:inline',
        body: 'gap-1.5 p-3 sm:gap-2.5 sm:p-4',
        heading: 'gap-0.5 sm:gap-1',
        name: 'text-base leading-5.5 sm:text-[17px] sm:leading-6',
        amenities: 'max-h-5.5 overflow-hidden sm:max-h-none',
        promotion: 'hidden sm:block',
        priceRow: 'pt-2 sm:pt-3',
        price: 'text-[15px] sm:text-lg',
        favorite:
            'top-2 left-2 size-8 sm:top-2.5 sm:right-2.5 sm:left-auto sm:size-10 md:size-10',
    },
    tile: {
        root: 'rounded-[20px]',
        link: 'flex-col rounded-[20px]',
        cover: 'aspect-16/10 w-full',
        promoBadge: 'top-3 left-3 h-7 px-2.5',
        promoLabel: '',
        body: 'gap-2.5 p-4',
        heading: 'gap-1',
        name: 'text-[17px] leading-6',
        amenities: '',
        promotion: '',
        priceRow: 'pt-3',
        price: 'text-lg',
        favorite: 'top-2.5 right-2.5 size-10 md:size-10',
    },
};

type GymCardProps = {
    gym: GymSummary;
    /** The heart: missing for trainers, gyms and admins, who have no favorites. */
    favorite?: {
        pressed: boolean;
        onPressedChange: (pressed: boolean) => void;
    };
    /** See `layouts` above. */
    layout?: keyof typeof layouts;
    className?: string;
};

/**
 * A gym in the search results, in "Palestre" and in the home: the cover, name
 * and city, the first services, "da X €/mese", trainers and the promotion of
 * today. Same shape as TrainerCard, heart included.
 */
export default function GymCard({
    gym,
    favorite,
    layout = 'results',
    className,
}: GymCardProps) {
    const price = monthlyLabel(gym.monthlyFromCents);
    const more = gym.amenityCount - gym.amenities.length;
    const styles = layouts[layout];

    return (
        <div
            className={cn(
                'relative transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-xl',
                styles.root,
                className,
            )}
        >
            <Link
                href={gym.href}
                aria-label={[
                    gym.name,
                    gym.city,
                    price,
                    gym.promotion && `promozione: ${gym.promotion}`,
                ]
                    .filter(Boolean)
                    .join(', ')}
                className={cn(
                    'flex h-full overflow-hidden border bg-card text-foreground',
                    styles.link,
                )}
            >
                <span
                    className={cn(
                        'relative flex shrink-0 items-center justify-center overflow-hidden bg-primary text-primary-foreground',
                        styles.cover,
                    )}
                >
                    {gym.coverUrl ? (
                        <img
                            src={gym.coverUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                        />
                    ) : (
                        <Building2 aria-hidden="true" className="size-8" />
                    )}
                    {gym.promotion && (
                        <Badge
                            className={cn(
                                'absolute gap-1 border-transparent bg-background font-semibold text-foreground [&>svg]:size-3.25',
                                styles.promoBadge,
                            )}
                        >
                            <Tag aria-hidden="true" />
                            <span className={styles.promoLabel}>Promo</span>
                        </Badge>
                    )}
                </span>

                <span
                    className={cn('flex min-w-0 flex-1 flex-col', styles.body)}
                >
                    <span
                        className={cn('flex min-w-0 flex-col', styles.heading)}
                    >
                        <span
                            className={cn(
                                'truncate font-semibold',
                                styles.name,
                            )}
                        >
                            {gym.name}
                        </span>
                        <span className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                            <MapPin
                                aria-hidden="true"
                                className="size-3.5 shrink-0"
                            />
                            <span className="truncate">
                                {gym.address}, {gym.city}
                            </span>
                        </span>
                    </span>

                    {gym.amenities.length > 0 && (
                        <span
                            className={cn(
                                'flex flex-wrap gap-1.5',
                                styles.amenities,
                            )}
                        >
                            {gym.amenities.map((amenity) => (
                                <Badge
                                    key={amenity}
                                    variant="secondary"
                                    className={cn(pill, 'border-transparent')}
                                >
                                    {amenity}
                                </Badge>
                            ))}
                            {more > 0 && (
                                <Badge
                                    variant="outline"
                                    className={cn(pill, 'font-semibold')}
                                >
                                    +{more}
                                </Badge>
                            )}
                        </span>
                    )}

                    {gym.promotion && (
                        <span
                            className={cn(
                                'truncate text-sm font-medium',
                                styles.promotion,
                            )}
                        >
                            {gym.promotion}
                        </span>
                    )}

                    <span
                        className={cn(
                            'mt-auto flex items-center justify-between gap-2 border-t',
                            styles.priceRow,
                        )}
                    >
                        <span
                            className={cn(
                                'leading-6 font-bold tracking-[-0.01em]',
                                styles.price,
                            )}
                        >
                            {price ?? (
                                <span className="text-sm font-medium text-muted-foreground">
                                    Prezzi in palestra
                                </span>
                            )}
                        </span>
                        {gym.trainerCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Users
                                    aria-hidden="true"
                                    className="size-3.5"
                                />
                                {gym.trainerCount === 1
                                    ? '1 trainer'
                                    : `${gym.trainerCount} trainer`}
                            </span>
                        )}
                    </span>
                </span>
            </Link>

            {favorite && (
                <FavoriteButton
                    name={gym.name}
                    pressed={favorite.pressed}
                    onPressedChange={favorite.onPressedChange}
                    className={cn(
                        'absolute border-0 bg-background/90 hover:bg-background',
                        styles.favorite,
                    )}
                />
            )}
        </div>
    );
}

/** A GymCard with its own heart (home, "Palestre simili"): saved right away. */
export function SaveableGymCard({
    gym,
    layout,
    className,
}: Omit<GymCardProps, 'favorite'>) {
    const favorite = useFavorite(gym.slug, gym.favorite ?? false, 'gym');

    return (
        <GymCard
            gym={gym}
            layout={layout}
            className={className}
            favorite={
                favorite.canSave
                    ? {
                          pressed: favorite.pressed,
                          onPressedChange: favorite.change,
                      }
                    : undefined
            }
        />
    );
}
