import { describe, expect, it } from 'vite-plus/test';
import { resultRows } from '@/lib/result-rows';
import type { TrainerSummary } from '@/types';

const trainer = (slug: string, disciplines: string[]): TrainerSummary => ({
    slug,
    name: slug,
    href: `/trainer/${slug}`,
    city: 'Milano',
    disciplines,
    rating: null,
    reviewCount: 0,
    priceFromCents: 4000,
    nextSlotLabel: null,
    online: null,
});

const slugs = (list: TrainerSummary[]) => list.map((item) => item.slug);

describe('resultRows', () => {
    it('keeps a single untitled row when there is nothing to split', () => {
        const same = [trainer('a', ['Pilates']), trainer('b', ['Pilates'])];
        const mixed = [
            trainer('a', ['Pilates']),
            trainer('b', ['Yoga']),
            trainer('c', []),
        ];

        expect(resultRows(same, 'a Milano')).toEqual([
            { title: null, trainers: same },
        ]);
        expect(resultRows(mixed, 'a Milano')).toEqual([
            { title: null, trainers: mixed },
        ]);
    });

    it('makes a row per main discipline, the biggest first', () => {
        const trainers = [
            trainer('a', ['Yoga']),
            trainer('b', ['Pilates']),
            trainer('c', ['Pilates']),
            trainer('d', ['Yoga']),
            trainer('e', ['Pilates']),
            trainer('f', ['Boxe']),
            trainer('g', []),
        ];

        const rows = resultRows(trainers, 'a Milano');

        expect(rows.map((row) => row.title)).toEqual([
            'Pilates a Milano',
            'Yoga a Milano',
            'Altri trainer a Milano',
        ]);
        expect(slugs(rows[0].trainers)).toEqual(['b', 'c', 'e']);
        expect(slugs(rows[1].trainers)).toEqual(['a', 'd']);
        expect(slugs(rows[2].trainers)).toEqual(['f', 'g']);
    });
});
