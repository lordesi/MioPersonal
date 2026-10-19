import { ArrowUpDown, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import ActiveFilters from '@/components/search/active-filters';
import type { ActiveChip } from '@/components/search/active-filters';
import FilterSelect from '@/components/search/filter-select';
import OptionsMenu from '@/components/search/options-menu';
import SearchBar from '@/components/search/search-bar';
import ChoiceChips, { chipClassName } from '@/components/shared/choice-chips';
import SegmentedControl from '@/components/shared/segmented-control';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Toggle } from '@/components/ui/toggle';
import type { SearchFilters } from '@/lib/search';
import { cn } from '@/lib/utils';

/** Every filter of the page: null = not set. */
export type ActiveFilters = {
    [Key in Exclude<keyof SearchFilters, 'pagina'>]-?: NonNullable<
        SearchFilters[Key]
    > | null;
};

export type SearchOption = { value: string; label: string };

type Option<Key extends keyof ActiveFilters> = {
    value: NonNullable<ActiveFilters[Key]>;
    label: string;
};

/** "Quando": also used by the home search bar. */
export const availabilityOptions: Option<'disponibilita'>[] = [
    { value: 'oggi', label: 'Oggi' },
    { value: '3-giorni', label: 'Prossimi 3 giorni' },
    { value: 'settimana', label: 'Questa settimana' },
];

const priceOptions: Option<'prezzo'>[] = [
    { value: 'fino-35', label: 'Fino a 35 €' },
    { value: '35-45', label: '35–45 €' },
    { value: '45-60', label: '45–60 €' },
    { value: 'oltre-60', label: 'Oltre 60 €' },
];

const ratingOptions: Option<'valutazione'>[] = [
    { value: '4-5', label: '4,5 e più' },
];

const sortOptions: Option<'ordina'>[] = [
    { value: 'slot', label: 'Primo slot libero' },
    { value: 'prezzo', label: 'Prezzo più basso' },
    { value: 'valutazione', label: 'Valutazione' },
];

const modeOptions = [
    { value: 'tutte', label: 'Tutte' },
    { value: 'presenza', label: 'In presenza' },
    { value: 'online', label: 'Online' },
] as const;

function labelOf<T>(
    options: { value: T; label: string }[],
    value: T | null,
): string | undefined {
    return options.find((option) => option.value === value)?.label;
}

/** Pill look of the "Prezzo" menu; black while a price is chosen. */
const pillClassName =
    'inline-flex h-9 shrink-0 items-center rounded-full border text-sm font-medium whitespace-nowrap md:h-10';

type FilterBarProps = {
    filters: ActiveFilters;
    disciplines: SearchOption[];
    cities: SearchOption[];
    /** Slug of the city in the URL, null = all of Italy. */
    city: string | null;
    /** `city` left out = same city; the city is in the URL path, not in the filters. */
    onChange: (changes: SearchFilters, city?: string | null) => void;
    onReset: () => void;
};

