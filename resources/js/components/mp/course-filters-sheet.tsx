import { useState } from 'react';
import { Chip, FilterFooter, FilterGroup } from '@/components/mp/filter-chips';
import ModalSheet, { ModalSheetBody } from '@/components/mp/modal-sheet';
import { courseDayOptions, courseTimeOptions } from '@/lib/course';
import type { CourseDay, CourseTime } from '@/lib/course';
import type { CatalogOption } from '@/types';

/** Every filter of the courses' search: one value each, null = any. */
export type CourseSheetFilters = {
    disciplina: string | null;
    giorno: CourseDay | null;
    fascia: CourseTime | null;
    livello: string | null;
};

export const emptyCourseSheetFilters: CourseSheetFilters = {
    disciplina: null,
    giorno: null,
    fascia: null,
    livello: null,
};

/** How many filters are on: the number on the "Filtri" button. */
export function countCourseFilters(filters: CourseSheetFilters): number {
    return Object.values(filters).filter(Boolean).length;
}

/**
 * "Filtri" of the courses' search, like the trainers' one. One choice per
 * group: the same chip again goes back to "Tutti".
 */
export default function CourseFiltersSheet({
    open,
    onOpenChange,
    filters,
    disciplines,
    levels,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: CourseSheetFilters;
    disciplines: CatalogOption[];
    /** App\Enums\CourseLevel. */
    levels: CatalogOption[];
    onApply: (filters: CourseSheetFilters) => void;
}) {
    return (
        <ModalSheet open={open} onOpenChange={onOpenChange} title="Filtri">
            {/* Mounted only while open: it starts again from the page's filters. */}
            {open && (
                <CourseFiltersForm
                    initial={filters}
                    disciplines={disciplines}
                    levels={levels}
                    onApply={(next) => {
                        onApply(next);
                        onOpenChange(false);
                    }}
                />
            )}
        </ModalSheet>
    );
}

function CourseFiltersForm({
    initial,
    disciplines,
    levels,
    onApply,
}: {
    initial: CourseSheetFilters;
    disciplines: CatalogOption[];
    levels: CatalogOption[];
    onApply: (filters: CourseSheetFilters) => void;
}) {
    const [draft, setDraft] = useState(initial);

    /** A group of one choice: "Tutti" (null) and its options. */
    const group = <K extends keyof CourseSheetFilters>(
        name: K,
        title: string,
        options: readonly {
            value: NonNullable<CourseSheetFilters[K]>;
            label: string;
        }[],
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
                {group('disciplina', 'Disciplina', disciplines, true)}
                {group('giorno', 'Giorno', courseDayOptions, true)}
                {group('fascia', 'Orario', courseTimeOptions)}
                {group('livello', 'Livello', levels)}
            </ModalSheetBody>

            <FilterFooter onReset={() => setDraft(emptyCourseSheetFilters)} />
        </form>
    );
}
