import type { LucideIcon } from 'lucide-react';
import { useId, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ComboOption = { value: string; label: string };

type ComboFieldProps = {
    /** For screen readers: "Cosa", "Dove". */
    label: string;
    icon: LucideIcon;
    placeholder: string;
    options: readonly ComboOption[];
    /** What is written in the field. */
    text: string;
    /** Every key typed: the chosen option is gone. */
    onTextChange: (text: string) => void;
    onSelect: (option: ComboOption) => void;
    /** Above the suggestions, e.g. "Usa la mia posizione". */
    header?: ReactNode;
    type?: 'search' | 'text';
    autoComplete?: string;
    /** "lg" in the hero of the home (52px), "md" in the search page (48px). */
    size?: 'md' | 'lg';
    /**
     * "outline": grey ring, white bold text (on the photos). "filled": grey
     * fill, grey placeholder, the one field of the phones' search page.
     */
    tone?: 'outline' | 'filled';
    className?: string;
};

const MAX_SUGGESTIONS = 8;

/** "pesi" finds "Pesi e bodybuilding"; accents don't count. */
const fold = (text: string) =>
    text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();

/**
 * A round field with suggestions under it (ARIA combobox): free text is
 * allowed, a suggestion fills the field. Arrows move among the
 * suggestions, Enter picks one, Escape closes the list.
 */
export default function ComboField({
    label,
    icon: Icon,
    placeholder,
    options,
    text,
    onTextChange,
    onSelect,
    header,
    type = 'text',
    autoComplete = 'off',
    size = 'lg',
    tone = 'outline',
    className,
}: ComboFieldProps) {
    const id = useId();
    const listId = `${id}-list`;
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);

    const query = fold(text);
    const matches = (
        query === ''
            ? options
            : options.filter((option) => fold(option.label).includes(query))
    ).slice(0, MAX_SUGGESTIONS);
    const showList = open && (matches.length > 0 || header !== undefined);

    const pick = (option: ComboOption) => {
        onSelect(option);
        setOpen(false);
        setActive(-1);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            const step = event.key === 'ArrowDown' ? 1 : -1;
            setActive((index) =>
                matches.length === 0
                    ? -1
                    : (index + step + matches.length) % matches.length,
            );
        } else if (event.key === 'Enter' && showList && active >= 0) {
            // Picks the suggestion instead of sending the form.
            event.preventDefault();
            pick(matches[active]);
        } else if (event.key === 'Escape' && open) {
            event.preventDefault();
            setOpen(false);
        }
    };

    return (
        <div className={cn('relative min-w-0', className)}>
            <label
                className={cn(
                    tone === 'filled'
                        ? 'flex min-h-11 items-center gap-2.5 rounded-full bg-[#7676803d] px-3.5 text-muted-foreground focus-within:bg-[#78788052]'
                        : cn(
                              'field-pill px-5 text-foreground',
                              size === 'lg' ? 'min-h-13' : 'min-h-12 px-4.5',
                          ),
                )}
            >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span className="sr-only">{label}</span>
                <input
                    type={type}
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        showList && active >= 0
                            ? `${listId}-${active}`
                            : undefined
                    }
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    value={text}
                    onChange={(event) => {
                        onTextChange(event.target.value);
                        setOpen(true);
                        setActive(-1);
                    }}
                    onFocus={() => setOpen(true)}
                    // Later than a click on a suggestion.
                    onBlur={() => setTimeout(() => setOpen(false), 120)}
                    onKeyDown={onKeyDown}
                    className={cn(
                        'h-11 min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:opacity-100 [&::-webkit-search-cancel-button]:hidden',
                        tone === 'filled'
                            ? 'text-[17px] tracking-[-0.43px] placeholder:text-muted-foreground'
                            : cn(
                                  'font-semibold placeholder:text-foreground',
                                  size === 'lg' ? 'text-[17px]' : 'text-base',
                              ),
                    )}
                />
            </label>

            {showList && (
                <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_16px_48px_-8px_rgba(0,0,0,0.75)]">
                    {header}
                    <ul
                        id={listId}
                        role="listbox"
                        aria-label={label}
                        className="max-h-72 scrollbar-soft overflow-y-auto"
                    >
                        {matches.map((option, index) => (
                            <li
                                key={option.value}
                                id={`${listId}-${index}`}
                                role="option"
                                aria-selected={index === active}
                                // Keeps the focus in the field.
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => pick(option)}
                                className="flex min-h-11 cursor-pointer items-center rounded-2xl px-3 text-[15px] hover:bg-accent aria-selected:bg-accent"
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

/** The option written in full (any case and accents), or null. */
export function findOption(
    options: readonly ComboOption[],
    text: string,
): ComboOption | null {
    const query = fold(text);

    return query === ''
        ? null
        : (options.find((option) => fold(option.label) === query) ?? null);
}
