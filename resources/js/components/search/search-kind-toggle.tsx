import { Link } from '@inertiajs/react';
import { Building2, CalendarDays, CalendarHeart, Dumbbell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { courseSearchUrl } from '@/lib/course';
import { useFeatures, withFeatures } from '@/lib/features';
import type { FeatureName } from '@/lib/features';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { search as eventsSearch } from '@/routes/events';
import { hoverPrefetch } from '@/lib/prefetch';

/** The four things to explore, always in this order. */
export type SearchKind = 'trainer' | 'gym' | 'course' | 'event';

type SearchKindItem = {
    value: SearchKind;
    label: string;
    /** In the header menu and the tabs: one word. */
    shortLabel: string;
    icon: LucideIcon;
    /** Hidden while that part of the site is off (lib/features.ts). */
    feature?: FeatureName;
};

export const searchKinds: SearchKindItem[] = [
    {
        value: 'trainer',
        label: 'Personal trainer',
        shortLabel: 'Trainer',
        icon: Dumbbell,
    },
    {
        value: 'gym',
        label: 'Palestre',
        shortLabel: 'Palestre',
        icon: Building2,
        feature: 'gyms',
    },
    {
        value: 'course',
        label: 'Corsi',
        shortLabel: 'Corsi',
        icon: CalendarDays,
        feature: 'courses',
    },
    {
        value: 'event',
        label: 'Eventi',
        shortLabel: 'Eventi',
        icon: CalendarHeart,
        feature: 'events',
    },
];

/**
 * The kinds switched on. With the trainers only there is nothing to
 * choose: the toggles and tabs are hidden.
 */
export function useSearchKinds(): SearchKindItem[] {
    return withFeatures(searchKinds, useFeatures());
}

/** The search of a kind, in a city or in all of Italy. */
export function searchKindUrl(kind: SearchKind, city?: string | null): string {
    switch (kind) {
        case 'trainer':
            return searchUrl({}, city);
        case 'gym':
            return gymSearchUrl({}, city);
        case 'course':
            return courseSearchUrl({}, city);
        case 'event':
            return eventsSearch.url(city ? { city } : undefined);
    }
}

/** The round track on a dark background, white when chosen. */
const modeTrackClassName =
    'w-full gap-1 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 p-1';
const modeItemClassName =
    'flex-1 rounded-full whitespace-nowrap text-primary-foreground/80 first:rounded-full last:rounded-full hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground/50 data-[state=on]:bg-primary-foreground data-[state=on]:font-semibold data-[state=on]:text-primary data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary-foreground data-[state=on]:hover:text-primary';

// Scrolls sideways on narrow phones instead of wrapping.
const trackClassName = cn(
    modeTrackClassName,
    'w-auto max-w-full [scrollbar-width:none] self-start overflow-x-auto',
);
const itemClassName = cn(
    modeItemClassName,
    // min-w-max: ToggleGroupItem sets min-w-0, which squeezed "Personal trainer".
    'inline-flex h-10 min-w-max shrink-0 items-center justify-center gap-2 px-3.5 text-sm sm:px-4 [&_svg]:size-4',
);

type ToggleProps = {
    value: SearchKind;
    onChange: (kind: SearchKind) => void;
};

/**
 * "Trainer | Palestre | Corsi | Eventi" on top of the home hero: changes the
 * title and the search bar below.
 */
export function SearchKindToggle({ value, onChange }: ToggleProps) {
    const kinds = useSearchKinds();

    if (kinds.length < 2) {
        return null;
    }

    return (
        <ToggleGroup
            type="single"
            aria-label="Cosa cerchi"
            value={value}
            // Clicking the chosen option again gives '': keep it.
            onValueChange={(next) => next && onChange(next as SearchKind)}
            className={trackClassName}
        >
            {kinds.map((kind) => (
                <ToggleGroupItem
                    key={kind.value}
                    value={kind.value}
                    className={itemClassName}
                >
                    <kind.icon aria-hidden="true" />
                    {kind.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}

/**
 * The same on the search pages, as links (search engines follow them): the
 * other searches in the same city.
 */
export function SearchKindLinks({
    current,
    city,
}: {
    current: SearchKind;
    city: string | null;
}) {
    const kinds = useSearchKinds();

    if (kinds.length < 2) {
        return null;
    }

    return (
        <nav aria-label="Cosa cerchi" className={cn(trackClassName, 'flex')}>
            {kinds.map((kind) => {
                const active = kind.value === current;

                return (
                    <Link
                        prefetch={hoverPrefetch}
                        key={kind.value}
                        href={searchKindUrl(kind.value, city)}
                        aria-current={active ? 'page' : undefined}
                        data-state={active ? 'on' : 'off'}
                        className={cn(
                            itemClassName,
                            'outline-none focus-visible:ring-[3px]',
                        )}
                    >
                        <kind.icon aria-hidden="true" />
                        {kind.label}
                    </Link>
                );
            })}
        </nav>
    );
}
