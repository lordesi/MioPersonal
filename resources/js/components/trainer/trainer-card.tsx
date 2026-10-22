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
 * search: search results and the home "Trainer in evidenza" carousel, a dark
 * photo tile and the first free slot in a black pill; it lifts a little on hover.
 * vertical: client area.
 */
const layouts = {
    search: {
        root: 'rounded-[20px] transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-xl',
        link: 'flex-col rounded-[20px]',
        photo: 'aspect-4/3 w-full bg-primary text-[46px] leading-[50px] tracking-[-0.03em] text-primary-foreground',
        onlineBadge:
            'h-7 gap-1.5 border-transparent px-2.5 font-semibold [&>svg]:size-3.25',
        body: 'gap-2.5 p-4',
        heading: 'gap-1',
        name: 'text-[17px] leading-6',
        discipline: 'h-6.5 px-2.5',
        slotInPriceRow:
            'inline-flex h-7.5 gap-1.5 rounded-full bg-primary px-2.5 text-xs text-primary-foreground [&>svg]:size-3',
        priceRow: 'mt-auto border-t pt-3',
        price: 'text-[22px] leading-7 tracking-[-0.02em]',
        priceNote: 'text-xs',
        favorite:
            'top-2.5 right-2.5 size-10 border-0 bg-background/90 hover:bg-background md:size-10',
    },
    vertical: {
        root: '',
        link: 'flex-col rounded-xl',
        photo: 'h-45 w-full bg-muted text-4xl text-muted-foreground md:aspect-4/3 md:h-auto md:text-[40px] md:leading-11',
        onlineBadge: 'h-9 px-3',
        body: 'gap-2.5 p-3.5 md:gap-3 md:p-4',
        heading: 'gap-0.5',
        name: 'text-base md:text-lg md:leading-7',
        discipline: '',
        slotInPriceRow: 'inline-flex gap-1.5 text-[13px] leading-[18px]',
        priceRow: 'mt-auto border-t pt-2.5 md:pt-3',
        price: 'text-lg leading-7 md:text-xl',
        priceNote: 'text-xs',
        favorite: 'top-3 right-3 md:size-9',
    },
} as const;

type TrainerCardProps = {
    trainer: TrainerSummary;
    /** See `layouts` above. */
    layout?: keyof typeof layouts;
    /** Show the heart button (search results, home). */
    favorite?: {
        pressed: boolean;
        onPressedChange: (pressed: boolean) => void;
    };
    className?: string;
};

const pill = 'h-5.5 rounded-full px-2 text-xs font-medium';

const onlineLabels = { also: 'Anche online', only: 'Solo online' } as const;

export default function TrainerCard({
    trainer,
    layout = 'search',
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

    return (
        <div className={cn('relative', styles.root, className)}>
            <Link
                href={trainer.href}
                aria-label={`${trainer.name}, ${trainer.city}, ${online}da ${price} a seduta`}
                className={cn(
                    'flex h-full overflow-hidden border bg-card text-foreground',
                    styles.link,
                )}
            >
                <span
                    className={cn(
                        'relative flex shrink-0 items-center justify-center overflow-hidden font-bold tracking-tight',
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
                        <span
                            className={cn(
                                'flex min-w-0 flex-col',
                                styles.heading,
                            )}
                        >
                            <span className={cn('font-semibold', styles.name)}>
                                {trainer.name}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin
                                    aria-hidden="true"
                                    className="size-3.5"
                                />
                                {trainer.city}
                            </span>
                        </span>
                        {trainer.rating === null ? (
                            <Badge
                                variant="outline"
                                className={cn(pill, 'font-semibold')}
                            >
                                Nuovo
                            </Badge>
                        ) : (
                            <RatingSummary
                                rating={trainer.rating}
                                reviewCount={trainer.reviewCount}
                            />
                        )}
                    </span>

                    <span className="flex flex-wrap gap-1.5">
                        {trainer.disciplines.map((discipline) => (
                            <Badge
                                key={discipline}
                                variant="secondary"
                                className={cn(
                                    pill,
                                    'border-transparent',
                                    styles.discipline,
                                )}
                            >
                                {discipline}
                            </Badge>
                        ))}
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
                        <span
                            className={cn(
                                'items-center font-semibold whitespace-nowrap tabular-nums [&>svg]:size-3.5',
                                styles.slotInPriceRow,
                            )}
                        >
                            <Clock aria-hidden="true" />
                            {slot}
                        </span>
                    </span>
                </span>
            </Link>

            {/*
             * On the photo, outside the link like the heart: both measured from
             * the card edge, so they line up.
             * Hidden from screen readers: the link's name already says it.
             */}
            {trainer.online && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3 left-3"
                >
                    <Badge
                        variant="outline"
                        className={cn(
                            pill,
                            'gap-1 bg-background',
                            styles.onlineBadge,
                        )}
                    >
                        <Video />
                        {onlineLabels[trainer.online]}
                    </Badge>
                </span>
            )}

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
