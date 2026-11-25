import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { DarkLogo } from '@/components/mp/dark-header';
import { BrandMark } from '@/components/layout/brand-logo';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

/** Turquoise links: "Registrati", "Password dimenticata?", "Accedi". */
export const authLinkClassName =
    'flex min-h-11 items-center text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** The main button: filled turquoise, 56px (design "Accedi", "Inviami il link"). */
export const authButtonClassName =
    'flex h-14 items-center justify-center gap-2 rounded-full bg-brand text-[17px] font-semibold tracking-[-0.43px] text-black outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 font-bold shadow-[0_8px_24px_rgba(66,215,217,0.28)]';

/** The second choice next to it: grey outline, 56px ("Annulla", "Esci"). */
export const authSecondaryClassName =
    'flex h-14 items-center justify-center rounded-full border border-field text-[17px] font-semibold tracking-[-0.43px] text-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60';

/**
 * A field with a turquoise icon on the left (designs "Password dimenticata",
 * "Nuova password"): 54px, on black, grey outline, turquoise while typing.
 */
export const authIconFieldClassName =
    'h-13.5 rounded-2xl border-input bg-background pl-12 text-[17px] md:text-[17px] focus-visible:border-[1.5px] focus-visible:border-brand focus-visible:ring-0';

/** "Mostra / Nascondi" inside those fields: turquoise text. */
export const authToggleClassName =
    'top-1/2 right-1 h-11 min-w-20 -translate-y-1/2 rounded-xl text-[15px] font-semibold text-brand hover:bg-brand/12';

/** The icon of a field, on its left. */
export function AuthFieldIcon({ icon: Icon }: { icon: LucideIcon }) {
    return (
        <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-brand"
        />
    );
}

/** A message over the form: "Ti abbiamo mandato il link". */
export function AuthStatus({
    children,
    tone = 'status',
}: {
    children: ReactNode;
    /** alert: something went wrong (red outline). */
    tone?: 'status' | 'alert';
}) {
    return (
        <div
            role={tone}
            className={cn(
                'flex flex-col gap-1 rounded-[14px] px-4 py-3 text-[15px] leading-5.25',
                tone === 'status'
                    ? 'shadow-[inset_0_0_0_1px_var(--brand)]'
                    : 'shadow-[inset_0_0_0_1px_var(--destructive)]',
            )}
        >
            {children}
        </div>
    );
}

/** A grey line under the title. */
export function AuthIntro({ children }: { children: ReactNode }) {
    return (
        <p className="-mt-1 mb-1 text-[15px] leading-5.25 text-muted-foreground md:text-[17px] md:leading-6">
            {children}
        </p>
    );
}

type AuthPhotoShellProps = {
    /** The h1: bold on phones, light and bigger on desktop. */
    title: ReactNode;
    /** Desktop only, when the words differ (as "Accedi" does). */
    desktopTitle?: ReactNode;
    titleId: string;
    /** Desktop, top right: e.g. "Non hai un account? Registrati". */
    aside?: ReactNode;
    /**
     * Phones, top right: the round X back to the home (default), or
     * something else ("Esci") in the flows the user shouldn't leave.
     */
    mobileAction?: ReactNode;
    /** False in the flows the user shouldn't leave (e.g. the username). */
    logoLinksHome?: boolean;
    children: ReactNode;
};

/**
 * The pages to get in, from the design of "Accedi": on phones the photo on
 * top and the form at the bottom; on desktop the photo fills the screen and
 * the form sits on the left, 420px wide.
 */
export default function AuthPhotoShell({
    title,
    desktopTitle,
    titleId,
    aside,
    mobileAction,
    logoLinksHome = true,
    children,
}: AuthPhotoShellProps) {
    return (
        <div className="theme-dark relative isolate flex min-h-dvh flex-col overflow-hidden">
            <picture>
                <source
                    media="(min-width: 768px)"
                    srcSet="/images/design/login-desktop.webp"
                />
                <img
                    src="/images/design/login-mobile.webp"
                    alt=""
                    fetchPriority="high"
                    className="absolute inset-x-0 top-0 -z-10 h-140 w-full object-cover object-[50%_32%] md:inset-0 md:h-full md:object-center"
                />
            </picture>
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 -z-10 h-140 bg-[linear-gradient(180deg,rgba(10,10,10,0.65)_0%,rgba(10,10,10,0)_16%,rgba(10,10,10,0.1)_42%,rgba(10,10,10,0.88)_70%,#0a0a0a_100%)] md:inset-0 md:h-full md:bg-[linear-gradient(90deg,#0a0a0a_0%,rgba(10,10,10,0.92)_34%,rgba(10,10,10,0.2)_62%,rgba(10,10,10,0)_100%),linear-gradient(180deg,rgba(10,10,10,0.5)_0%,rgba(10,10,10,0)_16%)]"
            />

            <header className="md:absolute md:inset-x-0 md:top-0 md:z-10">
                <nav
                    aria-label="Principale"
                    className="mx-auto mt-2 flex h-13 max-w-300 items-center justify-between gap-6 pr-2 pl-4 md:mt-0 md:h-auto md:px-8 md:pt-6"
                >
                    {logoLinksHome ? (
                        <DarkLogo />
                    ) : (
                        <span className="flex min-h-11 items-center gap-2.5 text-[17px] font-bold tracking-[-0.43px] md:text-xl md:tracking-[-0.45px]">
                            <BrandMark className="h-6 w-10" />
                            MioPersonal
                        </span>
                    )}
                    <div className="md:hidden">
                        {mobileAction ?? (
                            <Link
                                href={home()}
                                aria-label="Chiudi e torna alla home"
                                className="group flex size-11 items-center justify-center rounded-full outline-none"
                            >
                                <span className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-foreground group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50">
                                    <X
                                        aria-hidden="true"
                                        className="size-4"
                                        strokeWidth={2.2}
                                    />
                                </span>
                            </Link>
                        )}
                    </div>
                    {aside && (
                        <div className="hidden items-center gap-1.5 text-[15px] text-muted-foreground md:flex">
                            {aside}
                        </div>
                    )}
                </nav>
            </header>

            <main className="mt-auto px-4 pt-50 pb-4 md:mx-auto md:my-0 md:flex md:min-h-dvh md:w-full md:max-w-300 md:items-center md:px-8 md:py-24">
                <div className="flex w-full flex-col gap-3 md:w-105 md:gap-3.5">
                    <h1
                        id={titleId}
                        className="mb-1 text-[26px] leading-[1.12] font-bold tracking-[-0.02em] text-balance md:mb-2 md:text-[40px] md:leading-[1.1] md:font-light md:tracking-[-0.03em] [&_strong]:font-bold"
                    >
                        {desktopTitle ? (
                            <>
                                <span className="md:hidden">{title}</span>
                                <span className="hidden md:inline">
                                    {desktopTitle}
                                </span>
                            </>
                        ) : (
                            title
                        )}
                    </h1>
                    {children}
                </div>
            </main>
        </div>
    );
}
