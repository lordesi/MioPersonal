import { createInertiaApp } from '@inertiajs/react';
import { layout, title, withApp } from '@/lib/inertia-config';
import { setUpPwa } from '@/lib/pwa';
import { setUpSentry } from '@/lib/sentry';

setUpSentry();
setUpPwa();

void createInertiaApp({
    title,
    layout,
    strictMode: true,
    withApp,
    progress: {
        color: '#4B5563',
    },
});
