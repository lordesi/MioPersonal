import { router } from '@inertiajs/react';
import { ChevronDown, Heart, Star } from 'lucide-react';
import ActiveFilters from '@/components/search/active-filters';
import type { ActiveChip } from '@/components/search/active-filters';
import NameSearch from '@/components/search/name-search';
import OptionsMenu from '@/components/search/options-menu';
import SearchBar from '@/components/search/search-bar';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { trainingGoals } from '@/lib/goals';
import type { SearchFilters } from '@/lib/search';
import { cn } from '@/lib/utils';
import { login } from '@/routes';

/** The filters with more values: [] = not set. */
type ListFilter = 'disciplina' | 'obiettivo';

/** Every filter of the page: null (or [] for the lists) = not set. */
export type ActiveFilters = {
    [Key in Exclude<keyof SearchFilters, 'pagina' | ListFilter>]-?: NonNullable<
        SearchFilters[Key]
    > | null;
} & {
    [Key in ListFilter]-?: NonNullable<SearchFilters[Key]>;
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
    { value: '35-50', label: '35–50 €' },
    { value: '50-75', label: '50–75 €' },
    { value: '75-100', label: '75–100 €' },
    { value: 'oltre-100', label: 'Oltre 100 €' },
];

/** `short` on the button, `label` in "Filtri attivi". */
const ratingOptions: (Option<'valutazione'> & { short: string })[] = [
    { value: '3', short: '3+', label: '★ 3 e più' },
    { value: '4', short: '4+', label: '★ 4 e più' },
    { value: '4-5', short: '4,5+', label: '★ 4,5 e più' },
];

/** "Tutte · ★ 3+ · ★ 4+ · ★ 4,5+" on a light background, as tall as the pills. */
const ratingItemClassName =
    'h-9 rounded-full px-3 whitespace-nowrap first:rounded-full last:rounded-full hover:bg-accent data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90';

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

/** "Tutte / In presenza / Online" on a dark background: also the home hero. */
export const modeTrackClassName =
    'w-full gap-1 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 p-1';
export const modeItemClassName =
    'flex-1 rounded-full whitespace-nowrap text-primary-foreground/80 first:rounded-full last:rounded-full hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground/50 data-[state=on]:bg-primary-foreground data-[state=on]:font-semibold data-[state=on]:text-primary data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary-foreground data-[state=on]:hover:text-primary';

function labelOf<T>(
    options: readonly { value: T; label: string }[],
    value: T | null,
): string | undefined {
    return options.find((option) => option.value === value)?.label;
}

/** The round filters above the results; black while on. */
const pillClassName =
    'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';
const pillOff = 'border-input bg-background text-foreground hover:bg-accent';
const pillOn =
    'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground';

type SearchControlsProps = {
    filters: ActiveFilters;
    disciplines: SearchOption[];
    cities: SearchOption[];
    /** Slug of the city in the URL, null = all of Italy. */
    city: string | null;
    /** `city` left out = same city; the city is in the URL path, not in the filters. */
    onChange: (changes: SearchFilters, city?: string | null) => void;
};

