import { describe, expect, it } from 'vite-plus/test';
import {
    changesPayload,
    closedBlocks,
    datesBetween,
    dayChanges,
    setDay,
} from '@/lib/day-overrides';

const morning = [{ start: 540, end: 720 }];
const evening = [{ start: 1080, end: 1200 }];

describe('dayChanges', () => {
    it('spreads the blocks into days with their note', () => {
        expect(
            dayChanges([
                {
                    from: '2026-12-24',
                    to: '2026-12-25',
                    closed: true,
                    note: 'Ferie',
                    bookings: 0,
                    days: [
                        { date: '2026-12-24', hours: [] },
                        { date: '2026-12-25', hours: [] },
                    ],
                },
            ]),
        ).toEqual({
            '2026-12-24': { hours: [], note: 'Ferie' },
            '2026-12-25': { hours: [], note: 'Ferie' },
        });
    });
});

describe('changesPayload', () => {
    it('sends only the days changed and the ones taken away', () => {
        const saved = {
            '2026-12-01': { hours: [], note: null },
            '2026-12-02': { hours: morning, note: null },
        };
        const current = {
            '2026-12-02': { hours: evening, note: null },
            '2026-12-03': { hours: [], note: 'Gara' },
        };

        expect(changesPayload(saved, current)).toEqual({
            days: [
                { date: '2026-12-02', hours: evening, note: null },
                { date: '2026-12-03', hours: [], note: 'Gara' },
            ],
            reset: ['2026-12-01'],
        });
        expect(changesPayload(saved, saved)).toEqual({ days: [], reset: [] });
    });
});

describe('setDay', () => {
    it('forgets a day that has its weekly hours again', () => {
        const days = { '2026-12-02': { hours: [], note: null } };

        expect(setDay(days, '2026-12-02', evening, evening)).toEqual({});
        expect(setDay(days, '2026-12-02', morning, evening)).toEqual({
            '2026-12-02': { hours: morning, note: null },
        });
    });
});

describe('closedBlocks', () => {
    it('joins the closed days in a row with the same note', () => {
        expect(
            closedBlocks({
                '2026-12-08': { hours: [], note: 'Festivo' },
                '2026-12-24': { hours: [], note: 'Ferie' },
                '2026-12-25': { hours: [], note: 'Ferie' },
                '2026-12-26': { hours: [], note: null },
                '2026-12-27': { hours: morning, note: null },
            }),
        ).toEqual([
            {
                from: '2026-12-08',
                to: '2026-12-08',
                note: 'Festivo',
                dates: ['2026-12-08'],
            },
            {
                from: '2026-12-24',
                to: '2026-12-25',
                note: 'Ferie',
                dates: ['2026-12-24', '2026-12-25'],
            },
            {
                from: '2026-12-26',
                to: '2026-12-26',
                note: null,
                dates: ['2026-12-26'],
            },
        ]);
    });
});

describe('datesBetween', () => {
    it('lists the days across the months', () => {
        expect(datesBetween('2026-11-30', '2026-12-02')).toEqual([
            '2026-11-30',
            '2026-12-01',
            '2026-12-02',
        ]);
    });
});
