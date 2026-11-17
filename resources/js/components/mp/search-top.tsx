import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import ComboField, { findOption } from '@/components/mp/combo-field';
import KindLinks from '@/components/mp/kind-links';
import WhatWhereSearch from '@/components/mp/what-where-search';
import type {
    FieldChoice,
    WhatWhereResult,
} from '@/components/mp/what-where-search';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import type { SearchOption } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { CityWithCoordinates } from '@/types';

type SearchTopProps = {
    kind: SearchKind;
    /** The city in the URL; null = all of Italy. */
    city: { slug: string; name: string } | null;
    what: {
        /** For screen readers, on phones: "Cerca palestre". */
        label: string;
        /** Desktop "Cosa": "Servizio o nome della palestra". */
        placeholder: string;
        /** The one field of the phones: "Servizio, nome o città". */
        mobilePlaceholder: string;
        /** Suggested in "Cosa": disciplines, services… */
        options: readonly SearchOption[];
    };
    cities: CityWithCoordinates[];
    /** What "Cosa" shows now: the chosen option or the words searched. */
    initialWhat: FieldChoice;
    /** A new search starts the fields again. */
    searchKey: string;
    /** "Cerca" (and on phones a suggestion of "Cosa" or free words). */
    onSearch: (result: WhatWhereResult) => void;
    /** Phones: a city chosen in the one field; the other filters stay. */
    onCity: (slug: string) => void;
    /** "Filtri": how many are on, and what opens the window. */
    filterCount: number;
    onOpenFilters: () => void;
};

/**
 * The top of the dark searches (trainer, palestre, corsi): the four searches,
 * "Cosa · Dove · Cerca" and "Filtri". Phones: tabs and one filled field;
 * desktop: the round switch and the two fields in a row. No photo: the
 * header of the layout lies on the page's background.
 */
export default function SearchTop({
    kind,
    city,
    what,
    cities,
    initialWhat,
    searchKey,
    onSearch,
    onCity,
    filterCount,
    onOpenFilters,
}: SearchTopProps) {
    return (
        <>
            {/* Phones: under the header, the four searches, the field and "Filtri". */}
            <div className="flex flex-col gap-3 pt-16 md:hidden">
                <KindLinks
                    current={kind}
                    city={city?.slug ?? null}
                    variant="tabs"
                    className="mx-4"
                />
                <MobileSearch
                    key={searchKey}
                    label={what.label}
                    placeholder={what.mobilePlaceholder}
                    options={what.options}
                    cities={cities}
                    initialText={initialWhat.text}
                    city={city?.slug ?? null}
                    onSearch={onSearch}
                    onCity={onCity}
                >
                    <FiltersButton
                        count={filterCount}
                        onClick={onOpenFilters}
                        className="size-11 bg-secondary"
                    />
                </MobileSearch>
            </div>

            {/* Desktop: the same in a row, under the header of the layout. */}
            <div className="mx-auto hidden w-full max-w-300 flex-col gap-4.5 px-8 pt-28 md:flex">
                <KindLinks
                    current={kind}
                    city={city?.slug ?? null}
                    variant="segments"
                    className="w-105"
                />
                <WhatWhereSearch
                    key={searchKey}
                    what={{
                        placeholder: what.placeholder,
                        options: what.options,
                    }}
                    cities={cities}
                    initialWhat={initialWhat}
                    initialCity={
                        city ? { text: city.name, value: city.slug } : undefined
                    }
                    submitLabel="Cerca"
                    layout="row"
                    size="md"
                    onSearch={onSearch}
                >
                    <FiltersButton
                        count={filterCount}
                        onClick={onOpenFilters}
                        className="h-12 px-4.5 shadow-[inset_0_0_0_1px_var(--field)] hover:bg-foreground/10"
                    />
                </WhatWhereSearch>
            </div>
        </>
    );
}

/** "Filtri": round icon on phones (number on the corner), pill with text on desktop. */
export function FiltersButton({
    count,
    onClick,
    className,
}: {
    count: number;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            aria-haspopup="dialog"
            aria-label={count > 0 ? `Filtri, ${count} applicati` : 'Filtri'}
            onClick={onClick}
            className={cn(
                'relative flex shrink-0 items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                className,
            )}
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
            >
                <path d="M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M14 4v4 M8 10v4 M16 16v4" />
            </svg>
            <span aria-hidden="true" className="max-md:hidden">
                Filtri
            </span>
            {count > 0 && (
                <span
                    aria-hidden="true"
                    className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1.25 text-[11px] font-bold text-primary-foreground tabular-nums shadow-[0_0_0_2px_var(--background)] max-md:absolute max-md:-top-0.5 max-md:-right-0.5 md:h-5 md:min-w-5 md:bg-transparent md:px-1.5 md:text-xs md:text-brand md:shadow-[inset_0_0_0_1.5px_var(--brand)]"
                >
                    {count}
                </span>
            )}
        </button>
    );
}

/**
 * The one field of the phones (design "RicercaSegment"). An option of
 * "Cosa" or a city (suggested, or written in full) is chosen as such; any
 * other text is searched as words (e.g. a name).
 */
function MobileSearch({
    label,
    placeholder,
    options,
    cities,
    initialText,
    city,
    onSearch,
    onCity,
    children,
}: {
    label: string;
    placeholder: string;
    options: readonly SearchOption[];
    cities: CityWithCoordinates[];
    initialText: string;
    city: string | null;
    onSearch: (result: WhatWhereResult) => void;
    onCity: (slug: string) => void;
    children: ReactNode;
}) {
    const [text, setText] = useState(initialText);
    const whatOptions = options.map((option) => ({
        value: `w:${option.value}`,
        label: option.label,
    }));
    const cityOptions = cities.map((option) => ({
        value: `c:${option.value}`,
        label: option.label,
    }));

    const choose = (value: string) => {
        const slug = value.slice(2);

        if (value.startsWith('w:')) {
            onSearch({ what: slug, words: null, city });
        } else {
            onCity(slug);
        }
    };

    return (
        <form
            role="search"
            onSubmit={(event) => {
                event.preventDefault();
                const option =
                    findOption(whatOptions, text) ??
                    findOption(cityOptions, text);

                if (option) {
                    choose(option.value);

                    return;
                }

                const words = text.trim();
                onSearch({
                    what: null,
                    words: words === '' ? null : words,
                    city,
                });
            }}
            className="flex items-center gap-2 px-4"
        >
            <ComboField
                label={label}
                icon={SearchIcon}
                type="search"
                placeholder={placeholder}
                options={[...whatOptions, ...cityOptions]}
                text={text}
                onTextChange={setText}
                onSelect={(option) => {
                    setText(option.label);
                    choose(option.value);
                }}
                size="md"
                tone="filled"
                className="min-w-0 flex-1"
            />
            {children}
        </form>
    );
}
