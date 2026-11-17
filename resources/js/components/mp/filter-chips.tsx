import type { ReactNode } from 'react';
import { ModalSheetFooter } from '@/components/mp/modal-sheet';
import { cn } from '@/lib/utils';

/** A group of chips in a "Filtri" window: "Disciplina", "Servizi"… */
export function FilterGroup({
    title,
    scroll = false,
    children,
}: {
    title: string;
    /** On phones one row that scrolls sideways, as in the design. */
    scroll?: boolean;
    children: ReactNode;
}) {
    return (
        <fieldset className="min-w-0">
            <legend className="mb-2.5 text-[15px] font-semibold">
                {title}
            </legend>
            <div
                className={cn(
                    'flex flex-wrap gap-2',
                    scroll &&
                        'max-md:-mx-6 max-md:[scrollbar-width:none] max-md:flex-nowrap max-md:overflow-x-auto max-md:px-6 max-md:[&::-webkit-scrollbar]:hidden',
                )}
            >
                {children}
            </div>
        </fieldset>
    );
}

/** One chip: on with the turquoise outline (the `chip` utility). */
export function Chip({
    pressed,
    onClick,
    children,
}: {
    pressed: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className="chip"
        >
            {children}
        </button>
    );
}

/**
 * The bottom of a "Filtri" window: "Azzera" (desktop only, as in the
 * design: on phones "Tutte" does it) and "Applica", which sends the form.
 */
export function FilterFooter({ onReset }: { onReset: () => void }) {
    return (
        <ModalSheetFooter>
            <button
                type="button"
                onClick={onReset}
                className="hidden min-h-11 px-2 text-[15px] font-semibold underline underline-offset-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:block"
            >
                Azzera
            </button>
            <button
                type="submit"
                className="btn-brand h-12.5 flex-1 text-[17px] md:max-w-55"
            >
                Applica
            </button>
        </ModalSheetFooter>
    );
}

/** A list filter: adds or removes one value. */
export function toggleIn<T extends string>(list: T[], value: T): T[] {
    return list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
}
