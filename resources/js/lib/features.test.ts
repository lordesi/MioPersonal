import { describe, expect, it } from 'vite-plus/test';
import { withFeatures } from '@/lib/features';
import type { FeatureName } from '@/lib/features';

const menu: { title: string; feature?: FeatureName }[] = [
    { title: 'Personal trainer' },
    { title: 'Palestre', feature: 'gyms' },
    { title: 'Corsi', feature: 'courses' },
    { title: 'Eventi', feature: 'events' },
    { title: 'Novità' },
];

const titles = (items: { title: string }[]) => items.map((item) => item.title);

describe('withFeatures', () => {
    it('keeps only the trainers’ items while everything else is off', () => {
        expect(
            titles(
                withFeatures(menu, {
                    gyms: false,
                    courses: false,
                    events: false,
                }),
            ),
        ).toEqual(['Personal trainer', 'Novità']);
    });

    it('brings back each part on its own', () => {
        expect(
            titles(
                withFeatures(menu, {
                    gyms: false,
                    courses: false,
                    events: true,
                }),
            ),
        ).toEqual(['Personal trainer', 'Eventi', 'Novità']);
        expect(
            titles(
                withFeatures(menu, { gyms: true, courses: true, events: true }),
            ),
        ).toEqual(titles(menu));
    });
});
