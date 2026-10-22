import { Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import OptionsMenu from '@/components/search/options-menu';
import type { MenuOption } from '@/components/search/options-menu';
import { Button } from '@/components/ui/button';
import type { SearchFilters } from '@/lib/search';
import { cn } from '@/lib/utils';

type Availability = NonNullable<SearchFilters['disponibilita']>;

export type SearchChoices = {
    /** Discipline slugs: none, one or more. */
    disciplina: string[];
    city: string | null;
    disponibilita: Availability | null;
};

/*
 * Classes for each look, written out in full so Tailwind can find them.
 * search: the pill above the results (desktop only, the page hides it on mobile).
 * hero: bigger, on the dark home hero; on mobile the fields go one under the other.
 */
const variants = {
    search: {
        bar: 'h-16.5 max-w-220 border bg-card pr-2 shadow-md',
        field: 'h-16 px-5.5',
        // Room for the × on the right when something is chosen.
        fieldWithValue: 'pr-12',
        clear: 'right-3',
        value: 'text-sm',
        divider: '',
        button: 'h-12.5 px-5 text-[15px]',
    },
    hero: {
        bar: 'flex-col items-stretch rounded-3xl bg-background p-2 text-foreground shadow-2xl md:h-19 md:flex-row md:items-center md:rounded-full md:p-0 md:pr-2.5',
        field: 'h-16 px-5 md:h-18.5 md:px-7',
        fieldWithValue: 'pr-12 md:pr-14',
        clear: 'right-3 md:right-4',
        value: 'text-[15px] leading-[22px]',
        divider: 'hidden md:block',
        button: 'mt-1.5 h-14 px-7 text-base md:mt-0',
    },
} as const;

type Variant = (typeof variants)[keyof typeof variants];

/** The three parts of the pill, in order: choosing one opens the next. */
type FieldName = 'cosa' | 'dove' | 'quando';

type SearchBarProps = {
    disciplines: MenuOption<string>[];
    cities: MenuOption<string>[];
    availabilityOptions: MenuOption<Availability>[];
    /** The choices of the search on screen. */
    applied: SearchChoices;
    onSearch: (choices: SearchChoices) => void;
    /** See `variants` above. */
    variant?: keyof typeof variants;
};

/**
 * "Cosa · Dove · Quando" pill. The choices stay here until "Cerca".
 * On the search page the parent gives it a new `key` when the applied filters
 * change (e.g. one removed from "Filtri attivi"), so it starts again from them.
 */
export default function SearchBar({
    disciplines,
    cities,
    availabilityOptions,
    applied,
    onSearch,
    variant = 'search',
}: SearchBarProps) {
    const [draft, setDraft] = useState(applied);
    // One menu open at a time, like Airbnb.
    const [openField, setOpenField] = useState<FieldName | null>(null);
    // True between a choice and the closing of its menu (see `menu` below).
    const advancing = useRef(false);
    const searchButton = useRef<HTMLButtonElement>(null);
    const styles = variants[variant];

    /** Saves the choice and opens the next part; after "Quando", "Cerca". */
    const choose = (
        changes: Partial<SearchChoices>,
        next: FieldName | null,
    ) => {
        setDraft((current) => ({ ...current, ...changes }));
        advancing.current = true;
        setOpenField(next);
    };

    const clear = (changes: Partial<SearchChoices>) =>
        setDraft((current) => ({ ...current, ...changes }));

    /** Ties a part of the pill to the one open menu. */
    const menu = (field: FieldName) => ({
        open: openField === field,
        onOpenChange: (open: boolean) =>
            // Clicking another part while this one is open: that one stays open.
            setOpenField((current) =>
                open ? field : current === field ? null : current,
            ),
        onCloseAutoFocus: (event: Event) => {
            if (!advancing.current) {
                return;
            }

            // The menu would move the focus back to its part: the next one has it.
            event.preventDefault();
            advancing.current = false;

            if (field === 'quando') {
                searchButton.current?.focus();
            }
        },
    });

    return (
        <div className={cn('flex items-center rounded-full', styles.bar)}>
            <Field
                label="Cosa"
                title="Scegli una o più discipline"
                noneLabel="Tutte le discipline"
                options={disciplines}
                // More than one: the menu stays open, "Dove" is the next click.
                multiple
                value={draft.disciplina}
                onChange={(disciplina) => clear({ disciplina })}
                onClear={() => clear({ disciplina: [] })}
                styles={styles}
                {...menu('cosa')}
            />
            <Divider className={styles.divider} />
            <Field
                label="Dove"
                title="Scegli una città"
                noneLabel="Tutta Italia"
                options={cities}
                value={draft.city}
                onChange={(city) => choose({ city }, 'quando')}
                onClear={() => clear({ city: null })}
                searchPlaceholder="Cerca una città"
                styles={styles}
                {...menu('dove')}
            />
            <Divider className={styles.divider} />
            <Field
                label="Quando"
                title="Quando vuoi allenarti?"
                noneLabel="Qualsiasi giorno"
                options={availabilityOptions}
                value={draft.disponibilita}
                onChange={(disponibilita) => choose({ disponibilita }, null)}
                onClear={() => clear({ disponibilita: null })}
                styles={styles}
                {...menu('quando')}
            />
            <Button
                ref={searchButton}
                type="button"
                onClick={() => onSearch(draft)}
                className={cn(
                    'shrink-0 rounded-full font-semibold',
                    styles.button,
                )}
            >
                <Search
                    aria-hidden="true"
                    strokeWidth={2.5}
                    className="size-4.5"
                />
                Cerca
            </Button>
        </div>
    );
}

function Divider({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn('h-8 w-px shrink-0 bg-border', className)}
        />
    );
}

