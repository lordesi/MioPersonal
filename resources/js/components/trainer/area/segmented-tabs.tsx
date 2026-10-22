import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export type SegmentedTab<T extends string> = {
    value: T;
    label: string;
    count: number;
};

type SegmentedTabsProps<T extends string> = {
    /** Read aloud for the whole group, e.g. "Filtra richieste". */
    label: string;
    tabs: SegmentedTab<T>[];
    value: T;
    onChange: (value: T) => void;
    /** id of the list the tabs filter. */
    controls?: string;
};

/**
 * The grey group of tabs with a counter of "Richieste" and "Recensioni"
 * (docs/design): the selected one is black. Arrows move between the tabs.
 */
export default function SegmentedTabs<T extends string>({
    label,
    tabs,
    value,
    onChange,
    controls,
}: SegmentedTabsProps<T>) {
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);

    const onKeyDown = (event: KeyboardEvent, index: number) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];

        if (step === undefined) {
            return;
        }

        event.preventDefault();
        const next = (index + step + tabs.length) % tabs.length;
        onChange(tabs[next].value);
        buttons.current[next]?.focus();
    };

    return (
        <div
            role="tablist"
            aria-label={label}
            className="flex w-full gap-0.5 rounded-xl bg-border p-0.75 sm:w-auto"
        >
            {tabs.map((tab, index) => {
                const active = tab.value === value;

                return (
                    <button
                        key={tab.value}
                        ref={(element) => {
                            buttons.current[index] = element;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={controls}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(tab.value)}
                        onKeyDown={(event) => onKeyDown(event, index)}
                        className={cn(
                            // On phones the tabs share the whole width.
                            'inline-flex h-9.5 flex-1 items-center justify-center gap-1.5 rounded-[9px] px-2 text-[13px] whitespace-nowrap sm:flex-none sm:gap-2 sm:pr-2 sm:pl-3.5 sm:text-sm',
                            active
                                ? 'bg-sidebar font-semibold text-sidebar-foreground'
                                : 'font-medium text-foreground/70 hover:text-foreground',
                        )}
                    >
                        {tab.label}
                        <span
                            className={cn(
                                'inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-card px-1.5 text-xs font-bold tabular-nums',
                                active
                                    ? 'text-foreground'
                                    : 'text-foreground/70',
                            )}
                        >
                            {tab.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
