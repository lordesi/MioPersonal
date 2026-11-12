import { search } from '@/routes/courses';

/**
 * Filters of the courses' search, in the address bar:
 * /corsi/milano?disciplina=pilates&giorno=lun&fascia=sera. Checked by
 * CourseSearchController.
 */
export type CourseSearchFilters = {
    /** Slug of a discipline. */
    disciplina?: string | null;
    giorno?: CourseDay | null;
    fascia?: CourseTime | null;
    /** App\Enums\CourseLevel value. */
    livello?: string | null;
    /** Only the courses with "Prenota il posto" on MioPersonal. */
    online?: '1' | null;
    pagina?: number | null;
};

export type CourseDay = 'lun' | 'mar' | 'mer' | 'gio' | 'ven' | 'sab' | 'dom';
export type CourseTime = 'mattina' | 'pranzo' | 'pomeriggio' | 'sera';

export const courseDayOptions: { value: CourseDay; label: string }[] = [
    { value: 'lun', label: 'Lunedì' },
    { value: 'mar', label: 'Martedì' },
    { value: 'mer', label: 'Mercoledì' },
    { value: 'gio', label: 'Giovedì' },
    { value: 'ven', label: 'Venerdì' },
    { value: 'sab', label: 'Sabato' },
    { value: 'dom', label: 'Domenica' },
];

export const courseTimeOptions: { value: CourseTime; label: string }[] = [
    { value: 'mattina', label: 'Mattina (prima delle 12)' },
    { value: 'pranzo', label: 'Pausa pranzo (12–15)' },
    { value: 'pomeriggio', label: 'Pomeriggio (15–18)' },
    { value: 'sera', label: 'Sera (dalle 18)' },
];

/** Like gymSearchUrl() (lib/gym.ts), for /corsi. */
export function courseSearchUrl(
    filters: CourseSearchFilters = {},
    city?: string | null,
): string {
    const query = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value)),
    );

    return city
        ? search.url({ city }, { query })
        : search.url(undefined, { query });
}
