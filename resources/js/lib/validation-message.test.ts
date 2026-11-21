import { describe, expect, it } from 'vite-plus/test';
import { errorOf } from '@/lib/validation-message';

describe('errorOf', () => {
    it('gives the error of the field', () => {
        expect(errorOf({ name: 'Scrivi il nome.' }, 'name')).toBe(
            'Scrivi il nome.',
        );
    });

    it('falls back to the first error of its children', () => {
        const errors = {
            'hours.2.0.opens': 'Scegli l’apertura.',
            'hours.3.0.closes': 'Scegli la chiusura.',
        };

        expect(errorOf(errors, 'hours')).toBe('Scegli l’apertura.');
    });

    it('ignores fields that only start with the same letters', () => {
        expect(errorOf({ hoursNote: 'Troppo lunga.' }, 'hours')).toBe(
            undefined,
        );
    });
});
