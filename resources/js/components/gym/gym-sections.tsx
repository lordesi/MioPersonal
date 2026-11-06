import {
    Check,
    Clock,
    ExternalLink,
    Globe,
    Instagram,
    Mail,
    MapPin,
    Phone,
    Tag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, formatUntilDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    GymPlanSummary,
    GymProfileData,
    GymPromotionSummary,
} from '@/types';

/** "Orari di apertura": the week, today in bold, "Aperta ora" on top. */
export function GymHours({
    hours,
    openNow,
    notes,
}: {
    hours: GymProfileData['hours'];
    openNow: boolean | null;
    notes: string | null;
}) {
    if (openNow === null) {
        return (
            <p className="text-sm text-muted-foreground">
                Orari non indicati: contatta la palestra.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <span
                className={cn(
                    'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                    openNow
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground',
                )}
            >
                <Clock aria-hidden="true" className="size-3.5" />
                {openNow ? 'Aperta ora' : 'Chiusa ora'}
            </span>
            <dl className="flex flex-col divide-y">
                {hours.map((day) => (
                    <div
                        key={day.day}
                        className={cn(
                            'flex justify-between gap-4 py-2 text-[15px]',
                            day.today && 'font-semibold',
                        )}
                    >
                        <dt>
                            {day.day}
                            {day.today && (
                                <span className="sr-only"> (oggi)</span>
                            )}
                        </dt>
                        <dd
                            className={cn(
                                'text-right tabular-nums',
                                day.ranges.length === 0 &&
                                    'text-muted-foreground',
                            )}
                        >
                            {day.ranges.length === 0
                                ? 'Chiusa'
                                : day.ranges.join(', ')}
                        </dd>
                    </div>
                ))}
            </dl>
            {notes && <p className="text-sm text-muted-foreground">{notes}</p>}
        </div>
    );
}

/** "Abbonamenti": price, period and what each plan includes. */
export function GymPlans({ plans }: { plans: GymPlanSummary[] }) {
    return (
        <ul className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
                <li
                    key={plan.id}
                    className="flex flex-col gap-3 rounded-2xl border p-4"
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                            {plan.period}
                        </span>
                        <h3 className="text-[17px] leading-6 font-semibold">
                            {plan.name}
                        </h3>
                    </div>
                    <p className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-[26px] leading-8 font-bold tracking-[-0.02em] tabular-nums">
                            {formatPrice(plan.priceCents)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {plan.suffix}
                        </span>
                        {plan.monthlyCents !== null && (
                            <span className="w-full text-xs text-muted-foreground">
                                pari a {formatPrice(plan.monthlyCents)}/mese
                            </span>
                        )}
                    </p>
                    {plan.features.length > 0 && (
                        <ul className="flex flex-col gap-1.5 text-sm">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex gap-2">
                                    <Check
                                        aria-hidden="true"
                                        strokeWidth={2.5}
                                        className="mt-0.5 size-4 shrink-0"
                                    />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    )}
                    {plan.note && (
                        <p className="mt-auto text-xs text-muted-foreground">
                            {plan.note}
                        </p>
                    )}
                </li>
            ))}
        </ul>
    );
}

/** The new price of a promotion, or the discount. */
function promotionPrice(promotion: GymPromotionSummary): string | null {
    if (promotion.promoPriceCents !== null) {
        return formatPrice(promotion.promoPriceCents);
    }

    if (promotion.discountPercent !== null) {
        return `-${promotion.discountPercent}%`;
    }

    return null;
}

/** "Promozioni": only the ones running today. */
export function GymPromotions({
    promotions,
}: {
    promotions: GymPromotionSummary[];
}) {
    return (
        <ul className="flex flex-col gap-3">
            {promotions.map((promotion) => {
                const price = promotionPrice(promotion);

                return (
                    <li
                        key={promotion.id}
                        className="flex flex-wrap items-start gap-4 rounded-2xl bg-primary p-4 text-primary-foreground md:p-5"
                    >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground text-primary">
                            <Tag aria-hidden="true" className="size-5" />
                        </span>
                        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                            <h3 className="text-[17px] leading-6 font-semibold">
                                {promotion.title}
                            </h3>
                            {promotion.description && (
                                <p className="text-sm text-primary-foreground/80">
                                    {promotion.description}
                                </p>
                            )}
                            <p className="text-xs text-primary-foreground/70">
                                {[
                                    promotion.planName &&
                                        `Su: ${promotion.planName}`,
                                    promotion.endsOn &&
                                        `Valida fino ${formatUntilDay(promotion.endsOn)}`,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                        {price && (
                            <div className="flex flex-col items-end">
                                <span className="text-[26px] leading-8 font-bold tabular-nums">
                                    {price}
                                </span>
                                {promotion.promoPriceCents !== null &&
                                    promotion.planPriceCents !== null && (
                                        <span className="text-sm text-primary-foreground/60 tabular-nums line-through">
                                            {formatPrice(
                                                promotion.planPriceCents,
                                            )}
                                            {promotion.planSuffix &&
                                                ` ${promotion.planSuffix}`}
                                        </span>
                                    )}
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

/** "Servizi": every amenity as a chip. */
export function GymAmenities({
    amenities,
}: {
    amenities: GymProfileData['amenities'];
}) {
    return (
        <ul className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
                <li key={amenity.value}>
                    <Badge
                        variant="secondary"
                        className="h-8 gap-1.5 rounded-full border-transparent px-3 text-sm font-medium"
                    >
                        <Check aria-hidden="true" strokeWidth={2.5} />
                        {amenity.label}
                    </Badge>
                </li>
            ))}
        </ul>
    );
}

/** "Dove si trova" and "Contatti": address with Google Maps, phone, email, site. */
export function GymContacts({
    address,
    mapsUrl,
    contacts,
}: {
    address: string;
    mapsUrl: string;
    contacts: GymProfileData['contacts'];
}) {
    const rows = [
        contacts.phone && {
            icon: Phone,
            label: contacts.phone,
            href: `tel:${contacts.phone.replace(/[^+\d]/g, '')}`,
        },
        contacts.email && {
            icon: Mail,
            label: contacts.email,
            href: `mailto:${contacts.email}`,
        },
        contacts.website && {
            icon: Globe,
            label: contacts.website.replace(/^https?:\/\/(www\.)?/, ''),
            href: contacts.website,
        },
        contacts.instagram &&
            contacts.instagramUrl && {
                icon: Instagram,
                label: `@${contacts.instagram}`,
                href: contacts.instagramUrl,
            },
    ].filter((row) => !!row);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <div className="flex flex-col gap-2">
                    <p className="text-[15px] leading-6">{address}</p>
                    <Button
                        asChild
                        variant="outline"
                        className="h-10 w-fit rounded-xl px-3.5 font-semibold"
                    >
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Apri in Google Maps
                            <ExternalLink aria-hidden="true" />
                        </a>
                    </Button>
                </div>
            </div>
            {rows.length > 0 && (
                <ul className="flex flex-col gap-2.5 border-t pt-4">
                    {rows.map((row) => (
                        <li key={row.href}>
                            <a
                                href={row.href}
                                {...(row.href.startsWith('http')
                                    ? {
                                          target: '_blank',
                                          rel: 'noopener noreferrer nofollow',
                                      }
                                    : {})}
                                className="flex items-center gap-3 text-[15px] break-all hover:underline"
                            >
                                <row.icon
                                    aria-hidden="true"
                                    className="size-4.5 shrink-0"
                                />
                                {row.label}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
