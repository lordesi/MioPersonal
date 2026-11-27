import { Link } from '@inertiajs/react';
import { Building2, Dumbbell, Flag, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import { courseSearchUrl } from '@/lib/course';
import { useFeatures, withFeatures } from '@/lib/features';
import type { FeatureName } from '@/lib/features';
import { gymSearchUrl } from '@/lib/gym';
import { hoverPrefetch } from '@/lib/prefetch';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { search as eventsSearch } from '@/routes/events';

type Category = {
    value: SearchKind;
    label: string;
    icon: LucideIcon;
    feature?: FeatureName;
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
        url: (city) => gymSearchUrl({}, city),
    },
    {
        value: 'course',
        label: 'Corsi',
        icon: Users,
        feature: 'courses',
        url: (city) => courseSearchUrl({}, city),
    },
    {
        value: 'event',
        label: 'Eventi',
        icon: Flag,
        feature: 'events',
        url: (city) => eventsSearch.url(city ? { city } : undefined),
    },
];

type CategoryNavProps = {
    current: SearchKind | null;
    /** The other searches open in the same city. */
    city?: string | null;
    className?: string;
};

/**
 * "Trainer · Palestre · Corsi · Eventi" (design "CategoryNav"): an icon in a
 * box, turquoise on the current one, and the name underlined. Only the
 * categories switched on (lib/features.ts): with the trainers alone there is
 * nothing to switch to, and nothing shows.
 */
export default function CategoryNav({
    current,
    city = null,
    className,
}: CategoryNavProps) {
    const shown = withFeatures(categories, useFeatures());

    if (shown.length < 2) {
        return null;
    }

    return (
        <nav
            aria-label="Categoria"
            className={cn(
                'grid auto-cols-fr grid-flow-col md:auto-cols-[96px]',
                className,
            )}
        >
            {shown.map((category) => {
                const href = category.url(city);
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
