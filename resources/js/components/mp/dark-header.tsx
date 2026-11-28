import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import AccountCapsuleMenu from '@/components/layout/account-capsule-menu';
import { BrandMark } from '@/components/layout/brand-logo';
import CategoryNav from '@/components/mp/category-nav';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { hoverPrefetch } from '@/lib/prefetch';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { home, login } from '@/routes';
import { show as contactPage } from '@/routes/contact';
import { register as trainerRegister } from '@/routes/trainer';

/** The logo of the dark pages: the mark and the name. */
export function DarkLogo({ className }: { className?: string }) {
    return (
        <Link
            prefetch={hoverPrefetch}
            href={home()}
            aria-label="MioPersonal, torna alla home"
            className={cn(
                'flex min-h-11 shrink-0 items-center gap-2.5 text-[19px] font-bold tracking-[-0.03em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[22px]',
                className,
            )}
        >
            <BrandMark className="h-5 w-8 md:h-5.5 md:w-8.75" />
            MioPersonal
        </Link>
    );
}

/** The searches: the categories sit in the header on desktop. */
const SEARCH_PAGES: Record<string, SearchKind> = {
    'public/search': 'trainer',
    'public/gym-search': 'gym',
    'public/course-search': 'course',
    'public/events': 'event',
};

/**
 * Header of the dark pages: the logo, the categories (searches, desktop),
 * "Sei un trainer?" and "Accedi", or only the photo of the account (its
 * menu has the area and the notifications). It lies on top of the page: on
 * the home, on its photo, with "Accedi" as plain text.
 */
export default function DarkHeader({ className }: { className?: string }) {
    const page = usePage<{ city?: { slug: string } | null }>();
    const user = page.props.auth?.user;
    const onPhoto = page.component === 'public/home';
    const role = user?.role;
    const variant = role === 'trainer' || role === 'gym' ? role : 'client';

    const category = SEARCH_PAGES[page.component];

    return (
        <header className={cn('absolute inset-x-0 top-0 z-20', className)}>
            <nav
                aria-label="Principale"
                className="mx-auto flex h-16 max-w-300 items-center justify-between gap-4 px-4 pt-2.5 md:h-auto md:min-h-22 md:px-8 md:py-4.5"
            >
                <DarkLogo />
                {category && (
                    <CategoryNav
                        current={category}
                        city={page.props.city?.slug ?? null}
                        className="hidden md:grid"
                    />
                )}
                <div className="flex items-center gap-2 md:gap-4">
                    {user ? (
                        // No "La mia area" nor the bell: both are in the menu.
                        <AccountCapsuleMenu variant={variant} plain={onPhoto} />
                    ) : (
                        <>
                            <Link
                                prefetch={hoverPrefetch}
                                href={trainerRegister()}
                                className={cn(
                                    'hidden min-h-11 items-center text-[15px] font-medium text-foreground hover:text-brand md:flex',
                                    // The home (design "Home · desktop"): bigger, next to the glass pill.
                                    onPhoto &&
                                        'md:px-2 md:text-base md:font-semibold',
                                )}
                            >
                                Sei un trainer?
                            </Link>
                            <Link
                                prefetch={hoverPrefetch}
                                href={login()}
                                className={cn(
                                    'inline-flex h-11 items-center rounded-full px-4.5 text-[15px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-5 md:font-medium md:hover:text-brand',
                                    onPhoto
                                        ? 'h-10 text-base md:h-11 md:bg-foreground/12 md:px-5.5 md:font-semibold md:backdrop-blur-md md:hover:bg-foreground/18 md:hover:text-foreground'
                                        : 'max-md:border max-md:border-white/12 max-md:bg-card',
                                )}
                            >
                                Accedi
                            </Link>
                            {!onPhoto && <SiteMenu />}
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

/** Phones: "Apri il menu", what the desktop header and footer link to. */
function SiteMenu() {
    const items = [
        { title: 'Cerca un personal trainer', href: searchUrl() },
        { title: 'Sei un personal trainer?', href: trainerRegister.url() },
        { title: 'Contatti', href: contactPage.url() },
    ];

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger
                aria-label="Apri il menu"
                className="flex size-11 items-center justify-center rounded-full border border-white/12 bg-card text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
                <Menu aria-hidden="true" className="size-5.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="theme-dark w-64 rounded-[22px] border border-border bg-card p-1.5 shadow-[inset_0_1px_0_0_rgba(237,238,240,0.06),0_20px_40px_0_rgba(0,0,0,0.5)]"
            >
                {items.map((item) => (
                    <DropdownMenuItem
                        key={item.href}
                        asChild
                        className="min-h-11 rounded-2xl px-3.5 text-base font-semibold focus:bg-secondary"
                    >
                        <Link href={item.href}>{item.title}</Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
