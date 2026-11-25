import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import BrandLogo from '@/components/layout/brand-logo';
import { openCookieSettings } from '@/lib/cookie-consent';
import { courseSearchUrl } from '@/lib/course';
import { useFeatures, withFeatures } from '@/lib/features';
import type { FeatureName } from '@/lib/features';
import { gymSearchUrl } from '@/lib/gym';
import { openProblemReport } from '@/lib/problem-report';
import { openAppPrompt, useInstallMethod } from '@/lib/pwa';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { show as contactPage } from '@/routes/contact';
import { search as eventsSearch } from '@/routes/events';
import {
    dashboard as gymDashboard,
    register as gymRegister,
} from '@/routes/gym';
import { cookies, privacy, terms } from '@/routes/legal';
import {
    register as trainerRegister,
    today as trainerToday,
} from '@/routes/trainer';
import { hoverPrefetch } from '@/lib/prefetch';

type FooterLink = {
    title: string;
    href: string;
    /** Hidden while that part of the site is off (lib/features.ts). */
    feature?: FeatureName;
};

const exploreLinks: FooterLink[] = [
    { title: 'Personal trainer', href: searchUrl() },
    { title: 'Palestre', href: gymSearchUrl(), feature: 'gyms' },
    { title: 'Corsi', href: courseSearchUrl(), feature: 'courses' },
    { title: 'Eventi', href: eventsSearch.url(), feature: 'events' },
];

/** A trainer or a gym finds its own area where the sign-up of its kind was. */
function proLinks(role?: string): FooterLink[] {
    return [
        role === 'trainer'
            ? { title: 'La tua area trainer', href: trainerToday.url() }
            : {
                  title: 'Sei un trainer?',
                  href: trainerRegister.url(),
              },
        role === 'gym'
            ? {
                  title: 'La tua area palestra',
                  href: gymDashboard.url(),
                  feature: 'gyms',
              }
            : {
                  title: 'Hai una palestra?',
                  href: gymRegister.url(),
                  feature: 'gyms',
              },
    ];
}

const legalLinks = [
    { title: 'Contatti', href: contactPage.url() },
    { title: 'Privacy policy', href: privacy.url() },
    { title: 'Cookie policy', href: cookies.url() },
    { title: 'Termini e condizioni', href: terms.url() },
];

/**
 * black: the light pages (docs/design/Footer · nero), with the sidebar colors.
 * dark: the pages in .theme-dark (home, trainer search), with the page colors.
 */
type FooterVariant = 'black' | 'dark';

const styles = {
    black: {
        footer: 'bg-primary text-primary-foreground',
        focusRing:
            'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring',
        link: 'text-sidebar-muted-foreground underline-offset-3 hover:text-sidebar-primary hover:underline aria-[current=page]:text-sidebar-primary',
        title: 'text-sidebar-primary',
        logo: 'text-sidebar-primary',
        muted: 'text-sidebar-muted-foreground',
    },
    dark: {
        footer: 'border-t border-border bg-background text-foreground',
        focusRing:
            'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        link: 'text-foreground hover:text-brand aria-[current=page]:text-brand',
        title: 'text-muted-foreground',
        logo: 'text-foreground',
        muted: 'text-muted-foreground',
    },
} as const;

const linkClassName = (variant: FooterVariant) =>
    cn(
        'text-left transition-colors',
        styles[variant].link,
        styles[variant].focusRing,
    );

function LinkList({
    id,
    title,
    links,
    currentPath,
    variant,
    children,
}: {
    variant: FooterVariant;
    id: string;
    title: string;
    links: { title: string; href: string }[];
    currentPath: string;
    /** Extra items after the links, e.g. "Impostazioni cookie". */
    children?: ReactNode;
}) {
    return (
        <nav
            aria-labelledby={id}
            className="flex flex-col gap-3 text-[15px] leading-[22px]"
        >
            <h3
                id={id}
                className={cn(
                    'mb-1 text-xs font-bold tracking-[0.08em] uppercase',
                    styles[variant].title,
                )}
            >
                {title}
            </h3>
            {links.map((link) => (
                <Link
                    prefetch={hoverPrefetch}
                    key={link.title}
                    href={link.href}
                    aria-current={
                        link.href === currentPath ? 'page' : undefined
                    }
                    className={linkClassName(variant)}
                >
                    {link.title}
                </Link>
            ))}
            {children}
        </nav>
    );
}

