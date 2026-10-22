import { Link, usePage } from '@inertiajs/react';
import AccountMenu from '@/components/layout/account-menu';
import BrandLogo from '@/components/layout/brand-logo';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { register as trainerRegister } from '@/routes/trainer';

/** Light outline on the dark background, the "Sei un trainer?" look. */
const heroButton =
    'inline-flex h-11 items-center rounded-lg text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/50';

/**
 * Header of the public pages: dark like the home hero, so on the home they
 * look like one block. Only the logo and the two buttons, like the design.
 */
export default function PublicHeader({ className }: { className?: string }) {
    // Missing on Laravel's own error responses, e.g. the 404 of an unknown URL.
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
