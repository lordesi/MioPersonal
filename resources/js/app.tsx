import { createInertiaApp } from '@inertiajs/react';
import { setUpBack } from '@/lib/back';
import { layout, resolve, title, withApp } from '@/lib/inertia-config';
import { setUpPageBackground } from '@/lib/page-background';
import { prefetchCacheFor, setUpPrefetch } from '@/lib/prefetch';
import { setUpPwa } from '@/lib/pwa';
import { setUpSentry } from '@/lib/sentry';
import { setUpStaleBuildReload } from '@/lib/stale-build';
import { setUpZoomLock } from '@/lib/zoom-lock';

setUpSentry();
setUpStaleBuildReload();
setUpPwa();
setUpBack();
setUpPrefetch();
setUpPageBackground();
setUpZoomLock();

void createInertiaApp({
    resolve,
    title,
    layout,
    strictMode: true,
    withApp,
    defaults: {
        // The links with `prefetch` (lib/prefetch.ts): kept 10 s fresh, 5 minutes in all.
        prefetch: { cacheFor: prefetchCacheFor, hoverDelay: 75 },
    },
    progress: {
        color: '#4B5563',
    },
});
