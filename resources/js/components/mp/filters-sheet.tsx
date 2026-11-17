import { useState } from 'react';
import DateSheet, {
    romeToday,
    timeBandOptions,
} from '@/components/mp/date-sheet';
import {
    FilterFooter,
    FilterGroup,
    toggleIn,
} from '@/components/mp/filter-chips';
import ModalSheet, { ModalSheetBody } from '@/components/mp/modal-sheet';
import SegmentedControl from '@/components/mp/segmented-control';
import {
    modeOptions,
    priceOptions,
    ratingOptions,
} from '@/components/search/filter-options';
import { addDays } from '@/lib/calendar';
import { formatDayShort } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import type { ActiveFilters, SearchFilters, SearchOption } from '@/lib/search';

/** The filters of the window: everything but the name, the sort and the page. */
export type SheetFilters = Omit<ActiveFilters, 'nome' | 'ordina'>;

export const emptySheetFilters: SheetFilters = {
    disciplina: [],
    obiettivo: [],
    modalita: null,
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
    disciplines: SearchOption[];
    /** "Solo preferiti": logged-in clients only. */
    showFavorites: boolean;
    onApply: (filters: SearchFilters) => void;
};

/**
 * "Filtri" of the trainer search (design "RicercaSheet" /
 * "DkFiltriFinestra"): the choices stay here until "Applica". First the
 * four groups of the design; under them, the other filters of the page
 * (time of day, mode, at home, goals, favorites), so none is lost.
 */
export default function FiltersSheet({
    open,
    onOpenChange,
    filters,
    disciplines,
    showFavorites,
    onApply,
}: FiltersSheetProps) {
    return (
        <ModalSheet open={open} onOpenChange={onOpenChange} title="Filtri">
            {/* Mounted only while open: it starts again from the page's filters. */}
            {open && (
                <FiltersForm
                    initial={filters}
                    disciplines={disciplines}
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
    disciplines,
    showFavorites,
    onApply,
}: {
    initial: SheetFilters;
    disciplines: SearchOption[];
    showFavorites: boolean;
    onApply: (filters: SearchFilters) => void;
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
                <FilterGroup title="Disciplina" scroll>
                    <button
                        type="button"
                        aria-pressed={draft.disciplina.length === 0}
                        onClick={() => set({ disciplina: [] })}
                        className="chip"
                    >
                        Tutte
                    </button>
                    {disciplines.map((discipline) => (
                        <button
                            key={discipline.value}
                            type="button"
                            aria-pressed={draft.disciplina.includes(
                                discipline.value,
                            )}
                            onClick={() =>
                                set({
                                    disciplina: toggleIn(
                                        draft.disciplina,
                                        discipline.value,
                                    ),
                                })
                            }
                            className="chip"
                        >
                            {discipline.label}
                        </button>
                    ))}
                </FilterGroup>

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

                <FilterGroup title="Modalità">
                    {modeOptions.map((option) => {
                        const value =
                            option.value === 'tutte' ? null : option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={draft.modalita === value}
                                onClick={() => set({ modalita: value })}
                                className="chip"
                            >
                                {option.label}
                            </button>
                        );
                    })}
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

                <FilterGroup title="Obiettivi">
                    {trainingGoals.map((goal) => (
                        <button
                            key={goal.value}
                            type="button"
                            aria-pressed={draft.obiettivo.includes(goal.value)}
                            onClick={() =>
                                set({
                                    obiettivo: toggleIn(
                                        draft.obiettivo,
                                        goal.value,
                                    ),
                                })
                            }
                            className="chip"
                        >
                            {goal.label}
                        </button>
                    ))}
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
