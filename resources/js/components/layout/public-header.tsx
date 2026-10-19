import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import AccountMenu from '@/components/layout/account-menu';
import BrandLogo from '@/components/layout/brand-logo';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { searchUrl } from '@/lib/search';
import { cn } from '@/lib/utils';
import { home, login, register } from '@/routes';
import { show as contactPage } from '@/routes/contact';
import { register as trainerRegister } from '@/routes/trainer';

export type PublicSection =
    | 'search'
    | 'how-it-works'
    | 'for-trainers'
    | 'contacts';

/** 'main' = home, search, profile; 'info' = legal pages and Contatti. */
export type PublicNav = 'main' | 'info';

type NavItem = { section: PublicSection; title: string; href: string };

const searchItem: NavItem = {
    section: 'search',
    title: 'Cerca trainer',
    href: searchUrl(),
};

const forTrainersItem: NavItem = {
    section: 'for-trainers',
    title: 'Per i trainer',
    href: trainerRegister.url(),
};

const navs: Record<PublicNav, NavItem[]> = {
    main: [
        searchItem,
        {
            section: 'how-it-works',
            title: 'Come funziona',
            href: `${home.url()}#come-funziona`,
        },
        forTrainersItem,
    ],
    info: [
        searchItem,
        forTrainersItem,
        { section: 'contacts', title: 'Contatti', href: contactPage.url() },
    ],
};

type PublicHeaderProps = {
    /** Highlights the matching link with aria-current="page". */
    section?: PublicSection;
    nav?: PublicNav;
    /** 'hero' = dark, without links: it is the top of the home hero. */
    variant?: 'default' | 'hero';
    className?: string;
};

export default function PublicHeader({
    section,
    nav = 'main',
    variant = 'default',
    className,
}: PublicHeaderProps) {
    const navItems = navs[nav];
    // Missing on Laravel's own error responses, e.g. the 404 of an unknown URL.
    const user = usePage().props.auth?.user;

    if (variant === 'hero') {
        return <HeroHeader className={className} />;
    }

    return (
        <header className={cn('border-b bg-background', className)}>
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 pr-2 pl-4 md:h-18 md:px-8">
                <BrandLogo />

                <nav
                    aria-label="Principale"
                    className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex"
                >
                    {navItems.map((item) => (
                        <Link
                            key={item.section}
                            href={item.href}
                            aria-current={
                                item.section === section ? 'page' : undefined
                            }
                            className={cn(
                                'hover:text-foreground',
                                item.section === section && 'text-foreground',
                            )}
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-1 md:gap-2">
                    {user ? (
                        <AccountMenu
                            variant={
                                user.role === 'trainer' ? 'trainer' : 'client'
                            }
                            userName={user.name}
                            headerHeight={16}
                        />
                    ) : (
                        <>
                            <Button
                                asChild
                                variant="ghost"
                                className="h-11 px-3 md:h-9 md:px-4"
                            >
                                <Link href={login()}>Accedi</Link>
                            </Button>
                            <Button asChild className="hidden md:inline-flex">
                                <Link href={register()}>Registrati</Link>
                            </Button>
                        </>
                    )}

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Apri il menu"
                                className="size-11 md:hidden"
                            >
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <nav
                                aria-label="Principale"
                                className="flex flex-col gap-1 px-4 text-base font-medium"
                            >
                                {navItems.map((item) => (
                                    <Link
                                        key={item.section}
                                        href={item.href}
                                        aria-current={
                                            item.section === section
                                                ? 'page'
                                                : undefined
                                        }
                                        className="flex h-11 items-center rounded-lg px-3 hover:bg-accent"
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </nav>
                            <div className="mt-auto flex flex-col gap-4 p-4">
                                {!user && (
                                    <Button asChild>
                                        <Link href={register()}>
                                            Registrati
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

/** Light outline on the dark background, the "Sei un trainer?" look. */
const heroButton =
    'inline-flex h-11 items-center rounded-lg text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/50';

/**
 * Home header: same color as the hero below, so they look like one block.
 * Only the logo and the two buttons, like the design.
 */
function HeroHeader({ className }: { className?: string }) {
    const user = usePage().props.auth?.user;

    return (
        <header className={cn('bg-primary text-primary-foreground', className)}>
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-2.5 md:px-8 md:py-5">
                <BrandLogo className="text-primary-foreground" />

                <div className="ml-auto flex flex-wrap items-center gap-3">
                    {user ? (
                        <AccountMenu
                            variant={
                                user.role === 'trainer' ? 'trainer' : 'client'
                            }
                            userName={user.name}
                            headerHeight={16}
                        />
                    ) : (
                        <>
                            <Link
                                href={trainerRegister()}
                                className={cn(
                                    heroButton,
                                    'border border-primary-foreground px-4.5 font-medium hover:bg-primary-foreground/10',
                                )}
                            >
                                Sei un trainer?
                            </Link>
                            <Link
                                href={login()}
                                className={cn(
                                    heroButton,
                                    'bg-primary-foreground px-5 font-semibold text-primary hover:bg-primary-foreground/90',
                                )}
                            >
                                Accedi
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
