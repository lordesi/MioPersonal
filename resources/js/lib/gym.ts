import { search } from '@/routes/gyms';

/**
 * Filters of the gyms' search, in the address bar:
 * /palestre/milano?servizi=piscina,sauna&prezzo=30-50. Checked by
 * GymSearchController.
 */
export type GymSearchFilters = {
    /** Words of the gym's name. */
    nome?: string | null;
    /** Only the gyms the client saved. */
    preferiti?: '1' | null;
    /** App\Enums\GymAmenity values: the gym must have all of them. */
    servizi?: string[] | null;
    prezzo?: GymPriceRange | null;
    /** Only gyms with a promotion running today. */
    promo?: '1' | null;
    ordina?: 'prezzo' | 'trainer' | null;
    pagina?: number | null;
};

export type GymPriceRange = 'fino-30' | '30-50' | '50-80' | 'oltre-80';

/** "Budget mensile": the cheapest plan over one month. */
export const gymPriceOptions: { value: GymPriceRange; label: string }[] = [
    { value: 'fino-30', label: 'Fino a 30 €/mese' },
    { value: '30-50', label: '30–50 €/mese' },
    { value: '50-80', label: '50–80 €/mese' },
    { value: 'oltre-80', label: 'Oltre 80 €/mese' },
];

export const gymSortOptions: {
    value: NonNullable<GymSearchFilters['ordina']>;
    label: string;
}[] = [
    { value: 'prezzo', label: 'Prezzo più basso' },
    { value: 'trainer', label: 'Più trainer' },
];

/** Like searchUrl() (lib/search.ts), for /palestre. */
export function gymSearchUrl(
    filters: GymSearchFilters = {},
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

    return url.replaceAll('%2C', ',');
}

/** "45 €/mese" or "Prezzi in palestra" without plans. */
export function monthlyLabel(cents: number | null): string | null {
    if (cents === null) {
        return null;
    }

    const euros = new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);

    return `da ${euros}/mese`;
}
