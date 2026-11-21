import { describe, expect, it } from 'vite-plus/test';
import { isAppPage, isZoomLocked } from '@/lib/zoom-lock';

describe('isZoomLocked', () => {
    it('lets the public pages be zoomed in a browser tab', () => {
        expect(isZoomLocked('public/home', false)).toBe(false);
        expect(isZoomLocked('public/profile', false)).toBe(false);
    });

    it('locks the private areas', () => {
        for (const component of [
            'client/home',
            'trainer/calendar',
            'gym/dashboard',
            'admin/overview',
            'auth/login',
            'onboarding/trainer-registration',
        ]) {
            expect(isAppPage(component)).toBe(true);
            expect(isZoomLocked(component, false)).toBe(true);
        }
    });

    it('locks every page of the installed app', () => {
        expect(isZoomLocked('public/home', true)).toBe(true);
        expect(isZoomLocked('client/home', true)).toBe(true);
    });
});
