import { describe, expect, it } from 'vite-plus/test';
import { isAppPage, isZoomLocked, viewportContent } from '@/lib/zoom-lock';

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

describe('viewportContent', () => {
    it('lets the photo of the trainer profile go under the clock of the phone', () => {
        expect(viewportContent('public/profile', false)).toBe(
            'width=device-width, initial-scale=1, viewport-fit=cover',
        );
        expect(viewportContent('public/profile', true)).toContain(
            'viewport-fit=cover',
        );
    });

    it('leaves the other pages as they are', () => {
        expect(viewportContent('public/search', false)).toBe(
            'width=device-width, initial-scale=1',
        );
        expect(viewportContent('trainer/today', true)).toBe(
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
        );
    });
});
