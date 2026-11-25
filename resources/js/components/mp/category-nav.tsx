import { Link } from '@inertiajs/react';
import { Building2, Dumbbell, Flag, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import { courseSearchUrl } from '@/lib/course';
import { useFeatures } from '@/lib/features';
import type { FeatureName } from '@/lib/features';
import { gymSearchUrl } from '@/lib/gym';
import { hoverPrefetch } from '@/lib/prefetch';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { comingSoon } from '@/routes';
import { search as eventsSearch } from '@/routes/events';

/** The address word of "In arrivo" for each category switched off. */
export type ComingSoonKind = 'palestre' | 'corsi' | 'eventi';

type Category = {
    value: SearchKind;
    label: string;
    icon: LucideIcon;
    feature?: FeatureName;
    soon?: ComingSoonKind;
    /** Its search, in the same city. */
    url: (city: string | null) => string;
};

export const categories: Category[] = [
    {
        value: 'trainer',
        label: 'Trainer',
        icon: Dumbbell,
        url: (city) => searchUrl({}, city),
    },
    {
        value: 'gym',
        label: 'Palestre',
        icon: Building2,
        feature: 'gyms',
        soon: 'palestre',
        url: (city) => gymSearchUrl({}, city),
    },
    {
        value: 'course',
        label: 'Corsi',
        icon: Users,
        feature: 'courses',
        soon: 'corsi',
        url: (city) => courseSearchUrl({}, city),
    },
    {
        value: 'event',
        label: 'Eventi',
        icon: Flag,
        feature: 'events',
        soon: 'eventi',
        url: (city) => eventsSearch.url(city ? { city } : undefined),
    },
];

/** The category of an "In arrivo" page. */
export const categoryOfSoon = (kind: ComingSoonKind) =>
    categories.find((category) => category.soon === kind) ?? categories[1];

type CategoryNavProps = {
    current: SearchKind | null;
    /** The other searches open in the same city. */
    city?: string | null;
    className?: string;
};

/**
 * "Trainer · Palestre · Corsi · Eventi" (design "CategoryNav"): an icon in a
 * box, turquoise on the current one, and the name underlined. A category
 * switched off (lib/features.ts) opens its "In arrivo" page.
 */
export default function CategoryNav({
    current,
    city = null,
    className,
}: CategoryNavProps) {
    const features = useFeatures();

    return (
        <nav
            aria-label="Categoria"
            className={cn(
                'grid grid-cols-4 md:grid-cols-[repeat(4,96px)]',
                className,
            )}
        >
            {categories.map((category) => {
                const on =
                    category.feature === undefined ||
                    features[category.feature];
                const href =
                    on || !category.soon
                        ? category.url(city)
                        : comingSoon.url(category.soon);
                const active = category.value === current;
                const Icon = category.icon;

                return (
                    <Link
                        key={category.value}
                        prefetch={hoverPrefetch}
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'flex min-w-0 flex-col items-center gap-1.5 rounded-[14px] pt-1.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active
                                ? 'font-semibold text-foreground'
                                : 'pb-1.75 font-medium text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-11 items-center justify-center rounded-[14px]',
                                active && 'bg-brand-soft text-brand',
                            )}
                        >
                            <Icon
                                aria-hidden="true"
                                className="size-6"
                                strokeWidth={1.8}
                            />
                        </span>
                        <span
                            className={cn(
                                'max-w-full truncate',
                                active && 'border-b-2 border-foreground pb-1.5',
                            )}
                        >
                            {category.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