export default function FilterBar({
    filters,
    disciplines,
    cities,
    city,
    onChange,
    onReset,
}: FilterBarProps) {
    const sortLabel = labelOf(sortOptions, filters.ordina) ?? 'Più pertinenti';
    const priceLabel = labelOf(priceOptions, filters.prezzo);

    /** One chip per filter in "Filtri attivi", in the order of the design. */
    const chips: ActiveChip[] = [];
    const addChip = (
        name: string,
        label: string | undefined,
        onClear: () => void,
    ) => {
        if (label) {
            chips.push({ name, label, onClear });
        }
    };

    addChip('disciplina', labelOf(disciplines, filters.disciplina), () =>
        onChange({ disciplina: null }),
    );
    addChip('citta', labelOf(cities, city), () => onChange({}, null));
    addChip('prezzo', priceLabel, () => onChange({ prezzo: null }));
    addChip(
        'disponibilita',
        labelOf(availabilityOptions, filters.disponibilita),
        () => onChange({ disponibilita: null }),
    );
    addChip('valutazione', labelOf(ratingOptions, filters.valutazione), () =>
        onChange({ valutazione: null }),
    );
    // No "Luogo" filter on screen for now: shown only if an old link has it.
    addChip('domicilio', filters.domicilio ? 'A domicilio' : undefined, () =>
        onChange({ domicilio: null }),
    );
    addChip('modalita', labelOf([...modeOptions], filters.modalita), () =>
        onChange({ modalita: null }),
    );

    const mode = (
        <SegmentedControl
            options={[...modeOptions]}
            value={filters.modalita ?? 'tutte'}
            onChange={(value) =>
                onChange({ modalita: value === 'tutte' ? null : value })
            }
            aria-label="Modalità"
            // "In presenza" on one line; on desktop each option as wide as its text.
            className="*:whitespace-nowrap md:*:flex-none"
        />
    );

    const price = (
        <div
            className={cn(
                pillClassName,
                priceLabel
                    ? 'border-primary bg-primary pr-1 pl-3.5 text-primary-foreground'
                    : 'border-input bg-background px-3.5 text-foreground hover:bg-accent',
            )}
        >
            <OptionsMenu
                label="Prezzo a seduta"
                noneLabel="Qualsiasi prezzo"
                options={priceOptions}
                value={filters.prezzo}
                onChange={(prezzo) => onChange({ prezzo })}
                className="min-w-57.5"
                trigger={
                    <button
                        type="button"
                        aria-label={`Prezzo a seduta: ${priceLabel ?? 'qualsiasi'}`}
                        className="inline-flex h-full items-center gap-1.5 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        {priceLabel ?? (
                            <>
                                Prezzo
                                <ChevronDown
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </>
                        )}
                    </button>
                }
            />
            {priceLabel && (
                <button
                    type="button"
                    onClick={() => onChange({ prezzo: null })}
                    aria-label="Rimuovi filtro Prezzo"
                    className="ml-0.5 flex size-7 items-center justify-center rounded-full outline-none hover:bg-primary-foreground/15 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <X
                        aria-hidden="true"
                        strokeWidth={2.5}
                        className="size-3.5"
                    />
                </button>
            )}
        </div>
    );

    const topRating = (
        <Toggle
            pressed={filters.valutazione !== null}
            onPressedChange={(on) =>
                onChange({ valutazione: on ? '4-5' : null })
            }
            className={cn(chipClassName, 'shrink-0 text-[13px]')}
        >
            ★ 4,5 e più
        </Toggle>
    );

    return (
        <div
            role="search"
            aria-label="Filtri"
            className="flex flex-col gap-4 border-b pb-4 md:pb-6"
        >
            {/* Desktop: "Cosa · Dove · Quando", then the other filters in one row. */}
            <div className="hidden flex-col gap-4 md:flex">
                <SearchBar
                    // A new key when the applied filters change: the pill starts again from them.
                    key={`${filters.disciplina}|${city}|${filters.disponibilita}`}
                    disciplines={disciplines}
                    cities={cities}
                    availabilityOptions={availabilityOptions}
                    applied={{
                        disciplina: filters.disciplina,
                        city,
                        disponibilita: filters.disponibilita,
                    }}
                    onSearch={({ disciplina, disponibilita, city: nextCity }) =>
                        onChange({ disciplina, disponibilita }, nextCity)
                    }
                />
                <div className="flex flex-wrap items-center gap-2">
                    {mode}
                    <span
                        aria-hidden="true"
                        className="mx-1 h-7 w-px bg-border"
                    />
                    {price}
                    {topRating}
                    <div className="ml-auto">
                        <OptionsMenu
                            label="Ordina per"
                            noneLabel="Più pertinenti"
                            options={sortOptions}
                            value={filters.ordina}
                            onChange={(ordina) => onChange({ ordina })}
                            align="end"
                            className="min-w-55"
                            trigger={
                                <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label={`Ordina per: ${sortLabel}`}
                                    className="h-10 gap-1.5 px-2.5 font-normal"
                                >
                                    <span className="text-muted-foreground">
                                        Ordina:
                                    </span>
                                    <strong className="font-semibold">
                                        {sortLabel}
                                    </strong>
                                    <ChevronDown aria-hidden="true" />
                                </Button>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Mobile: chips that scroll sideways, every menu in the "Filtri" panel. */}
            <div className="flex flex-col gap-3 md:hidden">
                <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                aria-label="Apri tutti i filtri"
                                className="h-10 shrink-0 rounded-full px-3.5"
                            >
                                <SlidersHorizontal aria-hidden="true" />
                                Filtri
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="bottom"
                            aria-describedby={undefined}
                            className="max-h-[85vh] overflow-y-auto rounded-t-xl"
                        >
                            <SheetHeader>
                                <SheetTitle>Filtri</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-4 px-4 pb-6">
                                <FilterSelect
                                    id="pannello-disciplina"
                                    label="Disciplina"
                                    noneLabel="Tutte le discipline"
                                    options={disciplines}
                                    value={filters.disciplina}
                                    onChange={(disciplina) =>
                                        onChange({ disciplina })
                                    }
                                />
                                <FilterSelect
                                    id="pannello-citta"
                                    label="Città"
                                    noneLabel="Tutta Italia"
                                    options={cities}
                                    value={city}
                                    onChange={(nextCity) =>
                                        onChange({}, nextCity)
                                    }
                                />
                                <FilterSelect
                                    id="pannello-disponibilita"
                                    label="Disponibilità"
                                    noneLabel="Qualsiasi giorno"
                                    options={availabilityOptions}
                                    value={filters.disponibilita}
                                    onChange={(disponibilita) =>
                                        onChange({ disponibilita })
                                    }
                                />
                                <FilterSelect
                                    id="pannello-prezzo"
                                    label="Prezzo a seduta"
                                    noneLabel="Qualsiasi prezzo"
                                    options={priceOptions}
                                    value={filters.prezzo}
                                    onChange={(prezzo) => onChange({ prezzo })}
                                />
                                <FilterSelect
                                    id="pannello-valutazione"
                                    label="Valutazione"
                                    noneLabel="Qualsiasi"
                                    options={ratingOptions}
                                    value={filters.valutazione}
                                    onChange={(valutazione) =>
                                        onChange({ valutazione })
                                    }
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <ChoiceChips
                        aria-label="Disciplina"
                        className="shrink-0 flex-nowrap"
                        options={[
                            { value: 'tutte', label: 'Tutte' },
                            ...disciplines,
                        ]}
                        value={filters.disciplina ?? 'tutte'}
                        onChange={(value) =>
                            onChange({
                                disciplina: value === 'tutte' ? null : value,
                            })
                        }
                    />
                </div>

                <div
                    role="group"
                    aria-label="Disponibilità e preferenze"
                    className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4"
                >
                    <ChoiceChips
                        aria-label="Disponibilità"
                        className="shrink-0 flex-nowrap"
                        options={[
                            { value: 'any', label: 'Qualsiasi giorno' },
                            ...availabilityOptions,
                        ]}
                        value={filters.disponibilita ?? 'any'}
                        onChange={(value) =>
                            onChange({
                                disponibilita: value === 'any' ? null : value,
                            })
                        }
                    />
                    {topRating}
                    {price}
                </div>

                <div className="flex items-center justify-between px-4">
                    <span className="text-[13px] text-muted-foreground">
                        Ordina
                    </span>
                    <OptionsMenu
                        label="Ordina per"
                        noneLabel="Più pertinenti"
                        options={sortOptions}
                        value={filters.ordina}
                        onChange={(ordina) => onChange({ ordina })}
                        align="end"
                        className="min-w-55"
                        trigger={
                            <Button
                                type="button"
                                variant="outline"
                                aria-label={`Ordina per: ${sortLabel}`}
                                className="h-10 rounded-full px-3"
                            >
                                {sortLabel}
                                <ArrowUpDown aria-hidden="true" />
                            </Button>
                        }
                    />
                </div>

                <div className="px-4">{mode}</div>
            </div>

            <ActiveFilters
                chips={chips}
                onClearAll={onReset}
                className="px-4 md:px-0"
            />
        </div>
    );
}
