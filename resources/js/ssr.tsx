import { createInertiaApp } from '@inertiajs/react';
import { layout, title, withApp } from '@/lib/inertia-config';

/**
 * Server-side rendering of the public pages (home, search, trainer profiles,
 * legal pages), so search engines get the full HTML. The @inertiajs/vite
 * plugin turns this call into the Node server started by
 * `php artisan inertia:start-ssr`. The private areas skip it: see
 * HandleInertiaRequests::$withoutSsr.
 */
void createInertiaApp({
    title,
    layout,
    withApp,
});
