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
import { formatPrice, formatUntilDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    GymPlanSummary,
    GymProfileData,
    GymPromotionSummary,
} from '@/types';

/*
 * The blocks of the public page of a gym, in the dark design of the trainer
 * profile: turquoise rings and outlines, #1c1c1c cards.
 */

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
            <p className="text-[15px] text-muted-foreground">
                Orari non indicati: contatta la palestra.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <OpenBadge openNow={openNow} />
            <dl className="flex flex-col divide-y divide-separator">
                {hours.map((day) => (
                    <div
                        key={day.day}
                        className={cn(
                            'flex justify-between gap-4 py-2.5 text-[15px]',
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

/** "Aperta ora" in turquoise, "Chiusa ora" in grey. */
export function OpenBadge({ openNow }: { openNow: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex h-7 w-fit items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold',
                openNow
                    ? 'text-brand shadow-[inset_0_0_0_1px_var(--brand)]'
                    : 'text-muted-foreground shadow-[inset_0_0_0_1px_var(--field)]',
            )}
        >
            <Clock aria-hidden="true" className="size-3.5" />
            {openNow ? 'Aperta ora' : 'Chiusa ora'}
        </span>
    );
}

/** "Abbonamenti": price, period and what each plan includes. */
export function GymPlans({ plans }: { plans: GymPlanSummary[] }) {
    return (
        <ul className="grid gap-2 sm:grid-cols-2 md:gap-4">
            {plans.map((plan) => (
                <li
                    key={plan.id}
                    className="flex flex-col gap-3 rounded-[26px] bg-card p-5"
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold tracking-[0.06em] text-brand uppercase">
                            {plan.period}
                        </span>
                        <h3 className="text-[17px] leading-6 font-semibold">
                            {plan.name}
                        </h3>
                    </div>
                    <p className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-[28px] leading-8.5 font-bold tabular-nums">
                            {formatPrice(plan.priceCents)}
                        </span>
                        <span className="text-[15px] text-muted-foreground">
                            {plan.suffix}
                        </span>
                        {plan.monthlyCents !== null && (
                            <span className="w-full text-[13px] text-muted-foreground">
                                pari a {formatPrice(plan.monthlyCents)}/mese
                            </span>
                        )}
                    </p>
                    {plan.features.length > 0 && (
                        <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-[15px]">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex gap-2">
                                    <Check
                                        aria-hidden="true"
                                        strokeWidth={2.5}
                                        className="mt-0.5 size-4 shrink-0 text-brand"
                                    />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    )}
                    {plan.note && (
                        <p className="mt-auto text-[13px] text-muted-foreground">
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
        <ul className="flex flex-col gap-2 md:gap-3">
            {promotions.map((promotion) => {
                const price = promotionPrice(promotion);

                return (
                    <li
                        key={promotion.id}
                        className="flex flex-wrap items-start gap-3 rounded-[20px] border border-brand p-4 md:gap-4 md:p-5"
                    >
                        <span
                            aria-hidden="true"
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1px_var(--brand)] md:size-11 md:rounded-[14px]"
                        >
                            <Tag className="size-5" />
                        </span>
                        <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1">
                            <h3 className="text-[17px] leading-6 font-semibold">
                                {promotion.title}
                            </h3>
                            {promotion.description && (
                                <p className="text-[15px] text-muted-foreground">
                                    {promotion.description}
                                </p>
                            )}
                            <p className="text-[13px] text-muted-foreground">
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
                                <span className="text-[28px] leading-8.5 font-bold text-brand tabular-nums">
                                    {price}
                                </span>
                                {promotion.promoPriceCents !== null &&
                                    promotion.planPriceCents !== null && (
                                        <span className="text-sm text-muted-foreground tabular-nums line-through">
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

/**
 * "Servizi": the ones the gym told with a photo or a description as cards
 * (e.g. the Turkish bath), the others as chips.
 */
export function GymAmenities({
    amenities,
}: {
    amenities: GymProfileData['amenities'];
}) {
    const detailed = amenities.filter(
        (amenity) => amenity.description || amenity.photoUrl,
    );
    const others = amenities.filter(
        (amenity) => !amenity.description && !amenity.photoUrl,
    );

    return (
        <div className="flex flex-col gap-4">
            {detailed.length > 0 && (
                <ul className="grid gap-2 md:grid-cols-2 md:gap-4">
                    {detailed.map((amenity) => (
                        <li
                            key={amenity.value}
                            className="flex flex-col overflow-hidden rounded-[26px] bg-card"
                        >
                            {amenity.photoUrl && (
                                <img
                                    src={amenity.photoUrl}
                                    alt={amenity.label}
                                    loading="lazy"
                                    className="aspect-16/9 w-full object-cover"
                                />
                            )}
                            <div className="flex flex-col gap-1.5 p-5">
                                <h3 className="flex items-center gap-1.5 text-[17px] font-semibold">
                                    <Check
                                        aria-hidden="true"
                                        strokeWidth={2.5}
                                        className="size-4 text-brand"
                                    />
                                    {amenity.label}
                                </h3>
                                {amenity.description && (
                                    <p className="text-[15px] leading-5.5 break-words whitespace-pre-line text-muted-foreground">
                                        {amenity.description}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {others.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {others.map((amenity) => (
                        <li
                            key={amenity.value}
                            className="flex h-9 items-center gap-1.5 rounded-full border border-field px-3.5 text-[15px]"
                        >
                            <Check
                                aria-hidden="true"
                                strokeWidth={2.5}
                                className="size-4 text-brand"
                            />
                            {amenity.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/** The links of the contacts: phone, email, site, Instagram. */
export function contactRows(contacts: GymProfileData['contacts']) {
    return [
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
    const rows = contactRows(contacts);

    return (
        <div className="flex flex-col gap-4 rounded-[26px] bg-card p-5">
            <div className="flex gap-3">
                <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                >
                    <MapPin className="size-5" />
                </span>
                <div className="flex min-w-0 flex-col items-start gap-2">
                    <p className="pt-1.5 text-[15px] leading-6">{address}</p>
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-brand h-10 px-4 text-[15px]"
                    >
                        Apri in Google Maps
                        <ExternalLink aria-hidden="true" className="size-4" />
                    </a>
                </div>
            </div>
            {rows.length > 0 && (
                <ContactLinks
                    rows={rows}
                    className="border-t border-border pt-4"
                />
            )}
        </div>
    );
}

/** The list of phone, email, site and Instagram. */
export function ContactLinks({
    rows,
    className,
}: {
    rows: ReturnType<typeof contactRows>;
    className?: string;
}) {
    return (
        <ul className={cn('flex flex-col gap-1', className)}>
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
                        className="flex min-h-10 items-center gap-3 text-[15px] break-all outline-none hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <row.icon
                            aria-hidden="true"
                            className="size-4.5 shrink-0 text-brand"
                        />
                        {row.label}
                    </a>
                </li>
            ))}
        </ul>
    );
}
