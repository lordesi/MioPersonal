import { Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    CircleHelp,
    Dumbbell,
    Building2,
    Menu,
} from 'lucide-react';
import { useState } from 'react';
import AccountMenu from '@/components/layout/account-menu';
import BrandLogo from '@/components/layout/brand-logo';
import NotificationBell from '@/components/layout/notification-bell';
import type { SearchKind } from '@/components/search/search-kind-toggle';
import {
    searchKindUrl,
    searchKinds,
} from '@/components/search/search-kind-toggle';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { dashboard, howItWorks, login, register } from '@/routes';
import { show as contactPage } from '@/routes/contact';
import { register as gymRegister } from '@/routes/gym';
import { register as trainerRegister } from '@/routes/trainer';

/** Light outline on the dark background, the "Sei un trainer?" look. */
const heroButton =
    'inline-flex h-11 items-center rounded-lg text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/50';

const proLinks = [
    {
        title: 'Sei un personal trainer?',
        hint: 'Crea il tuo profilo, è gratis',
        href: trainerRegister.url(),
        icon: Dumbbell,
    },
    {
        title: 'Hai una palestra?',
        hint: 'Corsi, abbonamenti e i tuoi trainer',
        href: gymRegister.url(),
        icon: Building2,
    },
    {
        title: 'Come funziona',
        hint: 'MioPersonal in due minuti',
        href: howItWorks.url(),
        icon: CircleHelp,
    },
];

/** Which of the four searches the page belongs to: lights up its link. */
export function currentKind(url: string): SearchKind | null {
    const path = url.split(/[?#]/)[0];

    if (/^\/(personal-trainer|trainer\/)/.test(path)) {
        return 'trainer';
    }

    if (/^\/(palestre|palestra\/)/.test(path)) {
        return path.includes('/lezioni') ? 'course' : 'gym';
    }

    if (path.startsWith('/corsi')) {
        return 'course';
    }

    if (/^\/(eventi|evento\/)/.test(path)) {
        return 'event';
    }

    return null;
}

/**
 * Header of the public pages: dark like the home hero, so on the home they
 * look like one block. The four searches in the middle (desktop), the
 * account or "Accedi" on the right; on phones the menu ☰ for guests.
 */
export default function PublicHeader({ className }: { className?: string }) {
    // Missing on Laravel's own error responses, e.g. the 404 of an unknown URL.
    const page = usePage();
    const user = page.props.auth?.user;
    const active = currentKind(page.url);
    const role = user?.role;
    const variant = role === 'trainer' || role === 'gym' ? role : 'client';

    return (
        <header className={cn('bg-primary text-primary-foreground', className)}>
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-x-4 px-4 md:h-20 md:gap-x-8 md:px-8">
                <BrandLogo className="text-primary-foreground" />

                <nav
                    aria-label="Esplora"
                    className="hidden items-center gap-1 lg:flex"
                >
                    {searchKinds.map((kind) => (
                        <Link
                            key={kind.value}
                            href={searchKindUrl(kind.value)}
                            aria-current={
                                active === kind.value ? 'page' : undefined
                            }
                            className={cn(
                                heroButton,
                                'px-3 font-medium text-primary-foreground/75 underline-offset-8 hover:text-primary-foreground aria-[current=page]:text-primary-foreground aria-[current=page]:underline aria-[current=page]:decoration-2',
                            )}
                        >
                            {kind.shortLabel}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 md:gap-3">
                    {user ? (
                        <>
                            {/* The client has the tabs at the bottom on phones. */}
                            <Link
                                href={dashboard()}
                                className={cn(
                                    heroButton,
                                    'h-10 border border-primary-foreground/60 px-3.5 font-medium hover:bg-primary-foreground/10',
                                    variant === 'client' &&
                                        'hidden md:inline-flex',
                                )}
                            >
                                {variant === 'client'
                                    ? 'Le mie prenotazioni'
                                    : 'La mia area'}
                            </Link>
                            <NotificationBell
                                tone="dark"
                                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                            />
                            <AccountMenu
                                variant={variant}
                                userName={user.name}
                                headerHeight={16}
                            />
                        </>
                    ) : (
                        <>
                            <ProMenu />
                            <Link
                                href={login()}
                                className={cn(
                                    heroButton,
                                    'h-10 bg-primary-foreground px-4.5 font-semibold text-primary hover:bg-primary-foreground/90 md:h-11 md:px-5',
                                )}
                            >
                                Accedi
                            </Link>
                            <GuestMenu active={active} />
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

/** "Per i professionisti ▾" (desktop): the two sign-ups and how it works. */
function ProMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    heroButton,
                    'hidden gap-1 px-2 font-medium text-primary-foreground/80 hover:text-primary-foreground md:inline-flex',
                )}
            >
                Per i professionisti
                <ChevronDown aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-72 rounded-xl p-1.5"
            >
                {proLinks.map((link) => (
                    <DropdownMenuItem
                        key={link.title}
                        asChild
                        className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2"
                    >
                        <Link href={link.href}>
                            <link.icon aria-hidden="true" className="size-4" />
                            <span className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {link.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {link.hint}
                                </span>
                            </span>
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const sheetRow =
    'flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium hover:bg-accent';

/** ☰ on phones and tablets, for guests: everything of the header and more. */
function GuestMenu({ active }: { active: SearchKind | null }) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                aria-label="Apri il menu"
                className="flex size-11 items-center justify-center rounded-lg hover:bg-primary-foreground/10 lg:hidden"
            >
                <Menu aria-hidden="true" className="size-6" />
            </SheetTrigger>
            <SheetContent
                side="right"
                aria-describedby={undefined}
                className="w-[min(22rem,90vw)] gap-0 overflow-y-auto p-3 pt-12"
            >
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav aria-label="Menu" className="flex flex-col">
                    <span className="px-3 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                        ESPLORA
                    </span>
                    {searchKinds.map((kind) => (
                        <Link
                            key={kind.value}
                            href={searchKindUrl(kind.value)}
                            onClick={close}
                            aria-current={
                                active === kind.value ? 'page' : undefined
                            }
                            className={cn(
                                sheetRow,
                                active === kind.value &&
                                    'bg-accent font-semibold',
                            )}
                        >
                            <kind.icon aria-hidden="true" className="size-5" />
                            {kind.label}
                        </Link>
                    ))}
                    <span className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                        PER I PROFESSIONISTI
                    </span>
                    {proLinks.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            onClick={close}
                            className={sheetRow}
                        >
                            <link.icon aria-hidden="true" className="size-5" />
                            {link.title}
                        </Link>
                    ))}
                    <Link
                        href={contactPage.url()}
                        onClick={close}
                        className={sheetRow}
                    >
                        <CircleHelp aria-hidden="true" className="size-5" />
                        Contatti
                    </Link>
                    <div className="mt-4 grid grid-cols-2 gap-2 px-1">
                        <Link
                            href={login()}
                            onClick={close}
                            className="flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
                        >
                            Accedi
                        </Link>
                        <Link
                            href={register()}
                            onClick={close}
                            className="flex h-11 items-center justify-center rounded-lg border text-sm font-semibold"
                        >
                            Registrati
                        </Link>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    );
}
