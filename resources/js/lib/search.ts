import type { TrainingGoal } from '@/lib/goals';
import { search } from '@/routes/trainers';

/**
 * Filters of the search page. The names are in Italian because they appear
 * in the address bar, e.g. /personal-trainer/roma?disciplina=pilates.
 * The server checks them in TrainerSearchController.
 */
export type SearchFilters = {
    /** One or more slugs: the trainer must do all of them. */
    disciplina?: string[] | null;
    /** One or more goals: the trainer must work on all of them. */
    obiettivo?: TrainingGoal[] | null;
    modalita?: 'presenza' | 'online' | null;
    disponibilita?: 'oggi' | '3-giorni' | 'settimana' | null;
    prezzo?: 'fino-35' | '35-50' | '50-75' | '75-100' | 'oltre-100' | null;
    valutazione?: '3' | '4' | '4-5' | null;
    domicilio?: '1' | null;
    /** Only the client's saved trainers. */
    preferiti?: '1' | null;
    ordina?: 'slot' | 'prezzo' | 'valutazione' | null;
    pagina?: number | null;
};

/**
 * URL of the search page, keeping only the filters that are set.
 * The city goes in the path (/personal-trainer/roma); without it, all of Italy.
 * Lists go in one value separated by commas: ?disciplina=crossfit,calisthenics.
 */
export function searchUrl(
    filters: SearchFilters = {},
    city?: string | null,
): string {
    const query = Object.fromEntries(
        Object.entries(filters)
            .map(([name, value]) => [
                name,
                Array.isArray(value) ? value.join(',') : value,
            ])
            .filter(([, value]) => Boolean(value)),
    );

    const url = city
        ? search.url({ city }, { query })
        : search.url(undefined, { query });

    // The browser would write the commas as %2C: the plain ones read better.
    return url.replaceAll('%2C', ',');
}
