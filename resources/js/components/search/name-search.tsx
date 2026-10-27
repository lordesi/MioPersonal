import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** How long to wait after the last key before searching. */
const TYPING_PAUSE_MS = 300;

/** Like the server: no spaces at the ends, no double ones; empty = no filter. */
const cleanName = (text: string) => text.trim().replace(/\s+/g, ' ') || null;

type NameSearchProps = {
    /** The name in the URL, null = no name filter. */
    applied: string | null;
    onSearch: (name: string | null) => void;
    className?: string;
};

/**
 * "Cerca per nome" pill. It searches by itself after a short pause in typing
 * (or right away with Enter): no new search at every letter.
 */
export default function NameSearch({
    applied,
    onSearch,
    className,
}: NameSearchProps) {
    const [draft, setDraft] = useState(applied ?? '');
    // The last name this field searched, and the last one seen in the URL.
    const [sent, setSent] = useState(applied);
    const [seen, setSeen] = useState(applied);
    const input = useRef<HTMLInputElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Its own search coming back doesn't touch the text (the letters typed
    // meanwhile stay). Changed from outside ("Filtri attivi", "Cancella i
    // filtri"): the text follows it.
    if (applied !== seen) {
        setSeen(applied);

        if (applied !== sent) {
            setDraft(applied ?? '');
            setSent(applied);
        }
    }

    // The field goes away: no search after it.
    useEffect(() => () => clearTimeout(timer.current), []);

    const send = (text: string) => {
        clearTimeout(timer.current);
        const name = cleanName(text);

        if (name !== sent) {
            setSent(name);
            onSearch(name);
        }
    };

    const clear = () => {
        setDraft('');
        send('');
        // The × goes away: the focus goes back to the field.
        input.current?.focus();
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                send(draft);
            }}
            className={cn('relative', className)}
        >
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                ref={input}
                value={draft}
                onChange={(event) => {
                    const text = event.target.value;
                    setDraft(text);
                    clearTimeout(timer.current);
                    timer.current = setTimeout(
                        () => send(text),
                        TYPING_PAUSE_MS,
                    );
                }}
                aria-label="Nome del trainer"
                placeholder="Cerca per nome"
                maxLength={100}
                enterKeyHint="search"
                autoComplete="off"
                className={cn(
                    'h-11 rounded-full bg-background pl-9.5 text-sm md:text-sm',
                    draft && 'pr-10',
                    // Applied: the dark border, like the other filters when on.
                    applied && 'border-primary',
                )}
            />
            {draft && (
                <button
                    type="button"
                    aria-label="Cancella il nome"
                    onClick={clear}
                    className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <X
                        aria-hidden="true"
                        strokeWidth={2.5}
                        className="size-3.5"
                    />
                </button>
            )}
        </form>
    );
}
