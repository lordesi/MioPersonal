import { Link } from '@inertiajs/react';
import { Clock, MapPin, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FavoriteButton from '@/components/shared/favorite-button';
import RatingSummary from '@/components/trainer/rating-summary';
import { useInitials } from '@/hooks/use-initials';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerSummary } from '@/types';

/*
 * Classes for each layout, written out in full so Tailwind can find them.
 * responsive: compact row below md (search results), vertical card from md.
 * vertical: always a vertical card (client area).
 * featured: vertical card with the first free slot on its own row and a
 * bigger price (home "Trainer in evidenza" carousel).
 */
const layouts = {
    responsive: {
        link: 'gap-3 p-3 md:flex-col md:gap-0 md:p-0',
        photo: 'size-22 rounded-lg text-2xl md:aspect-4/3 md:size-auto md:w-full md:rounded-none md:text-[40px] md:leading-11',
        onlineOnPhoto: 'hidden md:block',
        onlineBadge: 'h-9 px-3',
        body: 'gap-1.5 md:gap-3 md:p-4',
        zoneUnderName: 'hidden md:flex',
        zoneRow: 'flex md:hidden',
        shortRating: 'md:hidden',
        fullRating: 'hidden md:flex',
        slotRow: 'flex md:hidden',
        slotPrefix: 'Primo slot',
        slotInPriceRow: 'hidden md:inline-flex',
        priceRow: 'md:mt-auto md:border-t md:pt-3',
        price: 'text-lg leading-7 md:text-xl',
        priceNote: 'text-xs',
        onlineInPriceRow: 'md:hidden',
        favorite: 'top-1 left-1 md:top-3 md:right-3 md:left-auto',
    },
    vertical: {
        link: 'flex-col',
        photo: 'h-45 w-full text-4xl md:aspect-4/3 md:h-auto md:text-[40px] md:leading-11',
        onlineOnPhoto: 'block',
        onlineBadge: 'h-9 px-3',
        body: 'gap-2.5 p-3.5 md:gap-3 md:p-4',
        zoneUnderName: 'flex',
        zoneRow: 'hidden',
        shortRating: 'hidden',
        fullRating: 'flex',
        slotRow: 'hidden',
        slotPrefix: 'Primo slot',
        slotInPriceRow: 'inline-flex',
        priceRow: 'mt-auto border-t pt-2.5 md:pt-3',
        price: 'text-lg leading-7 md:text-xl',
        priceNote: 'text-xs',
        onlineInPriceRow: 'hidden',
        favorite: 'top-3 right-3',
    },
    featured: {
        link: 'flex-col',
        photo: 'aspect-4/3 w-full text-[40px] leading-11',
        onlineOnPhoto: 'block',
        onlineBadge: 'h-6 px-2',
        body: 'gap-3 p-4',
        zoneUnderName: 'flex',
        zoneRow: 'hidden',
        shortRating: 'hidden',
        fullRating: 'flex',
        slotRow: 'flex',
        slotPrefix: 'Primo slot libero',
        slotInPriceRow: 'hidden',
        priceRow: 'mt-auto border-t pt-3',
        price: 'text-2xl leading-8',
        priceNote: 'text-[13px] leading-[18px]',
        onlineInPriceRow: 'hidden',
        favorite: 'top-3 right-3',
    },
} as const;

type TrainerCardProps = {
    trainer: TrainerSummary;
    /** See `layouts` above. */
    layout?: keyof typeof layouts;
    /** Show the heart button (search results). */
    favorite?: {
        pressed: boolean;
        onPressedChange: (pressed: boolean) => void;
    };
    className?: string;
};

const pill = 'h-5.5 rounded-full px-2 text-xs font-medium';

const onlineLabels = { also: 'Anche online', only: 'Solo online' } as const;

function OnlineBadge({
    online,
    className,
}: {
    online: 'also' | 'only';
    className?: string;
}) {
    return (
        <Badge
            variant="outline"
            className={cn(pill, 'gap-1 bg-background', className)}
        >
            <Video aria-hidden="true" />
            {onlineLabels[online]}
        </Badge>
    );
}

