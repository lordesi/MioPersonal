import { useState } from 'react';
import {
    Chip,
    FilterFooter,
    FilterGroup,
    toggleIn,
} from '@/components/mp/filter-chips';
import ModalSheet, { ModalSheetBody } from '@/components/mp/modal-sheet';
import { gymPriceOptions } from '@/lib/gym';
import type { GymPriceRange } from '@/lib/gym';
import type { CatalogOption } from '@/types';

/** The filters of the window: everything but the name and the sort. */
export type GymSheetFilters = {
    servizi: string[];
    prezzo: GymPriceRange | null;
    promo: '1' | null;
    preferiti: '1' | null;
};

export const emptyGymSheetFilters: GymSheetFilters = {
    servizi: [],
    prezzo: null,
    promo: null,
    preferiti: null,
};

/** How many filters are on: the number on the "Filtri" button. */
export function countGymFilters(filters: GymSheetFilters): number {
    return (
        filters.servizi.length +
        [filters.prezzo, filters.promo, filters.preferiti].filter(Boolean)
            .length
    );
}

/**
 * "Filtri" of the gyms' search, like the trainers' one: the choices stay
 * here until "Applica".
 */
export default function GymFiltersSheet({
    open,
    onOpenChange,
    filters,
    amenities,
    showFavorites,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: GymSheetFilters;
    /** "Servizi": App\Enums\GymAmenity. */
    amenities: CatalogOption[];
    /** "Solo preferiti": logged-in clients only. */
    showFavorites: boolean;
    onApply: (filters: GymSheetFilters) => void;
}) {
    return (
        <ModalSheet open={open} onOpenChange={onOpenChange} title="Filtri">
            {/* Mounted only while open: it starts again from the page's filters. */}
            {open && (
                <GymFiltersForm
                    initial={filters}
                    amenities={amenities}
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

function GymFiltersForm({
    initial,
    amenities,
    showFavorites,
    onApply,
}: {
    initial: GymSheetFilters;
    amenities: CatalogOption[];
    showFavorites: boolean;
    onApply: (filters: GymSheetFilters) => void;
}) {
    const [draft, setDraft] = useState(initial);
    const set = (changes: Partial<GymSheetFilters>) =>
        setDraft((current) => ({ ...current, ...changes }));

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onApply(draft);
            }}
            className="flex min-h-0 flex-1 flex-col"
        >
            <ModalSheetBody className="flex flex-col gap-5.5">
                <FilterGroup title="Servizi">
                    <Chip
                        pressed={draft.servizi.length === 0}
                        onClick={() => set({ servizi: [] })}
                    >
                        Tutti
                    </Chip>
                    {amenities.map((amenity) => (
                        <Chip
                            key={amenity.value}
                            pressed={draft.servizi.includes(amenity.value)}
                            onClick={() =>
                                set({
                                    servizi: toggleIn(
                                        draft.servizi,
                                        amenity.value,
                                    ),
                                })
                            }
                        >
                            {amenity.label}
                        </Chip>
                    ))}
                </FilterGroup>

                <FilterGroup title="Budget mensile">
                    {gymPriceOptions.map((option) => (
                        <Chip
                            key={option.value}
                            pressed={draft.prezzo === option.value}
                            onClick={() =>
                                set({
                                    prezzo:
                                        draft.prezzo === option.value
                                            ? null
                                            : option.value,
                                })
                            }
                        >
                            {option.label}
                        </Chip>
                    ))}
                </FilterGroup>

                <FilterGroup title="Promozioni">
                    <Chip
                        pressed={draft.promo === '1'}
                        onClick={() => set({ promo: draft.promo ? null : '1' })}
                    >
                        Con promozioni
                    </Chip>
                </FilterGroup>

                {showFavorites && (
                    <FilterGroup title="Preferiti">
                        <Chip
                            pressed={draft.preferiti === '1'}
                            onClick={() =>
                                set({ preferiti: draft.preferiti ? null : '1' })
                            }
                        >
                            Solo le mie preferite
                        </Chip>
                    </FilterGroup>
                )}
            </ModalSheetBody>

            <FilterFooter onReset={() => setDraft(emptyGymSheetFilters)} />
        </form>
    );
}
