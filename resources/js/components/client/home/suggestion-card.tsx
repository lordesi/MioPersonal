import { Link } from '@inertiajs/react';
import { Heart, Star } from 'lucide-react';
import { BuildingIcon } from '@/components/mp/icons';
import { useFavorite } from '@/hooks/use-favorite';
import { useInitials } from '@/hooks/use-initials';
import { formatPrice, formatRating } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { GymSummary, TrainerSummary } from '@/types';
import { hoverPrefetch } from '@/lib/prefetch';

type SuggestionCardProps =
    | { kind: 'trainer'; trainer: TrainerSummary; className?: string }
    | { kind: 'gym'; gym: GymSummary; className?: string };

type CardData = {
    slug: string;
    name: string;
    href: string;
    image: string | null;
    /** "Nuova", "Promo": top left on the photo. */
    badge: string | null;
    subtitle: string;
    /** "4,9 (128)" next to the name. */
    rating: string | null;
    /** The turquoise pill: how the trainer works, or what the gym offers. */
    pill: string;
    price: { amount: string; unit: string } | null;
    saved: boolean;
    ariaLabel: string;
};

/**
 * The compact ProfileCard of the client's "Home" ("Trainer consigliati",
 * "Palestre consigliate"): the photo fills the card, name and rating on one
 * line, the turquoise pill and the price at the bottom. The name is the link
 * and covers the card; the heart stays on top of it.
 */
export default function SuggestionCard(props: SuggestionCardProps) {
    const data =
        props.kind === 'trainer'
            ? trainerData(props.trainer)
            : gymData(props.gym);
    const favorite = useFavorite(data.slug, data.saved, props.kind);
    const getInitials = useInitials();

    return (
        <article
            className={cn(
                'group/card relative isolate flex aspect-3/4 min-w-0 flex-col justify-end overflow-hidden rounded-[29px] border border-white/10 bg-card text-foreground shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6)] transition-transform duration-200 has-[a:active]:scale-[0.985]',
                props.className,
            )}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(60%_42%_at_80%_14%,color-mix(in_srgb,var(--brand)_26%,transparent),transparent_72%),linear-gradient(165deg,color-mix(in_srgb,var(--brand)_14%,var(--secondary))_0%,var(--card)_55%,var(--background)_100%)]"
            >
                {data.image ? (
                    <img
                        src={data.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                    />
                ) : (
                    <span className="absolute inset-0 flex justify-center pt-[22%] opacity-15">
                        {props.kind === 'gym' ? (
                            <BuildingIcon
                                className="size-20"
                                strokeWidth={1.3}
                            />
                        ) : (
                            <span className="text-[72px] leading-none font-bold tracking-[-0.045em]">
                                {getInitials(data.name)}
                            </span>
                        )}
                    </span>
                )}
            </div>

            {data.badge && (
                <span className="pointer-events-none absolute top-3 left-3 z-10 inline-flex min-h-8.5 items-center rounded-full bg-brand px-3 text-xs font-semibold text-primary-foreground">
                    {data.badge}
                </span>
            )}

            {favorite.canSave && (
                <button
                    type="button"
                    aria-pressed={favorite.pressed}
                    aria-label={`${favorite.pressed ? 'Togli dai preferiti' : 'Salva nei preferiti'}: ${data.name}`}
                    onClick={() => favorite.change(!favorite.pressed)}
                    className="absolute top-3 right-3 z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-[#1c1c1cb8] text-foreground backdrop-blur-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:text-brand"
                >
                    <Heart
                        aria-hidden="true"
                        className={cn(
                            'size-4.5',
                            favorite.pressed && 'fill-current',
                        )}
                    />
                </button>
            )}

            <div className="flex flex-col bg-[linear-gradient(180deg,transparent_0,color-mix(in_srgb,var(--card)_72%,transparent)_10px,var(--card)_22px)] px-3 pt-3.5 pb-3">
                <div className="flex items-start gap-2">
                    <h3 className="min-w-0 flex-1 text-base leading-5 font-semibold tracking-[-0.31px]">
                        <Link
                            prefetch={hoverPrefetch}
                            href={data.href}
                            aria-label={data.ariaLabel}
                            className="block truncate outline-none after:absolute after:inset-0 after:rounded-[29px] focus-visible:after:outline-2 focus-visible:after:-outline-offset-3 focus-visible:after:outline-ring"
                        >
                            {data.name}
                        </Link>
                    </h3>
                    {data.rating && (
                        <span className="flex shrink-0 items-center gap-0.75 text-xs leading-5 font-semibold whitespace-nowrap tabular-nums">
                            <Star
                                aria-hidden="true"
                                className="size-3.5 fill-current text-brand"
                            />
                            {data.rating}
                        </span>
                    )}
                </div>
                <p className="mt-0.5 truncate text-xs leading-4 text-muted-foreground">
                    {data.subtitle}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex min-h-5 min-w-0 items-center truncate rounded-full bg-brand px-2 text-[11px] leading-3.25 font-semibold text-primary-foreground">
                        {data.pill}
                    </span>
                    {data.price && (
                        <p className="grid shrink-0 justify-items-end text-right">
                            <span className="text-[11px] leading-3.25 text-muted-foreground">
                                a partire da
                            </span>
                            <span className="flex items-baseline gap-0.5 whitespace-nowrap">
                                <strong className="text-base leading-5 font-bold tracking-[-0.31px] tabular-nums">
                                    {data.price.amount}
                                </strong>
                                <span className="text-xs text-muted-foreground">
                                    {data.price.unit}
                                </span>
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}

function trainerData(trainer: TrainerSummary): CardData {
    const price = formatPrice(trainer.priceFromCents);

    return {
        slug: trainer.slug,
        name: shortName(trainer.name),
        href: trainer.href,
        image: trainer.photoUrl ?? null,
        // No reviews yet: a new profile.
        badge: trainer.rating === null ? 'Nuovo' : null,
        subtitle: trainer.disciplines.slice(0, 2).join(' · ') || trainer.city,
        rating:
            trainer.rating === null
                ? null
                : `${formatRating(trainer.rating)} (${trainer.reviewCount})`,
        pill:
            trainer.online === 'only'
                ? 'Online'
                : trainer.online === 'also'
                  ? 'Anche online'
                  : 'In presenza',
        price: { amount: price, unit: '/seduta' },
        saved: trainer.favorite ?? false,
        ariaLabel: `${trainer.name}, ${trainer.city}, da ${price} a seduta`,
    };
}

function gymData(gym: GymSummary): CardData {
    return {
        slug: gym.slug,
        name: gym.name,
        href: gym.href,
        image: gym.coverUrl,
        badge: gym.promotion ? 'Promo' : null,
        subtitle: gym.amenities.slice(0, 2).join(' · ') || gym.address,
        rating: null,
        pill:
            gym.trainerCount > 0
                ? gym.trainerCount === 1
                    ? '1 trainer'
                    : `${gym.trainerCount} trainer`
                : gym.city,
        price:
            gym.monthlyFromCents === null
                ? null
                : { amount: formatPrice(gym.monthlyFromCents), unit: '/mese' },
        saved: gym.favorite ?? false,
        ariaLabel: `${gym.name}, ${gym.address}, ${gym.city}`,
    };
}

/** On one line at 16px: a long name becomes "Giulia M.". */
function shortName(full: string): string {
    const parts = full.trim().split(/\s+/);

    return full.length > 15 && parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
        : full;
}