export default function TrainerCard({
    trainer,
    layout = 'responsive',
    favorite,
    className,
}: TrainerCardProps) {
    const getInitials = useInitials();
    const price = formatPrice(trainer.priceFromCents);
    const styles = layouts[layout];
    // "oggi 19:30" → "Oggi 19:30" when it stands alone, next to the price.
    const slot = trainer.nextSlotLabel
        ? trainer.nextSlotLabel.charAt(0).toUpperCase() +
          trainer.nextSlotLabel.slice(1)
        : 'Nessuno slot';
    const online = trainer.online ? `${onlineLabels[trainer.online]}, ` : '';

    const zone = (
        <>
            <MapPin aria-hidden="true" className="size-3.5" />
            {trainer.city}
        </>
    );

    return (
        <div className={cn('relative', className)}>
            <Link
                href={trainer.href}
                aria-label={`${trainer.name}, ${trainer.city}, ${online}da ${price} a seduta`}
                className={cn(
                    'flex h-full overflow-hidden rounded-xl border bg-card text-foreground',
                    styles.link,
                )}
            >
                <span
                    className={cn(
                        'relative flex shrink-0 items-center justify-center overflow-hidden bg-muted font-bold tracking-tight text-muted-foreground',
                        styles.photo,
                    )}
                >
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

                <span
                    className={cn('flex min-w-0 flex-1 flex-col', styles.body)}
                >
                    <span className="flex items-start justify-between gap-2">
                        <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-base font-semibold md:text-lg md:leading-7">
                                {trainer.name}
                            </span>
                            <span
                                className={cn(
                                    'items-center gap-1 text-sm text-muted-foreground',
                                    styles.zoneUnderName,
                                )}
                            >
                                {zone}
                            </span>
                        </span>
                        {trainer.rating === null ? (
                            <Badge variant="outline" className={pill}>
                                Nuovo
                            </Badge>
                        ) : (
                            <>
                                <RatingSummary
                                    rating={trainer.rating}
                                    className={styles.shortRating}
                                />
                                <RatingSummary
                                    rating={trainer.rating}
                                    reviewCount={trainer.reviewCount}
                                    className={styles.fullRating}
                                />
                            </>
                        )}
                    </span>

                    <span
                        className={cn(
                            'items-center gap-1 text-sm text-muted-foreground',
                            styles.zoneRow,
                        )}
                    >
                        {zone}
                    </span>

                    <span className="flex flex-wrap gap-1.5">
                        {trainer.disciplines.map((discipline) => (
                            <Badge
                                key={discipline}
                                variant="secondary"
                                className={cn(pill, 'border-transparent')}
                            >
                                {discipline}
                            </Badge>
                        ))}
                    </span>

                    <span
                        className={cn(
                            'items-center gap-1.5 text-[13px] leading-[18px] font-semibold tabular-nums',
                            styles.slotRow,
                        )}
                    >
                        <Clock aria-hidden="true" className="size-3.5" />
                        {trainer.nextSlotLabel
                            ? `${styles.slotPrefix}: ${trainer.nextSlotLabel}`
                            : 'Nessuno slot nei prossimi giorni'}
                    </span>

                    <span
                        className={cn(
                            'flex flex-wrap items-center justify-between gap-2',
                            styles.priceRow,
                        )}
                    >
                        <span className="flex items-baseline gap-1 whitespace-nowrap tabular-nums">
                            <span
                                className={cn(
                                    'text-muted-foreground',
                                    styles.priceNote,
                                )}
                            >
                                da
                            </span>
                            <span
                                className={cn(
                                    'font-bold tracking-tight',
                                    styles.price,
                                )}
                            >
                                {price}
                            </span>
                            <span
                                className={cn(
                                    'text-muted-foreground',
                                    styles.priceNote,
                                )}
                            >
                                / seduta
                            </span>
                        </span>
                        {trainer.online && (
                            <span className={styles.onlineInPriceRow}>
                                <OnlineBadge online={trainer.online} />
                            </span>
                        )}
                        <span
                            className={cn(
                                'items-center gap-1.5 text-[13px] leading-[18px] font-semibold tabular-nums',
                                styles.slotInPriceRow,
                            )}
                        >
                            <Clock aria-hidden="true" className="size-3.5" />
                            {slot}
                        </span>
                    </span>
                </span>
            </Link>

            {/*
             * On the photo, outside the link like the heart: both measured from
             * the card edge, 12px from the top, and as tall, so they line up.
             * Hidden from screen readers: the link's name already says it.
             */}
            {trainer.online && (
                <span
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute top-3 left-3',
                        styles.onlineOnPhoto,
                    )}
                >
                    <OnlineBadge
                        online={trainer.online}
                        className={styles.onlineBadge}
                    />
                </span>
            )}

            {favorite && (
                <FavoriteButton
                    trainerName={trainer.name}
                    pressed={favorite.pressed}
                    onPressedChange={favorite.onPressedChange}
                    className={cn('absolute md:size-9', styles.favorite)}
                />
            )}
        </div>
    );
}
