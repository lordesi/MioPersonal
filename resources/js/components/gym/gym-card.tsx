import { Link } from '@inertiajs/react';
import { Building2, MapPin, Tag, Users } from 'lucide-react';
import FavoriteButton from '@/components/shared/favorite-button';
import { Badge } from '@/components/ui/badge';
import { useFavorite } from '@/hooks/use-favorite';
import { monthlyLabel } from '@/lib/gym';
import { cn } from '@/lib/utils';
import type { GymSummary } from '@/types';

const pill = 'h-5.5 rounded-full px-2 text-xs font-medium';

type GymCardProps = {
    gym: GymSummary;
    /** The heart: missing for trainers, gyms and admins, who have no favorites. */
    favorite?: {
        pressed: boolean;
        onPressedChange: (pressed: boolean) => void;
    };
    className?: string;
};

/**
 * A gym in the search results and in "Palestre": the cover, name and city,
 * the first services, "da X €/mese", trainers and the promotion of today.
 * Same shape as TrainerCard (layout "results"), heart included.
 */
export default function GymCard({ gym, favorite, className }: GymCardProps) {
    const price = monthlyLabel(gym.monthlyFromCents);
    const more = gym.amenityCount - gym.amenities.length;

    return (
        <div
            className={cn(
                'relative rounded-2xl transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:rounded-[20px]',
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
                className="flex h-full flex-row overflow-hidden rounded-2xl border bg-card text-foreground sm:flex-col sm:rounded-[20px]"
            >
                <span className="relative flex min-h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-primary text-primary-foreground sm:aspect-16/10 sm:min-h-0 sm:w-full">
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
                        <Badge className="absolute bottom-2 left-2 h-6 gap-1 border-transparent bg-background px-2 font-semibold text-foreground sm:top-3 sm:bottom-auto sm:left-3 sm:h-7 sm:px-2.5 [&>svg]:size-3.25">
                            <Tag aria-hidden="true" />
                            <span className="hidden sm:inline">Promo</span>
                        </Badge>
                    )}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:gap-2.5 sm:p-4">
                    <span className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
                        <span className="truncate text-base leading-5.5 font-semibold sm:text-[17px] sm:leading-6">
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
                        <span className="flex max-h-5.5 flex-wrap gap-1.5 overflow-hidden sm:max-h-none">
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
                        <span className="hidden truncate text-sm font-medium sm:block">
                            {gym.promotion}
                        </span>
                    )}

                    <span className="mt-auto flex items-center justify-between gap-2 border-t pt-2 sm:pt-3">
                        <span className="text-[15px] leading-6 font-bold tracking-[-0.01em] sm:text-lg">
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
                    className="absolute top-2 left-2 size-8 border-0 bg-background/90 hover:bg-background sm:top-2.5 sm:right-2.5 sm:left-auto sm:size-10 md:size-10"
                />
            )}
        </div>
    );
}

/** A GymCard with its own heart (home, "Palestre simili"): saved right away. */
export function SaveableGymCard({
    gym,
    className,
}: Omit<GymCardProps, 'favorite'>) {
    const favorite = useFavorite(gym.slug, gym.favorite ?? false, 'gym');

    return (
        <GymCard
            gym={gym}
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
