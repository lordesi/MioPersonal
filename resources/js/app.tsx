import { createInertiaApp } from '@inertiajs/react';
import { layout, title, withApp } from '@/lib/inertia-config';

void createInertiaApp({
    title,
    layout,
    strictMode: true,
    withApp,
    progress: {
        color: '#4B5563',
    },
});
