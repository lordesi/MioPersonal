import { Check, Search } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type MenuOption<T extends string> = { value: T; label: string };

type OptionsMenuProps<T extends string> = {
    /** The button that opens the menu. */
    trigger: ReactNode;
    /** Name of the list for screen readers, e.g. "Disciplina". */
    label: string;
    /** First choice, the one without a filter, e.g. "Tutte le discipline". */
    noneLabel: string;
    options: MenuOption<T>[];
    value: T | null;
    onChange: (value: T | null) => void;
    /** Small heading at the top of the panel, e.g. "Scegli una città". */
    title?: string;
    /** Adds a search field above the list, e.g. "Cerca una città". */
    searchPlaceholder?: string;
    /** As wide as the button that opens it (the parts of the search bar). */
    matchTriggerWidth?: boolean;
    /** Open from outside: the search bar keeps one menu open at a time. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** false: the rest of the page stays clickable while the menu is open. */
    modal?: boolean;
    /** On close the focus goes back to the button: event.preventDefault() stops it. */
    onCloseAutoFocus?: (event: Event) => void;
    align?: 'start' | 'end';
    className?: string;
};

/** Lowercase and without accents, so "forli" finds "Forlì". */
function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

/** A dropdown list with a ✓ on the chosen option, e.g. "Prezzo" or "Ordina". */
export default function OptionsMenu<T extends string>({
    trigger,
    label,
    noneLabel,
    options,
    value,
    onChange,
    title,
    searchPlaceholder,
    matchTriggerWidth = false,
    open,
    onOpenChange,
    modal = true,
    onCloseAutoFocus,
    align = 'start',
    className,
}: OptionsMenuProps<T>) {
    const [query, setQuery] = useState('');
    // Used only when nobody opens the menu from outside.
    const [ownOpen, setOwnOpen] = useState(false);
    const isOpen = open ?? ownOpen;

    const setOpen = (next: boolean) => {
        setOwnOpen(next);
        onOpenChange?.(next);

        if (!next) {
            setQuery('');
        }
    };

    const visible = query
        ? options.filter((option) =>
              normalize(option.label).includes(normalize(query)),
          )
        : options;

    const choices: { value: T | null; label: string }[] = query
        ? visible
        : [{ value: null, label: noneLabel }, ...visible];

    // Enter in the search field picks the first match: "mil" + Enter = Milano.
    const pickFirst = () => {
        if (query && visible.length > 0) {
            onChange(visible[0].value);
            setOpen(false);
        }
    };

    const hasHeader = Boolean(title || searchPlaceholder);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setOpen} modal={modal}>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                sideOffset={8}
                aria-label={label}
                onCloseAutoFocus={onCloseAutoFocus}
                onFocusOutside={(event) => {
                    // On phones the next menu opens on top of the one closing: under
                    // the finger the closing one takes the focus back for a moment.
                    // That is not leaving this menu, so it stays open.
                    const target = event.detail.originalEvent.target;

                    if (
                        target instanceof Element &&
                        target.closest('[role="menu"][data-state="closed"]')
                    ) {
                        event.preventDefault();
                    }
                }}
                className={cn(
                    'flex flex-col rounded-3xl border-border/60 p-0 shadow-2xl duration-200',
                    matchTriggerWidth
                        ? 'w-(--radix-dropdown-menu-trigger-width)'
                        : 'min-w-65',
                    className,
                )}
            >
                {/* Stays still on top; only the list below scrolls. */}
                {hasHeader && (
                    <div className="flex flex-col gap-2.5 px-3 pt-4 pb-2">
                        {title && (
                            <p className="px-2 text-xs font-semibold text-muted-foreground">
                                {title}
                            </p>
                        )}
                        {searchPlaceholder && (
                            <SearchField
                                placeholder={searchPlaceholder}
                                value={query}
                                onChange={setQuery}
                                onSubmit={pickFirst}
                            />
                        )}
                    </div>
                )}
                <div
                    className={cn(
                        'max-h-80 scrollbar-soft overflow-y-auto p-2',
                        hasHeader && 'pt-0',
                    )}
                >
                    {choices.map((choice) => {
                        const selected = choice.value === value;

                        return (
                            <DropdownMenuItem
                                key={choice.value ?? 'none'}
                                role="menuitemradio"
                                aria-checked={selected}
                                onSelect={() => onChange(choice.value)}
                                className={cn(
                                    'min-h-12 justify-between gap-3 rounded-xl px-3 text-[15px]',
                                    selected && 'font-semibold',
                                )}
                            >
                                <span className="truncate">{choice.label}</span>
                                {selected && (
                                    <Check
                                        aria-hidden="true"
                                        strokeWidth={2.5}
                                        className="size-4.5 text-foreground"
                                    />
                                )}
                            </DropdownMenuItem>
                        );
                    })}
                    {choices.length === 0 && (
                        <p className="px-3 py-3 text-[15px] text-muted-foreground">
                            Nessun risultato
                        </p>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function SearchField({
    placeholder,
    value,
    onChange,
    onSubmit,
}: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}) {
    const ref = useRef<HTMLInputElement>(null);

    // The menu puts the focus on itself when it opens: then move it here.
    useEffect(() => {
        const frame = requestAnimationFrame(() => ref.current?.focus());

        return () => cancelAnimationFrame(frame);
    }, []);

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        // Esc still closes the menu.
        if (event.key === 'Escape') {
            return;
        }

        // The menu would use the letters to jump between options: keep them here.
        event.stopPropagation();

        if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
        }

        // ↓ moves from the field to the first option.
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            event.currentTarget
                .closest('[role="menu"]')
                ?.querySelector<HTMLElement>('[role="menuitemradio"]')
                ?.focus();
        }
    };

    return (
        <div className="relative">
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
                ref={ref}
                // Not "search": the browser would add its own blue ✕.
                type="text"
                aria-label={placeholder}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={onKeyDown}
                className="h-11 w-full rounded-full bg-secondary pr-4 pl-10 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            />
        </div>
    );
}