/** In the dark block: "Cosa · Dove · Quando" and the mode switch. */
export function SearchControls({
    filters,
    disciplines,
    cities,
    city,
    onChange,
}: SearchControlsProps) {
    return (
        <>
            <div
                role="search"
                aria-label="Cerca un personal trainer"
                className="max-w-245"
            >
                <SearchBar
                    variant="hero"
                    // A new key when the applied filters change: the pill starts again from them.
                    key={`${filters.disciplina.join(',')}|${city}|${filters.disponibilita}`}
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
            </div>

            <ToggleGroup
                type="single"
                aria-label="Modalità"
                value={filters.modalita ?? 'tutte'}
                // Clicking the chosen option again gives '': nothing changes.
                onValueChange={(value) =>
                    value &&
                    onChange({
                        modalita:
                            value === 'tutte'
                                ? null
                                : (value as ActiveFilters['modalita']),
                    })
                }
                className={cn(modeTrackClassName, 'max-w-115')}
            >
                {modeOptions.map((option) => (
                    <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        className={cn(modeItemClassName, 'h-10.5 px-3.5')}
                    >
                        {option.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </>
    );
}

type FilterBarProps = SearchControlsProps & {
    /** The "Preferiti" filter: missing for trainers and admins, who have no favorites. */
    favorites?: { count: number; guest: boolean };
    onReset: () => void;
};

/** Above the results: name, price, rating, favorites, sort and "Filtri attivi". */
export default function FilterBar({
    filters,
    disciplines,
    cities,
    city,
    favorites,
    onChange,
    onReset,
}: FilterBarProps) {
    const sortLabel = labelOf(sortOptions, filters.ordina) ?? 'Più pertinenti';
    const priceLabel = labelOf(priceOptions, filters.prezzo);
    const goalLabels = filters.obiettivo.map((goal) =>
        labelOf(trainingGoals, goal),
    );
    // "Forza", or "Forza +1" with more goals.
    const goalLabel =
        goalLabels.length > 1
            ? `${goalLabels[0]} +${goalLabels.length - 1}`
            : goalLabels[0];
    const favoritesOnly = filters.preferiti !== null;

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

    addChip('nome', filters.nome ? `Nome: “${filters.nome}”` : undefined, () =>
        onChange({ nome: null }),
    );
    // One chip for each discipline and each goal: each one goes away on its own.
    filters.disciplina.forEach((slug) =>
        addChip(`disciplina-${slug}`, labelOf(disciplines, slug), () =>
            onChange({
                disciplina: filters.disciplina.filter((item) => item !== slug),
            }),
        ),
    );
    filters.obiettivo.forEach((goal) =>
        addChip(`obiettivo-${goal}`, labelOf(trainingGoals, goal), () =>
            onChange({
                obiettivo: filters.obiettivo.filter((item) => item !== goal),
            }),
        ),
    );
    addChip('citta', labelOf(cities, city), () => onChange({}, null));
    addChip(
        'disponibilita',
        labelOf(availabilityOptions, filters.disponibilita),
        () => onChange({ disponibilita: null }),
    );
    addChip('prezzo', priceLabel, () => onChange({ prezzo: null }));
    addChip('modalita', labelOf(modeOptions, filters.modalita), () =>
        onChange({ modalita: null }),
    );
    addChip('valutazione', labelOf(ratingOptions, filters.valutazione), () =>
        onChange({ valutazione: null }),
    );
    addChip('preferiti', favoritesOnly ? 'Solo preferiti' : undefined, () =>
        onChange({ preferiti: null }),
    );
    // No "Luogo" filter on screen for now: shown only if an old link has it.
    addChip('domicilio', filters.domicilio ? 'A domicilio' : undefined, () =>
        onChange({ domicilio: null }),
    );

    return (
        <div className="flex flex-col gap-4.5">
            <div
                role="group"
                aria-label="Filtri"
                className="flex flex-wrap items-center gap-2.5"
            >
                <NameSearch
                    // No `key`: a new field while typing would lose the cursor.
                    applied={filters.nome}
                    onSearch={(nome) => onChange({ nome })}
                    className="w-full sm:w-60"
                />

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
                            className={cn(
                                pillClassName,
                                priceLabel ? pillOn : pillOff,
                            )}
                        >
                            {priceLabel ?? 'Prezzo'}
                            <ChevronDown
                                aria-hidden="true"
                                className="size-4"
                            />
                        </button>
                    }
                />

                <OptionsMenu
                    multiple
                    label="Obiettivo"
                    title="Scegli uno o più obiettivi"
                    noneLabel="Tutti gli obiettivi"
                    options={trainingGoals}
                    value={filters.obiettivo}
                    onChange={(obiettivo) => onChange({ obiettivo })}
                    className="min-w-65"
                    trigger={
                        <button
                            type="button"
                            aria-label={`Obiettivo: ${goalLabels.join(', ') || 'tutti'}`}
                            className={cn(
                                pillClassName,
                                goalLabel ? pillOn : pillOff,
                            )}
                        >
                            {goalLabel ?? 'Obiettivo'}
                            <ChevronDown
                                aria-hidden="true"
                                className="size-4"
                            />
                        </button>
                    }
                />

                <ToggleGroup
                    type="single"
                    aria-label="Valutazione"
                    value={filters.valutazione ?? 'tutte'}
                    // Clicking the chosen option again gives '': nothing changes.
                    onValueChange={(value) =>
                        value &&
                        onChange({
                            valutazione:
                                value === 'tutte'
                                    ? null
                                    : (value as ActiveFilters['valutazione']),
                        })
                    }
                    className="h-11 shrink-0 gap-0.5 rounded-full border border-input bg-background p-0.75"
                >
                    <ToggleGroupItem
                        value="tutte"
                        className={ratingItemClassName}
                    >
                        Tutte
                    </ToggleGroupItem>
                    {ratingOptions.map((option) => (
                        <ToggleGroupItem
                            key={option.value}
                            value={option.value}
                            aria-label={`Almeno ${option.short.replace('+', '')} stelle`}
                            className={cn(ratingItemClassName, 'gap-1')}
                        >
                            <Star
                                aria-hidden="true"
                                className="size-3.5 fill-current"
                            />
                            {option.short}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>

                {favorites && (
                    <Toggle
                        pressed={favoritesOnly}
                        onPressedChange={(on) =>
                            favorites.guest
                                ? router.visit(login())
                                : onChange({ preferiti: on ? '1' : null })
                        }
                        className={cn(
                            pillClassName,
                            pillOff,
                            'group data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90',
                        )}
                    >
                        <Heart
                            aria-hidden="true"
                            className="size-3.5 fill-current"
                        />
                        Preferiti
                        <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-bold text-foreground tabular-nums group-data-[state=on]:bg-primary-foreground group-data-[state=on]:text-primary">
                            {favorites.count}
                        </span>
                    </Toggle>
                )}

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
                            <button
                                type="button"
                                aria-label={`Ordina per: ${sortLabel}`}
                                className={cn(
                                    pillClassName,
                                    pillOff,
                                    'font-normal',
                                )}
                            >
                                <span className="text-muted-foreground">
                                    Ordina:
                                </span>
                                <strong className="font-semibold">
                                    {sortLabel}
                                </strong>
                                <ChevronDown
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </button>
                        }
                    />
                </div>
            </div>

            <ActiveFilters chips={chips} onClearAll={onReset} />
        </div>
    );
}
