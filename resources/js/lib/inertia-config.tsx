import type { Page, SharedPageProps } from '@inertiajs/core';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import AppErrorBoundary from '@/components/app-error-boundary';
import CookieConsent from '@/components/cookies/cookie-consent';
import AppPrompt from '@/components/pwa/app-prompt';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import PublicLayout from '@/layouts/public-layout';

/**
 * What app.tsx (the browser) and ssr.tsx (the Node server that renders the
 * public pages for search engines) share: both must draw the same page, or
 * React complains when the browser takes over the server HTML.
 */
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

export function title(title: string): string {
    return title ? `${title} - ${appName}` : appName;
}

type Layout = ComponentType<{ children: ReactNode }>;
type Area = 'none' | 'public' | 'trainer' | 'gym' | 'admin' | 'client';

function areaOf(name: string): Area {
    switch (true) {
        case name.startsWith('dev/'):
        // Full-screen designs that draw their own header.
        case name.startsWith('onboarding/'):
        case name.startsWith('auth/'):
        case name === 'client/booking-sent':
            return 'none';
        case name.startsWith('public/'):
            return 'public';
        case name.startsWith('trainer/'):
            return 'trainer';
        case name.startsWith('gym/'):
            return 'gym';
        case name.startsWith('admin/'):
            return 'admin';
        case name.startsWith('client/'):
            return 'client';
        // Every page is in one of the folders above.
        default:
            return 'public';
    }
}

/**
 * The layouts of the private areas are not in the first download (a visitor
 * of the public pages never needs them): resolve() fetches the area's layout
 * together with the page, so Inertia shows the page only when both are here.
 * No empty flash, and the prefetch on hover brings both.
 */
const areaLayouts: Record<
    Exclude<Area, 'none' | 'public'>,
    () => Promise<{ default: Layout }>
> = {
    trainer: () => import('@/layouts/trainer-layout'),
    gym: () => import('@/layouts/gym-layout'),
    admin: () => import('@/layouts/admin-layout'),
    client: () => import('@/layouts/client-layout'),
};

const loadedLayouts = new Map<Area, Layout>();

async function loadLayout(area: Area): Promise<void> {
    if (area === 'none' || area === 'public' || loadedLayouts.has(area)) {
        return;
    }

    loadedLayouts.set(area, (await areaLayouts[area]()).default);
}

const pages = import.meta.glob<{ default: ComponentType }>('../pages/**/*.tsx');

export async function resolve(name: string): Promise<ComponentType> {
    const [page] = await Promise.all([
        pages[`../pages/${name}.tsx`]?.(),
        loadLayout(areaOf(name)),
    ]);

    if (!page) {
        throw new Error(`Page not found: ${name}`);
    }

    return page.default;
}

export function layout(name: string): Layout | null {
    const area = areaOf(name);

    switch (area) {
        case 'none':
            return null;
        case 'public':
            // In the first download: the server (SSR) and the browser draw it at once.
            return PublicLayout;
        default:
            // Always there: resolve() waited for it.
            return loadedLayouts.get(area) ?? null;
    }
}

export function withApp(
    app: ReactElement,
    { page }: { page: Page<SharedPageProps> },
): ReactElement {
    return (
        <TooltipProvider delayDuration={0}>
            {/* A crash while drawing a page is sent to Sentry (when it is on). */}
            <AppErrorBoundary>{app}</AppErrorBoundary>
            <Toaster />
            <CookieConsent initialPage={page} />
            <AppPrompt initialPage={page} />
        </TooltipProvider>
    );
}
