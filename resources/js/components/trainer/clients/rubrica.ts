import type { TrainerClient } from '@/types';

export type RubricaGroup = { letter: string; clients: TrainerClient[] };

/** The first letter without accents ("Élisa" → "E"); anything else is "#". */
function letterOf(name: string): string {
    const first = name
        .trim()
        .charAt(0)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase();

    return /^[A-Z]$/.test(first) ? first : '#';
}

/** "Rubrica": the clients in alphabetical order, one group per letter ("#" last). */
export function groupByLetter(clients: TrainerClient[]): RubricaGroup[] {
    const sorted = [...clients].sort((a, b) =>
        a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }),
    );
    const groups: RubricaGroup[] = [];

    for (const client of sorted) {
        const letter = letterOf(client.name);
        const group = groups.find((item) => item.letter === letter);

        if (group) {
            group.clients.push(client);
        } else {
            groups.push({ letter, clients: [client] });
        }
    }

    return groups.sort((a, b) =>
        a.letter === '#' ? 1 : b.letter === '#' ? -1 : 0,
    );
}
