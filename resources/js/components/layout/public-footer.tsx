import { Link, usePage } from '@inertiajs/react';
import BrandLogo from '@/components/layout/brand-logo';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { show as contactPage } from '@/routes/contact';
import { cookies, privacy, terms } from '@/routes/legal';

const platformLinks = [
    { title: 'Cerca trainer', href: searchUrl() },
    { title: 'Per i trainer', href: `${home.url()}#per-i-trainer` },
    { title: 'Come funziona', href: `${home.url()}#come-funziona` },
];

const legalLinks = [
    { title: 'Privacy policy', href: privacy.url() },
    { title: 'Cookie policy', href: cookies.url() },
    { title: 'Termini e condizioni', href: terms.url() },
    { title: 'Contatti', href: contactPage.url() },
];

const copyright = `© ${new Date().getFullYear()} MioPersonal · Versione beta`;

type PublicFooterProps = {
    /** 'full' = home and search, 'compact' = one line (trainer profile). */
    variant?: 'full' | 'compact';
    className?: string;
};

function LinkList({
    label,
    title,
    links,
}: {
    label: string;
    title: string;
    links: { title: string; href: string }[];
}) {
    return (
        <nav aria-label={label} className="flex flex-col gap-2.5 text-sm">
            <span className="font-semibold">{title}</span>
            {links.map((link) => (
                <Link
                    key={link.title}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground"
                >
                    {link.title}
                </Link>
            ))}
        </nav>
    );
}

export default function PublicFooter({
    variant = 'full',
    className,
}: PublicFooterProps) {
    const currentPath = usePage().url.split(/[?#]/)[0];

    if (variant === 'compact') {
        return (
            <footer className={cn('border-t bg-background', className)}>
                <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-x-8 gap-y-4 px-4 py-6 text-xs text-muted-foreground md:p-8 md:text-sm">
                    <span>{copyright}</span>
                    <nav
                        aria-label="Informazioni legali"
                        className="flex flex-wrap gap-x-6 gap-y-2"
                    >
                        {legalLinks.map((link) => (
                            <Link
                                key={link.title}
                                href={link.href}
                                aria-current={
                                    link.href === currentPath
                                        ? 'page'
                                        : undefined
                                }
                                className="hover:text-foreground aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
                            >
                                {link.title}
                            </Link>
                        ))}
                    </nav>
                </div>
            </footer>
        );
    }

    return (
        <footer className={cn('border-t bg-background', className)}>
            <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-12 px-4 py-12 md:px-8">
                <div className="flex max-w-80 flex-col gap-3">
                    <BrandLogo linkToHome={false} />
                    <p className="text-sm text-muted-foreground">
                        Personal trainer a Milano e provincia, in presenza e
                        online.
                    </p>
                </div>
                <div className="flex flex-wrap gap-16">
                    <LinkList
                        label="Piattaforma"
                        title="Piattaforma"
                        links={platformLinks}
                    />
                    <LinkList
                        label="Informazioni legali"
                        title="Legale"
                        links={legalLinks}
                    />
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-4 pb-8 md:px-8">
                <p className="border-t pt-6 text-xs text-muted-foreground">
                    {copyright}
                </p>
            </div>
        </footer>
    );
}
