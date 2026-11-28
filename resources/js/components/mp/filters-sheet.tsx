import { useState } from 'react';
import DateSheet, {
    romeToday,
    timeBandOptions,
} from '@/components/mp/date-sheet';
import { FilterFooter, FilterGroup } from '@/components/mp/filter-chips';
import ModalSheet, { ModalSheetBody } from '@/components/mp/modal-sheet';
import SegmentedControl from '@/components/mp/segmented-control';
import {
    priceOptions,
    ratingOptions,
} from '@/components/search/filter-options';
import { addDays } from '@/lib/calendar';
import { formatDayShort } from '@/lib/format';
import type { ActiveFilters } from '@/lib/search';

/**
 * The filters of the window: what the search bar doesn't already have
 * (disciplines, goals, name, city and mode are there), without the sort.
 */
export type SheetFilters = Omit<
    ActiveFilters,
    'nome' | 'ordina' | 'disciplina' | 'obiettivo' | 'modalita'
>;

export const emptySheetFilters: SheetFilters = {
    disponibilita: null,
    data: null,
    fascia: null,
    prezzo: null,
    valutazione: null,
    domicilio: null,
    preferiti: null,
};

/** How many filters are on: the number on the "Filtri" button. */
export function countFilters(filters: SheetFilters): number {
    return (Object.keys(emptySheetFilters) as (keyof SheetFilters)[]).reduce(
        (count, name) => {
            const value = filters[name];

            return (
                count + (Array.isArray(value) ? value.length : value ? 1 : 0)
            );
        },
        0,
    );
}

type When = 'oggi' | 'domani' | 'settimana' | 'data';

/** "Quando": a day of the calendar or a few days from today. */
function whenOf(filters: SheetFilters, tomorrow: string): When | null {
    if (filters.data) {
        return filters.data === tomorrow ? 'domani' : 'data';
    }

    return filters.disponibilita === 'oggi'
        ? 'oggi'
        : filters.disponibilita === 'settimana'
          ? 'settimana'
          : null;
}

const ratingSegments = [
    ...ratingOptions.map((option) => ({
        value: option.value,
        label: option.short,
    })),
    { value: 'tutte', label: 'Tutte' },
] as const;

type FiltersSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: SheetFilters;
    /** "Solo preferiti": logged-in clients only. */
    showFavorites: boolean;
    onApply: (filters: SheetFilters) => void;
};

/**
 * "Filtri" of the trainer search (design "RicercaSheet" /
 * "DkFiltriFinestra"): the choices stay here until "Applica". Only what
 * the search bar above doesn't have: when, price, rating, time of day,
 * at home and favorites.
 */
export default function FiltersSheet({
    open,
    onOpenChange,
    filters,
    showFavorites,
    onApply,
}: FiltersSheetProps) {
    return (
        <ModalSheet open={open} onOpenChange={onOpenChange} title="Filtri">
            {/* Mounted only while open: it starts again from the page's filters. */}
            {open && (
                <FiltersForm
                    initial={filters}
                    showFavorites={showFavorites}
                    onApply={(next) => {
                        onApply(next);
                        onOpenChange(false);
                    }}
                />
            )}
        </ModalSheet>
    );
}

function FiltersForm({
    initial,
    showFavorites,
    onApply,
}: {
    initial: SheetFilters;
    showFavorites: boolean;
    onApply: (filters: SheetFilters) => void;
}) {
    const [draft, setDraft] = useState(initial);
    const [dateOpen, setDateOpen] = useState(false);
    const tomorrow = addDays(romeToday(), 1);
    const when = whenOf(draft, tomorrow);

    const set = (changes: Partial<SheetFilters>) =>
        setDraft((current) => ({ ...current, ...changes }));

    const chooseWhen = (next: When) => {
        if (next === 'data') {
            setDateOpen(true);

            return;
        }

        // The same chip again: no day.
        if (next === when) {
            set({ disponibilita: null, data: null });

            return;
        }

        set(
            next === 'domani'
                ? { disponibilita: null, data: tomorrow }
                : { disponibilita: next, data: null },
        );
    };

    const whenOptions: { value: When; label: string }[] = [
        { value: 'oggi', label: 'Oggi' },
        { value: 'domani', label: 'Domani' },
        { value: 'settimana', label: 'Questa settimana' },
        {
            value: 'data',
            label:
                when === 'data' && draft.data
                    ? formatDayShort(`${draft.data}T12:00:00Z`)
                    : 'Scegli data',
        },
    ];

    return (
        <form
            id="filters-form"
            onSubmit={(event) => {
                event.preventDefault();
                onApply(draft);
            }}
            className="flex min-h-0 flex-1 flex-col"
        >
            <ModalSheetBody className="flex flex-col gap-5.5">
                <FilterGroup title="Quando" scroll>
                    {whenOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={when === option.value}
                            aria-haspopup={
                                option.value === 'data' ? 'dialog' : undefined
                            }
                            onClick={() => chooseWhen(option.value)}
                            className="chip"
                        >
                            {option.label}
                        </button>
                    ))}
                </FilterGroup>

                <FilterGroup title="Prezzo a seduta">
                    {priceOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={draft.prezzo === option.value}
                            onClick={() =>
                                set({
                                    prezzo:
                                        draft.prezzo === option.value
                                            ? null
                                            : option.value,
                                })
                            }
                            className="chip"
                        >
                            {option.label}
                        </button>
                    ))}
                </FilterGroup>

                <fieldset>
                    <legend className="mb-2.5 text-[15px] font-semibold">
                        Valutazione
                    </legend>
                    <SegmentedControl
                        label="Valutazione minima"
                        options={ratingSegments}
                        value={draft.valutazione ?? 'tutte'}
                        onValueChange={(value) =>
                            set({
                                valutazione: value === 'tutte' ? null : value,
                            })
                        }
                    />
                </fieldset>

                <FilterGroup title="Fascia oraria">
                    {timeBandOptions.map((option) => (
                        <button
                            key={option.label}
                            type="button"
                            aria-pressed={draft.fascia === option.value}
                            onClick={() => set({ fascia: option.value })}
                            className="chip"
                        >
                            {option.label}
                        </button>
                    ))}
                </FilterGroup>

                <FilterGroup title="Luogo">
                    <button
                        type="button"
                        aria-pressed={draft.domicilio === '1'}
                        onClick={() =>
                            set({ domicilio: draft.domicilio ? null : '1' })
                        }
                        className="chip"
                    >
                        A domicilio
                    </button>
                </FilterGroup>

                {showFavorites && (
                    <FilterGroup title="Preferiti">
                        <button
                            type="button"
                            aria-pressed={draft.preferiti === '1'}
                            onClick={() =>
                                set({ preferiti: draft.preferiti ? null : '1' })
                            }
                            className="chip"
                        >
                            Solo i miei preferiti
                        </button>
                    </FilterGroup>
                )}
            </ModalSheetBody>

            <FilterFooter onReset={() => setDraft(emptySheetFilters)} />

            <DateSheet
                open={dateOpen}
                onOpenChange={setDateOpen}
                date={draft.data}
                band={draft.fascia}
                onApply={(date, band) =>
                    set({ data: date, disponibilita: null, fascia: band })
                }
            />
        </form>
    );
}
