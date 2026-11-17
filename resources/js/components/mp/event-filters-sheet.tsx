import { useState } from 'react';
import { Chip, FilterFooter, FilterGroup } from '@/components/mp/filter-chips';
import ModalSheet, { ModalSheetBody } from '@/components/mp/modal-sheet';
import { WHEN_OPTIONS } from '@/lib/events';
import type { CatalogOption } from '@/types';

/** Every filter of the events' search: one value each, null = any. */
export type EventSheetFilters = {
    quando: string | null;
    tipo: string | null;
    disciplina: string | null;
};

export const emptyEventSheetFilters: EventSheetFilters = {
    quando: null,
    tipo: null,
    disciplina: null,
};

/** How many filters are on: the number on the "Filtri" button. */
export function countEventFilters(filters: EventSheetFilters): number {
    return Object.values(filters).filter(Boolean).length;
}

/**
 * "Filtri" of the events' search, like the courses' one: when, type and
 * discipline. One choice per group: the same chip again goes back to "Tutti".
 */
export default function EventFiltersSheet({
    open,
    onOpenChange,
    filters,
    types,
    disciplines,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: EventSheetFilters;
    /** App\Enums\GroupSessionType. */
    types: CatalogOption[];
    disciplines: CatalogOption[];
    onApply: (filters: EventSheetFilters) => void;
}) {
    return (
        <ModalSheet open={open} onOpenChange={onOpenChange} title="Filtri">
            {/* Mounted only while open: it starts again from the page's filters. */}
            {open && (
                <EventFiltersForm
                    initial={filters}
                    types={types}
                    disciplines={disciplines}
                    onApply={(next) => {
                        onApply(next);
                        onOpenChange(false);
                    }}
                />
            )}
        </ModalSheet>
    );
}

function EventFiltersForm({
    initial,
    types,
    disciplines,
    onApply,
}: {
    initial: EventSheetFilters;
    types: CatalogOption[];
    disciplines: CatalogOption[];
    onApply: (filters: EventSheetFilters) => void;
}) {
    const [draft, setDraft] = useState(initial);

    /** A group of one choice: "Tutti" (null) and its options. */
    const group = (
        name: keyof EventSheetFilters,
        title: string,
        options: readonly CatalogOption[],
        scroll = false,
    ) => (
        <FilterGroup title={title} scroll={scroll}>
            <Chip
                pressed={draft[name] === null}
                onClick={() => setDraft({ ...draft, [name]: null })}
            >
                Tutti
            </Chip>
            {options.map((option) => (
                <Chip
                    key={option.value}
                    pressed={draft[name] === option.value}
                    onClick={() =>
                        setDraft({
                            ...draft,
                            [name]:
                                draft[name] === option.value
                                    ? null
                                    : option.value,
                        })
                    }
                >
                    {option.label}
                </Chip>
            ))}
        </FilterGroup>
    );

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onApply(draft);
            }}
            className="flex min-h-0 flex-1 flex-col"
        >
            <ModalSheetBody className="flex flex-col gap-5.5">
                {group('quando', 'Quando', WHEN_OPTIONS)}
                {group('tipo', 'Tipo', types)}
                {group('disciplina', 'Disciplina', disciplines, true)}
            </ModalSheetBody>

            <FilterFooter onReset={() => setDraft(emptyEventSheetFilters)} />
        </form>
    );
}
