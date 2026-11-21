import { describe, expect, it } from 'vite-plus/test';
import { formatPercent } from '@/lib/format';

describe('formatPercent', () => {
    it('shows one decimal only when it says something', () => {
        expect(formatPercent(0.0577)).toBe('5,8%');
        expect(formatPercent(0.5)).toBe('50%');
        expect(formatPercent(1)).toBe('100%');
        expect(formatPercent(0)).toBe('0%');
    });

    it('rounds to whole numbers with 0 decimals', () => {
        expect(formatPercent(0.91, 0)).toBe('91%');
        expect(formatPercent(0.125, 0)).toBe('13%');
        expect(formatPercent(0.333333, 0)).toBe('33%');
    });

    it('shows a dash when there is nothing to compare with', () => {
        expect(formatPercent(null)).toBe('—');
    });
});
