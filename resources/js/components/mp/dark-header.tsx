import { Link, usePage } from '@inertiajs/react';
import AccountCapsuleMenu from '@/components/layout/account-capsule-menu';
import { BrandMark } from '@/components/layout/brand-logo';
import NotificationBell from '@/components/layout/notification-bell';
import { cn } from '@/lib/utils';
import { dashboard, home, login } from '@/routes';
import { register as trainerRegister } from '@/routes/trainer';

/** The white outline on the photo ("Accedi", "La mia area"). */
const outlineButton =
    'inline-flex h-9 items-center rounded-full bg-background/55 px-4 text-[15px] font-semibold text-foreground shadow-[inset_0_0_0_1.5px_var(--foreground)] outline-none hover:bg-background/75 focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** The logo of the dark pages: the mark and the name, white. */
export function DarkLogo({ className }: { className?: string }) {
    return (
        <Link
            href={home()}
            aria-label="MioPersonal, torna alla home"
            className={cn(
                'flex min-h-11 items-center gap-2.5 text-[17px] font-bold tracking-[-0.43px] text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-xl md:tracking-[-0.45px]',
                className,
            )}
        >
            <BrandMark className="h-6 w-10" />
            MioPersonal
        </Link>
    );
}

/**
 * Header of the dark pages: logo, "Sei un trainer?" and "Accedi" (or the
 * account). Transparent, over the photo the page starts with.
 */
const SEARCH_PAGES = [
    'public/search',
    'public/gym-search',
    'public/course-search',
];

export default function DarkHeader({ className }: { className?: string }) {
    const page = usePage();
    const user = page.props.auth?.user;
    // Phones, searches: no photo under the header, "Accedi" is a turquoise link (design "RicercaSegment").
    const plainLogin = SEARCH_PAGES.includes(page.component);
    const role = user?.role;
    const variant = role === 'trainer' || role === 'gym' ? role : 'client';

    return (
        <header className={cn('absolute inset-x-0 top-0 z-20', className)}>
            <nav
                aria-label="Principale"
                className="mx-auto flex h-16 max-w-300 items-center justify-between gap-6 px-4 md:h-23 md:px-8 md:pt-6"
            >
                <DarkLogo />
                <div className="flex items-center gap-2 md:gap-5">
                    {user ? (
                        <>
                            <Link
                                href={dashboard()}
                                className={cn(
                                    outlineButton,
                                    variant === 'client' &&
                                        'hidden md:inline-flex',
                                )}
                            >
                                La mia area
                            </Link>
                            <NotificationBell
                                tone="dark"
                                className="text-foreground hover:bg-foreground/10 hover:text-foreground"
                            />
                            <AccountCapsuleMenu variant={variant} />
                        </>
                    ) : (
                        <>
                            <Link
                                href={trainerRegister()}
                                className="hidden min-h-11 items-center text-[15px] font-semibold text-foreground hover:text-brand md:flex"
                            >
                                Sei un trainer?
                            </Link>
                            <Link
                                href={login()}
                                className={cn(
                                    outlineButton,
                                    plainLogin &&
                                        'max-md:h-11 max-md:bg-transparent max-md:px-1 max-md:text-brand max-md:shadow-none max-md:hover:bg-transparent',
                                )}
                            >
                                Accedi
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}
