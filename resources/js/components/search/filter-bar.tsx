import { ArrowUpDown, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import FilterSelect from '@/components/search/filter-select';
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

const availabilityOptions: Option<'disponibilita'>[] = [
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

const homeOptions: Option<'domicilio'>[] = [
    { value: '1', label: 'Viene a domicilio' },
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

/** The value after `current` in the list, back to "not set" after the last one. */
function cycle<T>(options: { value: T }[], current: T | null): T | null {
    const values = [null, ...options.map((option) => option.value)];

    return values[(values.indexOf(current) + 1) % values.length];
}

function labelOf<T>(
    options: { value: T; label: string }[],
    value: T | null,
    noneLabel: string,
): string {
    return options.find((option) => option.value === value)?.label ?? noneLabel;
}

type FilterBarProps = {
    filters: ActiveFilters;
    disciplines: SearchOption[];
    zones: SearchOption[];
    onChange: (changes: SearchFilters) => void;
    onReset: () => void;
};

export default function FilterBar({
    filters,
    disciplines,
    zones,
    onChange,
    onReset,
}: FilterBarProps) {
    const hasFilters = Object.entries(filters).some(
        ([name, value]) => name !== 'ordina' && value !== null,
    );

    const mode = (
        <SegmentedControl
            options={[...modeOptions]}
            value={filters.modalita ?? 'tutte'}
            onChange={(value) =>
                onChange({ modalita: value === 'tutte' ? null : value })
            }
            aria-labelledby="filtro-modalita"
            className="md:h-9"
        />
    );

    /** The menus shared by the desktop row and the mobile "Filtri" panel. */
    const fields = (prefix: string, inRow: boolean) => (
        <>
            <FilterSelect
                id={`${prefix}-disciplina`}
                label="Disciplina"
                noneLabel="Tutte le discipline"
                options={disciplines}
                value={filters.disciplina}
                onChange={(disciplina) => onChange({ disciplina })}
                className={cn(inRow && 'max-w-65 flex-[1_1_200px]')}
            />
            <FilterSelect
                id={`${prefix}-zona`}
                label="Zona"
                noneLabel="Tutta Milano e provincia"
                options={zones}
                value={filters.zona}
                onChange={(zona) => onChange({ zona })}
                className={cn(inRow && 'max-w-65 flex-[1_1_200px]')}
            />
            <FilterSelect
                id={`${prefix}-disponibilita`}
                label="Disponibilità"
                noneLabel="Qualsiasi giorno"
                options={availabilityOptions}
                value={filters.disponibilita}
                onChange={(disponibilita) => onChange({ disponibilita })}
                className={cn(inRow && 'max-w-52.5 flex-[1_1_160px]')}
            />
            <FilterSelect
                id={`${prefix}-prezzo`}
                label="Prezzo a seduta"
                noneLabel="Qualsiasi prezzo"
                options={priceOptions}
                value={filters.prezzo}
                onChange={(prezzo) => onChange({ prezzo })}
                className={cn(inRow && 'max-w-52.5 flex-[1_1_160px]')}
            />
            <FilterSelect
                id={`${prefix}-valutazione`}
                label="Valutazione"
                noneLabel="Qualsiasi"
                options={ratingOptions}
                value={filters.valutazione}
                onChange={(valutazione) => onChange({ valutazione })}
                className={cn(inRow && 'max-w-52.5 flex-[1_1_130px]')}
            />
            <FilterSelect
                id={`${prefix}-luogo`}
                label="Luogo"
                noneLabel="Qualsiasi luogo"
                options={homeOptions}
                value={filters.domicilio}
                onChange={(domicilio) => onChange({ domicilio })}
                className={cn(inRow && 'max-w-52.5 flex-[1_1_160px]')}
            />
        </>
    );

    const priceLabel = labelOf(
        priceOptions,
        filters.prezzo,
        'Prezzo: qualsiasi',
    );
    const sortLabel = labelOf(sortOptions, filters.ordina, 'Più pertinenti');

    return (
        <div
            role="search"
            aria-label="Filtri"
            className="flex flex-col gap-3 border-b pb-4 md:pb-6"
        >
            {/* Desktop: one row of menus. */}
            <div className="hidden flex-wrap items-end gap-3 md:flex">
                {fields('filtro', true)}
                <div className="flex shrink-0 flex-col gap-1.5">
                    <span
                        id="filtro-modalita"
                        className="text-sm leading-none font-medium"
                    >
                        Modalità
                    </span>
                    {mode}
                </div>
                <FilterSelect
                    id="filtro-ordina"
                    label="Ordina per"
                    noneLabel="Più pertinenti"
                    options={sortOptions}
                    value={filters.ordina}
                    onChange={(ordina) => onChange({ ordina })}
                    highlight={false}
                    className="ml-auto min-w-45"
                />
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
                                {fields('pannello', false)}
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
                    <Toggle
                        pressed={filters.domicilio !== null}
                        onPressedChange={(on) =>
                            onChange({ domicilio: on ? '1' : null })
                        }
                        className={cn(chipClassName, 'shrink-0')}
                    >
                        Viene a domicilio
                    </Toggle>
                    <Toggle
                        pressed={filters.valutazione !== null}
                        onPressedChange={(on) =>
                            onChange({ valutazione: on ? '4-5' : null })
                        }
                        className={cn(chipClassName, 'shrink-0')}
                    >
                        ★ 4,5 e più
                    </Toggle>
                    <Button
                        type="button"
                        variant="outline"
                        aria-label={`Fascia di prezzo: ${priceLabel}. Tocca per cambiare`}
                        onClick={() =>
                            onChange({
                                prezzo: cycle(priceOptions, filters.prezzo),
                            })
                        }
                        className={cn(
                            'h-9 shrink-0 rounded-full px-3.5',
                            filters.prezzo &&
                                'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                        )}
                    >
                        {priceLabel}
                        <ChevronDown aria-hidden="true" />
                    </Button>
                </div>

                <div className="flex items-center justify-between px-4">
                    <span className="text-[13px] text-muted-foreground">
                        Ordina
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        aria-label={`Ordina per: ${sortLabel}. Tocca per cambiare`}
                        onClick={() =>
                            onChange({
                                ordina: cycle(sortOptions, filters.ordina),
                            })
                        }
                        className="h-10 rounded-full px-3"
                    >
                        {sortLabel}
                        <ArrowUpDown aria-hidden="true" />
                    </Button>
                </div>

                <div className="px-4">{mode}</div>

                {hasFilters && (
                    <div className="px-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onReset}
                            className="px-1"
                        >
                            <X aria-hidden="true" />
                            Rimuovi filtri
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
