import { search } from '@/routes/trainers';

/**
 * Filters of the search page. The names are in Italian because they appear
 * in the address bar, e.g. /personal-trainer/milano?disciplina=pilates.
 * The server checks them in TrainerSearchController.
 */
export type SearchFilters = {
    disciplina?: string | null;
    zona?: string | null;
    modalita?: 'presenza' | 'online' | null;
    disponibilita?: 'oggi' | '3-giorni' | 'settimana' | null;
    prezzo?: 'fino-35' | '35-45' | '45-60' | 'oltre-60' | null;
    valutazione?: '4-5' | null;
    domicilio?: '1' | null;
    ordina?: 'slot' | 'prezzo' | 'valutazione' | null;
    pagina?: number | null;
};

/** URL of the search page, keeping only the filters that are set. */
export function searchUrl(filters: SearchFilters = {}): string {
    const query = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value)),
    );

    return search.url({ query });
}