type FieldProps<T extends string> = {
    label: string;
    title: string;
    noneLabel: string;
    options: MenuOption<T>[];
    onClear: () => void;
    searchPlaceholder?: string;
    styles: Variant;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCloseAutoFocus: (event: Event) => void;
} & (
    | { multiple?: false; value: T | null; onChange: (value: T | null) => void }
    | { multiple: true; value: T[]; onChange: (value: T[]) => void }
);

/**
 * One part of the pill: name in bold, choice below (more choices separated
 * by commas), × to empty it.
 */
function Field<T extends string>(props: FieldProps<T>) {
    const {
        label,
        title,
        noneLabel,
        options,
        onClear,
        searchPlaceholder,
        styles,
        open,
        onOpenChange,
        onCloseAutoFocus,
    } = props;
    const trigger = useRef<HTMLButtonElement>(null);
    const chosen = options.filter((option) =>
        props.multiple
            ? props.value.includes(option.value)
            : option.value === props.value,
    );
    const hasValue = chosen.length > 0;
    const valueLabel =
        chosen.map((option) => option.label).join(', ') || noneLabel;

    const menu = {
        label,
        title,
        noneLabel,
        options,
        searchPlaceholder,
        matchTriggerWidth: true,
        open,
        onOpenChange,
        // Another part of the pill can be clicked while this menu is open.
        modal: false,
        onCloseAutoFocus,
        trigger: (
            <button
                ref={trigger}
                type="button"
                aria-label={`${label}: ${valueLabel}`}
                className={cn(
                    'flex w-full flex-col justify-center gap-px rounded-full text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent',
                    styles.field,
                    hasValue && styles.fieldWithValue,
                )}
            >
                <span className="text-xs font-bold">{label}</span>
                <span
                    className={cn(
                        'truncate text-muted-foreground',
                        styles.value,
                    )}
                >
                    {valueLabel}
                </span>
            </button>
        ),
    };

    return (
        <div
            data-open={open || undefined}
            className="group relative min-w-0 flex-1"
        >
            {props.multiple ? (
                <OptionsMenu
                    {...menu}
                    multiple
                    value={props.value}
                    onChange={props.onChange}
                />
            ) : (
                <OptionsMenu
                    {...menu}
                    value={props.value}
                    onChange={props.onChange}
                />
            )}
            {/*
             * Next to the button, not inside it: a button can't hold another one.
             * Seen on hover, with the menu open or with the keyboard focus;
             * always on touch screens, where there is no hover.
             */}
            {hasValue && (
                <button
                    type="button"
                    aria-label={`Cancella ${label}`}
                    onClick={() => {
                        onClear();
                        // The × goes away: the focus goes back to the field.
                        trigger.current?.focus();
                    }}
                    className={cn(
                        'absolute top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background opacity-0 shadow-sm outline-none group-focus-within:opacity-100 group-hover:opacity-100 group-data-open:opacity-100 hover:bg-border focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:opacity-100',
                        styles.clear,
                    )}
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
}
