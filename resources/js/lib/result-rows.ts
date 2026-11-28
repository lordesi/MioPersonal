import type { TrainerSummary } from '@/types';

/** A row of the results: the trainers of one discipline. */
export type ResultRow = { title: string | null; trainers: TrainerSummary[] };

/** The fewest trainers a discipline needs for a row of its own. */
const ROW_MIN = 2;

/**
 * The results in rows, one under the other (as on Airbnb): one row per main
 * discipline, the biggest first, in the order of the search inside each row;
 * the disciplines with too few trainers go together in "Altri trainer". With
 * a single row there is no title: the count above says it all.
 */
export function resultRows(
    trainers: TrainerSummary[],
    place: string,
): ResultRow[] {
    const byDiscipline = new Map<string, TrainerSummary[]>();

    for (const trainer of trainers) {
        const discipline = trainer.disciplines[0] ?? '';
        byDiscipline.set(discipline, [
            ...(byDiscipline.get(discipline) ?? []),
            trainer,
        ]);
    }

    const rows: ResultRow[] = [];
    const others: TrainerSummary[] = [];

    for (const [discipline, list] of [...byDiscipline].sort(
        ([, a], [, b]) => b.length - a.length,
    )) {
        if (discipline === '' || list.length < ROW_MIN) {
            others.push(...list);
        } else {
            rows.push({ title: `${discipline} ${place}`, trainers: list });
        }
    }

    if (others.length > 0) {
        // The order of the search, not the order of the disciplines.
        others.sort((a, b) => trainers.indexOf(a) - trainers.indexOf(b));
        rows.push({ title: `Altri trainer ${place}`, trainers: others });
    }

    return rows.length === 1 ? [{ title: null, trainers }] : rows;
}
