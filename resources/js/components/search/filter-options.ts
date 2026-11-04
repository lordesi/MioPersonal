import type { SearchFilters } from '@/lib/search';

/*
 * Options and pill look shared by the filters above the results
 * (filter-bar.tsx) and the "Filtri" panel on phones (mobile-filters.tsx).
 */

type Option<Key extends keyof SearchFilters> = {
    value: NonNullable<SearchFilters[Key]>;
    label: string;
};

export const priceOptions: Option<'prezzo'>[] = [
    { value: 'fino-35', label: 'Fino a 35 €' },
    { value: '35-50', label: '35–50 €' },
    { value: '50-75', label: '50–75 €' },
    { value: '75-100', label: '75–100 €' },
    { value: 'oltre-100', label: 'Oltre 100 €' },
];

/** `short` on the button, `label` in "Filtri attivi" and in the panel. */
export const ratingOptions: (Option<'valutazione'> & { short: string })[] = [
    { value: '3', short: '3+', label: '★ 3 e più' },
    { value: '4', short: '4+', label: '★ 4 e più' },
    { value: '4-5', short: '4,5+', label: '★ 4,5 e più' },
];

/** "tutte" = no filter. */
export const modeOptions: {
    value: 'tutte' | NonNullable<SearchFilters['modalita']>;
    label: string;
}[] = [
    { value: 'tutte', label: 'Tutte' },
    { value: 'presenza', label: 'In presenza' },
    { value: 'online', label: 'Online' },
];

/** The round filters above the results; black while on. */
export const pillClassName =
    'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';
export const pillOff =
    'border-input bg-background text-foreground hover:bg-accent';
export const pillOn =
    'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground';