/** Footer of the public pages: the explore, professional and legal links. */
export default function PublicFooter({
    variant = 'black',
    className,
}: {
    variant?: FooterVariant;
    className?: string;
}) {
    const page = usePage();
    const currentPath = page.url.split(/[?#]/)[0];
    const role = page.props.auth?.user?.role;
    const canInstall = useInstallMethod() !== null;
    const features = useFeatures();

    if (variant === 'dark') {
        return (
            <DarkFooter
                currentPath={currentPath}
                role={role}
                canInstall={canInstall}
                className={className}
            />
        );
    }

    return (
        <footer className={cn(styles[variant].footer, className)}>
            <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-12 md:px-8">
                <div className="flex flex-wrap justify-between gap-x-16 gap-y-10">
                    <BrandLogo
                        className={cn(
                            'self-start [&>span]:text-xl [&>span]:font-bold',
                            styles[variant].logo,
                            styles[variant].focusRing,
                        )}
                    />
                    <div className="flex flex-wrap gap-x-18 gap-y-10">
                        <LinkList
                            id="footer-explore"
                            title="Esplora"
                            links={withFeatures(exploreLinks, features)}
                            currentPath={currentPath}
                            variant={variant}
                        />
                        <LinkList
                            id="footer-pro"
                            title="Per i professionisti"
                            links={withFeatures(proLinks(role), features)}
                            currentPath={currentPath}
                            variant={variant}
                        />
                        <LinkList
                            id="footer-legal"
                            title="Supporto e legale"
                            links={legalLinks}
                            currentPath={currentPath}
                            variant={variant}
                        >
                            <button
                                type="button"
                                onClick={openCookieSettings}
                                className={linkClassName(variant)}
                            >
                                Impostazioni cookie
                            </button>
                            {role && (
                                <button
                                    type="button"
                                    onClick={openProblemReport}
                                    className={linkClassName(variant)}
                                >
                                    Segnala un problema
                                </button>
                            )}
                            {canInstall && (
                                <button
                                    type="button"
                                    onClick={openAppPrompt}
                                    className={linkClassName(variant)}
                                >
                                    Installa l’app
                                </button>
                            )}
                        </LinkList>
                    </div>
                </div>
                <p
                    className={cn(
                        'text-[13px] leading-[18px]',
                        styles[variant].muted,
                    )}
                >
                    © {new Date().getFullYear()} MioPersonal
                </p>
            </div>
        </footer>
    );
}

/**
 * The footer of the dark pages (design "Footer", Home F): the logo, "Esplora"
 * and "Professionisti" side by side, then "Supporto e legale" in a row.
 * Desktop: the logo and three columns.
 */
function DarkFooter({
    currentPath,
    role,
    canInstall,
    className,
}: {
    currentPath: string;
    role?: string;
    canInstall: boolean;
    className?: string;
}) {
    const features = useFeatures();
    const link =
        'inline-flex min-h-9 items-center text-left text-[15px] text-foreground outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:font-semibold aria-[current=page]:text-brand';
    const title =
        'mb-1.5 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase md:mb-2';

    const column = (
        id: string,
        heading: string,
        links: { title: string; href: string }[],
    ) => (
        <nav aria-labelledby={id} className="flex flex-col md:w-50">
            <h2 id={id} className={title}>
                {heading}
            </h2>
            {links.map((item) => (
                <Link
                    prefetch={hoverPrefetch}
                    key={item.title}
                    href={item.href}
                    aria-current={
                        item.href === currentPath ? 'page' : undefined
                    }
                    className={link}
                >
                    {item.title}
                </Link>
            ))}
        </nav>
    );

    return (
        <footer
            className={cn(
                'border-t border-border bg-surface-sunken text-foreground',
                className,
            )}
        >
            <div className="mx-auto flex max-w-300 flex-col gap-7 px-4 pt-8 pb-10 md:gap-8 md:px-8 md:pt-12 md:pb-8">
                <div className="flex flex-col gap-7 md:flex-row md:flex-wrap md:gap-x-12 md:gap-y-8">
                    <BrandLogo className="min-h-11 self-start text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-1 [&>span]:text-[19px] [&>span]:font-bold [&>span]:tracking-[-0.03em] [&>svg]:h-5 [&>svg]:w-8" />
                    <div className="grid grid-cols-2 gap-5 md:contents">
                        {column(
                            'footer-explore',
                            'Esplora',
                            withFeatures(exploreLinks, features),
                        )}
                        {column(
                            'footer-pro',
                            'Professionisti',
                            withFeatures(proLinks(role), features),
                        )}
                    </div>
                    <nav
                        aria-labelledby="footer-legal"
                        className="flex flex-col md:w-50"
                    >
                        <h2 id="footer-legal" className={title}>
                            Supporto e legale
                        </h2>
                        <div className="flex flex-wrap gap-x-5 md:flex-col">
                            {legalLinks.map((item) => (
                                <Link
                                    prefetch={hoverPrefetch}
                                    key={item.title}
                                    href={item.href}
                                    aria-current={
                                        item.href === currentPath
                                            ? 'page'
                                            : undefined
                                    }
                                    className={link}
                                >
                                    {item.title}
                                </Link>
                            ))}
                            <button
                                type="button"
                                onClick={openCookieSettings}
                                className={link}
                            >
                                Impostazioni cookie
                            </button>
                            {role && (
                                <button
                                    type="button"
                                    onClick={openProblemReport}
                                    className={link}
                                >
                                    Segnala un problema
                                </button>
                            )}
                            {canInstall && (
                                <button
                                    type="button"
                                    onClick={openAppPrompt}
                                    className={link}
                                >
                                    Installa l’app
                                </button>
                            )}
                        </div>
                    </nav>
                </div>
                <p className="text-[13px] leading-4.5 text-muted-foreground md:border-t md:border-separator md:pt-6 md:text-xs">
                    © {new Date().getFullYear()} MioPersonal
                </p>
            </div>
        </footer>
    );
}
