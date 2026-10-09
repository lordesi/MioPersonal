import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import AccountMenu from '@/components/layout/account-menu';
import BrandLogo from '@/components/layout/brand-logo';
import ThemeToggle from '@/components/shared/theme-toggle';
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
    href: `${home.url()}#per-i-trainer`,
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
    className?: string;
};

export default function PublicHeader({
    section,
    nav = 'main',
    className,
}: PublicHeaderProps) {
    const navItems = navs[nav];
    // Missing on Laravel's own error responses, e.g. the 404 of an unknown URL.
    const user = usePage().props.auth?.user;

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
                    <ThemeToggle className="hidden md:flex" />
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
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        Tema
                                    </span>
                                    <ThemeToggle />
                                </div>
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
