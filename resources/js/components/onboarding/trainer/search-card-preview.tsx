import { Check, Target, UserRound } from 'lucide-react';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    experienceOptions,
    minPriceCents,
    needsCity,
} from '@/components/onboarding/trainer/draft';
import { useInitials } from '@/hooks/use-initials';
import { formatPrice } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { CatalogOption } from '@/types';

type SearchCardPreviewProps = {
    draft: TrainerDraft;
    name: string;
    /** The new photo or the saved one; null shows the initials (or a placeholder). */
    photo: string | null;
    disciplines: CatalogOption[];
    cities: CatalogOption[];
    /** Step 2: the years of experience under the title. */
    experience?: boolean;
    /** Steps 3 and 7: online, cities, disciplines and goals. */
    search?: boolean;
    /** Step 7: the first session and the lowest price at the bottom. */
    price?: boolean;
    /** Step 2: an empty circle instead of the initials while there is no photo. */
    photoPlaceholder?: boolean;
};

/**
 * The trainer's card as the clients will see it in the search, inside the
 * black panel of steps 2, 3 and 7. What isn't written yet is in grey italics.
 */
export default function SearchCardPreview({
    draft,
    name,
    photo,
    disciplines,
    cities,
    experience = false,
    search = false,
    price = false,
    photoPlaceholder = false,
}: SearchCardPreviewProps) {
    const getInitials = useInitials();
    const nameOf = (options: CatalogOption[], value: string) =>
        options.find((option) => option.value === value)?.label ?? value;

    const online = draft.places.includes('online');
    const onlineOnly = online && !needsCity(draft);
    const cityNames = [draft.city, ...draft.otherCities]
        .filter((slug) => slug !== '')
        .map((slug) => nameOf(cities, slug));
    const goals = trainingGoals
        .filter((goal) => draft.goals.includes(goal.value))
        .map((goal) => goal.label);
    const experienceLabel = experienceOptions.find(
        (option) => option.value === draft.experience,
    )?.label;
    const lowest = minPriceCents(draft);
    const first = draft.pricing.firstSession;

    return (
        <div className="overflow-hidden rounded-[18px] bg-card text-card-foreground">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-sidebar-accent">
                {photo ? (
                    <img
                        src={photo}
                        alt=""
                        className="size-full object-cover"
                    />
                ) : photoPlaceholder ? (
                    <span className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <UserRound aria-hidden="true" className="size-7" />
                        <span className="text-xs font-semibold">
                            La tua foto
                        </span>
                    </span>
                ) : (
                    <span className="text-[40px] leading-11 font-bold tracking-[-0.03em] text-sidebar-foreground">
                        {getInitials(name)}
                    </span>
                )}
                {search && online && (
                    <span className="absolute top-2.5 left-2.5 inline-flex h-6.5 items-center rounded-full bg-card px-2.5 text-xs font-semibold">
                        {onlineOnly ? 'Solo online' : 'Anche online'}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2 px-4 pt-3.5 pb-4">
                <div className="flex justify-between gap-2">
                    <span className="text-base leading-5.5 font-semibold">
                        {name || 'Il tuo nome'}
                    </span>
                    <span className="inline-flex h-5.5 flex-none items-center rounded-full border px-2 text-[11px] font-semibold">
                        Nuovo
                    </span>
                </div>

                <Line filled={draft.headline.trim() !== ''} strong>
                    {draft.headline.trim() || 'Il tuo titolo comparirà qui'}
                </Line>

                {experience && (
                    <Line filled={experienceLabel !== undefined}>
                        {experienceLabel
                            ? `${experienceLabel} di esperienza`
                            : 'Anni di esperienza'}
                    </Line>
                )}

                {search && (
                    <>
                        <Line filled={onlineOnly || cityNames.length > 0}>
                            {onlineOnly
                                ? 'Solo online'
                                : cityNames.join(' · ') || 'Nessuna città'}
                        </Line>
                        {draft.disciplines.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {draft.disciplines.slice(0, 3).map((slug) => (
                                    <span
                                        key={slug}
                                        className="inline-flex h-6 items-center rounded-full bg-secondary px-2.25 text-xs font-medium"
                                    >
                                        {nameOf(disciplines, slug)}
                                    </span>
                                ))}
                            </div>
                        )}
                        {goals.length > 0 && (
                            <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <Target
                                    aria-hidden="true"
                                    className="mt-0.5 size-3.25 flex-none"
                                />
                                {goals.join(' · ')}
                            </span>
                        )}
                    </>
                )}

                {price && (
                    <div className="flex items-baseline justify-between gap-2 border-t pt-2.5 tabular-nums">
                        <span className="text-xs font-semibold text-muted-foreground">
                            {first.enabled &&
                                (first.priceCents === 0
                                    ? 'Prima seduta gratuita'
                                    : first.priceCents !== null &&
                                      `Prima seduta a ${formatPrice(first.priceCents)}`)}
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                            da{' '}
                            <span className="text-lg font-bold text-foreground">
                                {lowest === null ? '—' : formatPrice(lowest)}
                            </span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/** A line of the card: grey italics until the trainer writes it. */
function Line({
    filled,
    strong = false,
    children,
}: {
    filled: boolean;
    strong?: boolean;
    children: string;
}) {
    return (
        <span
            className={cn(
                'text-[13px] leading-4.5 break-words',
                !filled
                    ? 'text-muted-foreground italic'
                    : strong
                      ? 'text-foreground/80'
                      : 'text-muted-foreground',
            )}
        >
            {children}
        </span>
    );
}

export type PanelCheck = { label: string; done: boolean; hint?: string };

/** What is done in the step, ✓ or a dashed circle, in the black panel. */
export function PanelChecklist({
    checks,
    className,
}: {
    checks: PanelCheck[];
    className?: string;
}) {
    return (
        <ul className={cn('flex flex-col gap-2.5', className)}>
            {checks.map((check) => (
                <li
                    key={check.label}
                    className="flex items-start gap-2.5 text-sm"
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'flex size-5 flex-none items-center justify-center rounded-full',
                            check.done
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                : 'border-[1.5px] border-dashed border-muted-foreground text-transparent',
                        )}
                    >
                        <Check strokeWidth={3.5} className="size-2.75" />
                    </span>
                    <span className="flex flex-col">
                        <span
                            className={cn(
                                check.done
                                    ? 'text-sidebar-foreground/90'
                                    : 'font-semibold text-sidebar-primary',
                            )}
                        >
                            {check.label}
                            <span className="sr-only">
                                {check.done ? ': fatto' : ': da fare'}
                            </span>
                        </span>
                        {check.hint && (
                            <span className="text-xs text-sidebar-muted-foreground">
                                {check.hint}
                            </span>
                        )}
                    </span>
                </li>
            ))}
        </ul>
    );
}
