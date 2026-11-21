import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { xsrfToken } from '@/lib/notifications';

// Only the cookie is read: a stand-in document is enough.
const withCookie = (cookie: string) => vi.stubGlobal('document', { cookie });

describe('xsrfToken', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("gives Laravel's CSRF cookie, decoded", () => {
        withCookie('theme=dark; XSRF-TOKEN=abc%3D%3D; laravel_session=xyz');

        expect(xsrfToken()).toBe('abc==');
    });

    it('is empty without the cookie', () => {
        withCookie('theme=dark');

        expect(xsrfToken()).toBe('');
    });

    it('does not take a cookie that only ends with the same name', () => {
        withCookie('OLD-XSRF-TOKEN=nope');

        expect(xsrfToken()).toBe('');
    });
});
