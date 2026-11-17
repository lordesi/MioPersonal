import type { SearchFilters } from '@/lib/search';

/*
 * The options of the trainer filters ("Filtri" of the search,
 * mp/filters-sheet.tsx).
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
