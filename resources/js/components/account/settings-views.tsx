import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { areaTitleClassName } from '@/components/mp/area-bits';

/**
 * The page of "Impostazioni" open in the address ("#notifiche"): the list
 * without it. Pushed in the history, so the back button of the phone goes
 * back to the list. `aliases`: older links ("#accesso").
 */
export function useSettingsView<View extends string>(
    views: readonly View[],
    aliases: Record<string, View | null> = {},
): [View | null, (next: View | null) => void] {
    const [view, setView] = useState<View | null>(null);
    // Constants of the pages: read once.
    const known = useRef({ views, aliases });

    useEffect(() => {
        const read = () => {
            const key = window.location.hash.replace('#', '');
            const { views: all, aliases: older } = known.current;

            if ((all as readonly string[]).includes(key)) {
                setView(key as View);
            } else {
                setView(older[key] ?? null);
            }
        };

        read();
        window.addEventListener('hashchange', read);

        return () => window.removeEventListener('hashchange', read);
    }, []);

    const open = (next: View | null) => {
        if (next === null) {
            if (window.location.hash !== '') {
                window.history.back();
            }

            setView(null);

            return;
        }

        window.history.pushState(null, '', `#${next}`);
        setView(next);
        window.scrollTo({ top: 0 });
    };

    return [view, open];
}

/** A page of "Impostazioni": "‹ Impostazioni", the title, the content. */
export function SettingsSubpage({
    title,
    onBack,
    children,
}: {
    title: string;
    onBack: () => void;
    children: ReactNode;
}) {
    return (
        <div className="flex max-w-170 flex-col gap-6">
            <div className="flex flex-col gap-1">
                <button
                    type="button"
                    onClick={onBack}
                    className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-base font-semibold text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ChevronLeft aria-hidden="true" className="size-5" />
                    Impostazioni
                </button>
                <h1 className={areaTitleClassName}>{title}</h1>
            </div>
            {children}
        </div>
    );
}
