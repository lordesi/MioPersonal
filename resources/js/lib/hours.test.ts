import { describe, expect, it } from 'vite-plus/test';
import { nextRange } from '@/lib/hours';

const at = (hours: number) => hours * 60;

describe('nextRange', () => {
    it('proposes 09:00–11:00 on an empty day', () => {
        expect(nextRange([])).toEqual({ start: at(9), end: at(11) });
    });

    it('starts where the last range of the day ends', () => {
        expect(
            nextRange([
                { start: at(7), end: at(12) },
                { start: at(18), end: at(21) },
            ]),
        ).toEqual({ start: at(21), end: at(23) });
    });

    it('stops at 24:00', () => {
        expect(nextRange([{ start: at(9), end: at(23) }])).toEqual({
            start: at(23),
            end: at(24),
        });
    });

    it('uses the first free time when the day goes on until 24:00', () => {
        expect(
            nextRange([
                { start: at(6), end: at(8) },
                { start: at(9), end: at(24) },
            ]),
        ).toEqual({ start: at(8), end: at(9) });
        expect(nextRange([{ start: at(12), end: at(24) }])).toEqual({
            start: at(6),
            end: at(8),
        });
    });

    it('proposes the last half hour when there is no free time', () => {
        expect(nextRange([{ start: at(6), end: at(24) }])).toEqual({
            start: at(23.5),
            end: at(24),
        });
    });
});
