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
 * vertical: always a vertical card (home "Trainer in evidenza" carousel).
 */
const layouts = {
    responsive: {
        link: 'gap-3 p-3 md:flex-col md:gap-0 md:p-0',
        photo: 'size-22 rounded-lg text-2xl md:aspect-4/3 md:size-auto md:w-full md:rounded-none md:text-[40px] md:leading-11',
        onlineOnPhoto: 'hidden md:block',
        body: 'gap-1.5 md:gap-3 md:p-4',
        zoneUnderName: 'hidden md:flex',
        zoneRow: 'flex md:hidden',
        shortRating: 'md:hidden',
        fullRating: 'hidden md:flex',
        slotShort: 'md:hidden',
        slotLong: 'hidden md:inline',
        priceRow: 'md:mt-auto md:border-t md:pt-3',
        onlineInPriceRow: 'md:hidden',
        favorite: 'top-1 left-1 md:top-2.5 md:right-2.5 md:left-auto',
    },
    vertical: {
        link: 'flex-col',
        photo: 'h-45 w-full text-4xl md:aspect-4/3 md:h-auto md:text-[40px] md:leading-11',
        onlineOnPhoto: 'block',
        body: 'gap-2.5 p-3.5 md:gap-3 md:p-4',
        zoneUnderName: 'flex',
        zoneRow: 'hidden',
        shortRating: 'hidden',
        fullRating: 'flex',
        slotShort: 'hidden',
        slotLong: 'inline',
        priceRow: 'mt-auto border-t pt-2.5 md:pt-3',
        onlineInPriceRow: 'hidden',
        favorite: 'top-2.5 right-2.5',
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

function OnlineBadge({ online }: { online: 'also' | 'only' }) {
    return (
        <Badge variant="outline" className={cn(pill, 'gap-1 bg-background')}>
            <Video aria-hidden="true" />
            {online === 'also' ? 'Anche online' : 'Solo online'}
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

    const zone = (
        <>
            <MapPin aria-hidden="true" className="size-3.5" />
            {trainer.zone}
        </>
    );

    return (
        <div className={cn('relative', className)}>
            <Link
                href={trainer.href}
                aria-label={`${trainer.name}, ${trainer.zone}, da ${price} a seduta`}
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
                    {trainer.online && (
                        <span
                            className={cn(
                                'absolute top-3 left-3',
                                styles.onlineOnPhoto,
                            )}
                        >
                            <OnlineBadge online={trainer.online} />
                        </span>
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

                    <span className="flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold tabular-nums">
                        <Clock aria-hidden="true" className="size-3.5" />
                        <span>
                            <span className={styles.slotShort}>
                                Primo slot:
                            </span>
                            <span className={styles.slotLong}>
                                Primo slot libero:
                            </span>{' '}
                            {trainer.nextSlotLabel}
                        </span>
                    </span>

                    <span
                        className={cn(
                            'flex flex-wrap items-center justify-between gap-2',
                            styles.priceRow,
                        )}
                    >
                        <span className="flex items-baseline gap-1 whitespace-nowrap tabular-nums">
                            <span className="text-xs text-muted-foreground">
                                da
                            </span>
                            <span className="text-lg leading-7 font-bold tracking-tight md:text-xl">
                                {price}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                / seduta
                            </span>
                        </span>
                        {trainer.online && (
                            <span className={styles.onlineInPriceRow}>
                                <OnlineBadge online={trainer.online} />
                            </span>
                        )}
                        <span className="hidden h-8 items-center rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs md:inline-flex">
                            Vedi profilo
                        </span>
                    </span>
                </span>
            </Link>

            {favorite && (
                <FavoriteButton
                    trainerName={trainer.name}
                    pressed={favorite.pressed}
                    onPressedChange={favorite.onPressedChange}
                    className={cn('absolute', styles.favorite)}
                />
            )}
        </div>
    );
}
