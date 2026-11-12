import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import BrandLogo from '@/components/layout/brand-logo';
import { openCookieSettings } from '@/lib/cookie-consent';
import { courseSearchUrl } from '@/lib/course';
import { gymSearchUrl } from '@/lib/gym';
import { openAppPrompt, useInstallMethod } from '@/lib/pwa';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { howItWorks, news } from '@/routes';
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

const exploreLinks = [
    { title: 'Personal trainer', href: searchUrl() },
    { title: 'Palestre', href: gymSearchUrl() },
    { title: 'Corsi', href: courseSearchUrl() },
    { title: 'Eventi', href: eventsSearch.url() },
    { title: 'Novità', href: news.url() },
];

/** A trainer or a gym finds its own area where the sign-up of its kind was. */
function proLinks(role?: string) {
    return [
        role === 'trainer'
            ? { title: 'La tua area trainer', href: trainerToday.url() }
            : {
                  title: 'Sei un personal trainer?',
                  href: trainerRegister.url(),
              },
        role === 'gym'
            ? { title: 'La tua area palestra', href: gymDashboard.url() }
            : { title: 'Hai una palestra?', href: gymRegister.url() },
        { title: 'Come funziona', href: howItWorks.url() },
    ];
}

const legalLinks = [
    { title: 'Contatti', href: contactPage.url() },
    { title: 'Privacy policy', href: privacy.url() },
    { title: 'Cookie policy', href: cookies.url() },
    { title: 'Termini e condizioni', href: terms.url() },
];

/** White outline on the black background, as in the design. */
const focusRing =
    'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring';

const linkClassName = cn(
    'text-left text-sidebar-muted-foreground underline-offset-3 transition-colors hover:text-sidebar-primary hover:underline aria-[current=page]:text-sidebar-primary',
    focusRing,
);

function LinkList({
    id,
    title,
    links,
    currentPath,
    children,
}: {
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
                className="mb-1 text-xs font-bold tracking-[0.08em] text-sidebar-primary uppercase"
            >
                {title}
            </h3>
            {links.map((link) => (
                <Link
                    key={link.title}
                    href={link.href}
                    aria-current={
                        link.href === currentPath ? 'page' : undefined
                    }
                    className={linkClassName}
                >
                    {link.title}
                </Link>
            ))}
            {children}
        </nav>
    );
}

/** Black footer of the public pages (docs/design/Footer · nero). */
export default function PublicFooter({ className }: { className?: string }) {
    const page = usePage();
    const currentPath = page.url.split(/[?#]/)[0];
    const role = page.props.auth?.user?.role;
    const canInstall = useInstallMethod() !== null;

    return (
        <footer className={cn('bg-primary text-primary-foreground', className)}>
            <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-12 md:px-8">
                <div className="flex flex-wrap justify-between gap-x-16 gap-y-10">
                    <BrandLogo
                        className={cn(
                            'self-start text-sidebar-primary [&>span]:text-xl [&>span]:font-bold',
                            focusRing,
                        )}
                    />
                    <div className="flex flex-wrap gap-x-18 gap-y-10">
                        <LinkList
                            id="footer-explore"
                            title="Esplora"
                            links={exploreLinks}
                            currentPath={currentPath}
                        />
                        <LinkList
                            id="footer-pro"
                            title="Per i professionisti"
                            links={proLinks(role)}
                            currentPath={currentPath}
                        />
                        <LinkList
                            id="footer-legal"
                            title="Supporto e legale"
                            links={legalLinks}
                            currentPath={currentPath}
                        >
                            <button
                                type="button"
                                onClick={openCookieSettings}
                                className={linkClassName}
                            >
                                Impostazioni cookie
                            </button>
                            {canInstall && (
                                <button
                                    type="button"
                                    onClick={openAppPrompt}
                                    className={linkClassName}
                                >
                                    Installa l’app
                                </button>
                            )}
                        </LinkList>
                    </div>
                </div>
                <p className="text-[13px] leading-[18px] text-sidebar-muted-foreground">
                    © {new Date().getFullYear()} MioPersonal
                </p>
            </div>
        </footer>
    );
}
