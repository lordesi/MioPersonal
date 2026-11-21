import { Link } from '@inertiajs/react';
import { ArrowUpRight, Heart, MapPin, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { BuildingIcon, DumbbellIcon } from '@/components/mp/icons';
import { hoverPrefetch } from '@/lib/prefetch';

export type CardStat = {
    value: ReactNode;
    label: string;
    /** A full turquoise star before the value: the rating. */
    star?: boolean;
};

export type ProfileCardProps = {
    /** Without a photo: trainer = initials, gym = a building, course = a barbell. */
    kind?: 'trainer' | 'gym' | 'course';
    name: string;
    href: string;
    image?: string | null;
    /** A short label on the photo, top left: "Nuovo", "Sab 14 nov". */
    badge?: string | null;
    /** Under the name: the disciplines and the city. */
    subtitle?: string | null;
    /** Under the name with a pin: the address of a gym or an event. */
    location?: string | null;
    /** From 1 to 3 numbers: value above, label below. */
    stats?: CardStat[];
    price?: { from?: string; amount: string; unit?: string } | null;
    cta: string;
    /** The heart: only for guests and clients. */
    favorite?: {
        pressed: boolean;
        onPressedChange: (pressed: boolean) => void;
    };
    /** For screen readers: the whole card in one sentence. */
    ariaLabel?: string;
    className?: string;
};

/**
 * The card of the dark pages (design system "ProfileCard"): the photo fills
 * the card, the text sits on a dark fade at the bottom. The name is the link
 * and covers the whole card; the heart and the button stay on top of it.
 */
export default function ProfileCard({
    kind = 'trainer',
    name,
    href,
    image,
    badge,
    subtitle,
    location,
    stats = [],
    price,
    cta,
    favorite,
    ariaLabel,
    className,
}: ProfileCardProps) {
    const getInitials = useInitials();

    return (
        <article
            className={cn(
                'group/card @container relative isolate flex aspect-3/4 min-w-0 flex-col justify-end overflow-hidden rounded-[38px] border border-white/10 bg-card text-foreground shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.75)] has-[a.card-link:active]:scale-[0.985]',
                className,
            )}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(60%_42%_at_80%_14%,color-mix(in_srgb,var(--brand)_26%,transparent),transparent_72%),linear-gradient(165deg,color-mix(in_srgb,var(--brand)_14%,var(--secondary))_0%,var(--card)_55%,var(--background)_100%)]"
            >
                {image ? (
                    <img
                        src={image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                    />
                ) : (
                    <span className="absolute inset-0 flex justify-center pt-[18%] opacity-15">
                        {kind === 'gym' ? (
                            <BuildingIcon
                                className="size-28"
                                strokeWidth={1.3}
                            />
                        ) : kind === 'course' ? (
                            <DumbbellIcon
                                className="size-28"
                                strokeWidth={1.3}
                            />
                        ) : (
                            <span className="text-[44cqi] leading-none font-bold tracking-[-0.045em]">
                                {getInitials(name)}
                            </span>
                        )}
                    </span>
                )}
            </div>

            {badge && (
                <span className="pointer-events-none absolute top-4 left-4 z-10 inline-flex min-h-6 items-center rounded-full bg-brand px-2.5 text-xs font-semibold text-primary-foreground">
                    {badge}
                </span>
            )}

            {favorite && (
                <button
                    type="button"
                    aria-pressed={favorite.pressed}
                    aria-label={`${favorite.pressed ? 'Togli dai preferiti' : 'Salva nei preferiti'}: ${name}`}
                    onClick={() => favorite.onPressedChange(!favorite.pressed)}
                    className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-[#1c1c1cb8] text-foreground backdrop-blur-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:text-brand"
                >
                    <Heart
                        aria-hidden="true"
                        className={cn(
                            'size-5',
                            favorite.pressed && 'fill-current',
                        )}
                    />
                </button>
            )}

            <div className="flex flex-col gap-2 bg-[linear-gradient(180deg,transparent_0,color-mix(in_srgb,var(--card)_82%,transparent)_64px,var(--card)_112px)] px-4 pt-18 pb-4">
                <div className="grid gap-0.5">
                    <h3 className="flex min-w-0 text-[22px] leading-7 font-bold tracking-[-0.26px]">
                        <Link
                            prefetch={hoverPrefetch}
                            href={href}
                            aria-label={ariaLabel}
                            className="card-link min-w-0 truncate outline-none after:absolute after:inset-0 after:rounded-[38px] focus-visible:after:outline-2 focus-visible:after:-outline-offset-3 focus-visible:after:outline-ring"
                        >
                            {name}
                        </Link>
                    </h3>
                    {(location || subtitle) && (
                        <p className="flex min-w-0 items-center gap-1.5 text-[15px] leading-5 tracking-[-0.23px] text-muted-foreground">
                            {location && (
                                <MapPin
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-brand"
                                />
                            )}
                            <span className="truncate">
                                {location ?? subtitle}
                            </span>
                        </p>
                    )}
                </div>

                {stats.length > 0 && (
                    <dl className="grid auto-cols-fr grid-flow-col py-0.5">
                        {stats.slice(0, 3).map((stat) => (
                            <div
                                key={stat.label}
                                className="flex min-w-0 flex-col-reverse items-center px-1 text-center not-first:border-l not-first:border-separator"
                            >
                                <dt className="max-w-full truncate text-xs text-muted-foreground">
                                    {stat.label}
                                </dt>
                                <dd className="flex items-center gap-1 text-[15px] leading-5 font-semibold tracking-[-0.23px] whitespace-nowrap tabular-nums">
                                    {stat.star && (
                                        <Star
                                            aria-hidden="true"
                                            className="size-4 fill-current text-brand"
                                        />
                                    )}
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}

                <div className="flex items-center justify-between gap-2 pt-0.5">
                    {price ? (
                        <p className="grid min-w-0">
                            {price.from && (
                                <span className="text-xs text-muted-foreground">
                                    {price.from}
                                </span>
                            )}
                            <span className="flex items-baseline gap-x-1 whitespace-nowrap">
                                <strong className="text-[22px] leading-7 font-bold tracking-[-0.26px] tabular-nums">
                                    {price.amount}
                                </strong>
                                {price.unit && (
                                    <span className="text-[13px] text-muted-foreground">
                                        {price.unit}
                                    </span>
                                )}
                            </span>
                        </p>
                    ) : (
                        <span />
                    )}
                    {/* Not a second link: the whole card already opens the page. */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none relative flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand pr-1 pl-4 text-[15px] font-semibold text-primary-foreground shadow-[0_8px_24px_0_rgba(66,215,217,0.28)] @[300px]:gap-3 @[300px]:pl-5"
                    >
                        {cta}
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground text-brand">
                            <ArrowUpRight
                                className="size-4.5"
                                strokeWidth={2.4}
                            />
                        </span>
                    </span>
                </div>
            </div>
        </article>
    );
}
