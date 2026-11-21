import { describe, expect, it } from 'vite-plus/test';
import { deviceToday, shiftMonth, shiftYearMonth } from '@/lib/calendar';

describe('shiftYearMonth', () => {
    it('moves inside the year', () => {
        expect(shiftYearMonth(2026, 3, 2)).toEqual({ year: 2026, month: 5 });
    });

    it('crosses the end and the start of the year', () => {
        expect(shiftYearMonth(2026, 11, 1)).toEqual({ year: 2026, month: 12 });
        expect(shiftYearMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
        expect(shiftYearMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
        expect(shiftYearMonth(2026, 2, -14)).toEqual({ year: 2024, month: 12 });
    });

    it('stays put with 0', () => {
        expect(shiftYearMonth(2026, 7, 0)).toEqual({ year: 2026, month: 7 });
    });
});

describe('shiftMonth', () => {
    it('moves a "YYYY-MM" month, with the zero', () => {
        expect(shiftMonth('2026-10', 2)).toBe('2026-12');
        expect(shiftMonth('2026-12', 1)).toBe('2027-01');
        expect(shiftMonth('2026-01', -1)).toBe('2025-12');
        expect(shiftMonth('2026-05', -24)).toBe('2024-05');
    });
});

describe('deviceToday', () => {
    it('is the day on the device clock, with the zeros', () => {
        expect(deviceToday(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
        expect(deviceToday(new Date(2026, 10, 21, 0, 0))).toBe('2026-11-21');
    });
});
