import { ChevronDown, Search as SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Over the cards: "N palestre a Milano" (desktop; on phones only for
 * screen readers and search engines, as in the design) and "Ordina".
 */
export function ResultsHeader({
    title,
    sort,
}: {
    title: string;
    sort?: ReactNode;
}) {
    return (
        <div
            className={cn(
                'flex min-h-11 items-center justify-end gap-4 md:justify-between',
                // Phones without "Ordina": nothing to see, only the title for screen readers.
                !sort && 'max-md:sr-only',
            )}
        >
            <h1 className="text-[15px] font-semibold max-md:sr-only">
                {title}
            </h1>
            {sort}
        </div>
    );
}

/** "Ordina: Pertinenza ⌄": a dark menu with one choice. */
export function SortMenu<T extends string>({
    options,
    value,
    onChange,
}: {
    options: readonly { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
}) {
    const label = options.find((option) => option.value === value)?.label;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex min-h-11 shrink-0 items-center gap-1 rounded-full px-1 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span className="text-muted-foreground">Ordina:</span>
                <strong className="font-semibold">{label}</strong>
                <ChevronDown aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="theme-dark min-w-48 rounded-2xl"
            >
                <DropdownMenuRadioGroup
                    value={value}
                    onValueChange={(next) => onChange(next as T)}
                >
                    {options.map((option) => (
                        <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            className="min-h-11 rounded-xl text-[15px]"
                        >
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** The cards: one column on phones, two on tablets, three on desktop. */
export function ResultsGrid<T>({
    items,
    itemKey,
    children,
}: {
    items: T[];
    itemKey: (item: T) => string | number;
    children: (item: T) => ReactNode;
}) {
    return (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {items.map((item) => (
                <li key={itemKey(item)} className="flex [&>*]:flex-1">
                    {children(item)}
                </li>
            ))}
        </ul>
    );
}

/**
 * Nothing matches: a short strip on top, so the similar results below stay
 * in sight. "Cancella i filtri" only when there is something to cancel.
 */
export function EmptyResults({
    title,
    hint,
    onReset,
}: {
    title: string;
    hint: string;
    onReset?: () => void;
}) {
    return (
        <div
            role="status"
            className="flex flex-wrap items-center gap-3.5 rounded-[26px] bg-card px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--border)] sm:px-5"
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]">
                <SearchIcon aria-hidden="true" className="size-5" />
            </span>
            <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
                <h2 className="text-base leading-6 font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{hint}</p>
            </div>
            {onReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="btn-brand h-10 px-4 text-[15px]"
                >
                    Cancella i filtri
                </button>
            )}
        </div>
    );
}

/** "Palestre simili", "Altri corsi a Milano"… under the empty strip. */
export function SuggestionsSection({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-3.5">
            <h2
                id={id}
                className="text-[22px] leading-7 font-bold tracking-[-0.26px]"
            >
                {title}
            </h2>
            {children}
        </section>
    );
}
