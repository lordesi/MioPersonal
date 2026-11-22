import { Link } from '@inertiajs/react';
import {
    searchKindUrl,
    useSearchKinds,
} from '@/components/search/search-kind-toggle';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import { cn } from '@/lib/utils';
import { hoverPrefetch } from '@/lib/prefetch';

type KindLinksProps = {
    current: SearchKind;
    /** The other searches open in the same city. */
    city: string | null;
    /**
     * tabs: text with a turquoise line under the current one (phones);
     * segments: the round white switch on the photo (desktop).
     */
    variant: 'tabs' | 'segments';
    className?: string;
};

/**
 * "Trainer · Palestre · Corsi · Eventi" on the dark search page: links,
 * so search engines follow them to the other searches.
 */
export default function KindLinks({
    current,
    city,
    variant,
    className,
}: KindLinksProps) {
    const kinds = useSearchKinds();

    // The trainers only: nothing else to switch to.
    if (kinds.length < 2) {
        return null;
    }

    return (
        <nav
            aria-label="Cosa cerchi"
            className={cn(
                variant === 'tabs'
                    ? 'grid auto-cols-fr grid-flow-col border-b border-separator'
                    : 'flex gap-0.5 rounded-full p-1 shadow-[inset_0_0_0_1px_var(--field)]',
                className,
            )}
        >
            {kinds.map((kind) => {
                const active = kind.value === current;

                return (
                    <Link
                        prefetch={hoverPrefetch}
                        key={kind.value}
                        href={searchKindUrl(kind.value, city)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'flex min-w-0 items-center justify-center truncate text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                            variant === 'tabs'
                                ? '-mb-px h-11 border-b-2 border-transparent text-muted-foreground aria-[current=page]:border-brand aria-[current=page]:text-foreground'
                                : 'min-h-9 flex-1 rounded-full px-3 text-foreground hover:bg-foreground/10 aria-[current=page]:bg-foreground aria-[current=page]:text-background aria-[current=page]:shadow-[0_2px_6px_0_rgba(0,0,0,0.3)]',
                        )}
                    >
                        {kind.shortLabel}
                    </Link>
                );
            })}
        </nav>
    );
}
