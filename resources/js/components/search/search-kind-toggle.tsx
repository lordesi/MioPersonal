import { Link } from '@inertiajs/react';
import { Building2, Dumbbell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    modeItemClassName,
    modeTrackClassName,
} from '@/components/search/filter-bar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { gymSearchUrl } from '@/lib/gym';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';

export type SearchKind = 'trainer' | 'gym';

const kinds: { value: SearchKind; label: string; icon: LucideIcon }[] = [
    { value: 'trainer', label: 'Personal trainer', icon: Dumbbell },
    { value: 'gym', label: 'Palestre', icon: Building2 },
];

const trackClassName = cn(modeTrackClassName, 'w-auto max-w-full self-start');
const itemClassName = cn(
    modeItemClassName,
    'inline-flex h-10 items-center justify-center gap-2 px-4 text-sm [&_svg]:size-4',
);

type ToggleProps = {
    value: SearchKind;
    onChange: (kind: SearchKind) => void;
};

/**
 * "Personal trainer | Palestre" on top of the home hero: changes the title
 * and the search bar below.
 */
export function SearchKindToggle({ value, onChange }: ToggleProps) {
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
 * other search in the same city.
 */
export function SearchKindLinks({
    current,
    city,
}: {
    current: SearchKind;
    city: string | null;
}) {
    const href = (kind: SearchKind) =>
        kind === 'trainer' ? searchUrl({}, city) : gymSearchUrl({}, city);

    return (
        <nav aria-label="Cosa cerchi" className={cn(trackClassName, 'flex')}>
            {kinds.map((kind) => {
                const active = kind.value === current;

                return (
                    <Link
                        key={kind.value}
                        href={href(kind.value)}
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
