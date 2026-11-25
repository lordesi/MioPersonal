import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { DarkLogo } from '@/components/mp/dark-header';
import { cn } from '@/lib/utils';
import { login } from '@/routes';

type DarkShellProps = {
    /** The names of the steps, e.g. "Account", "Foto profilo". */
    steps: string[];
    /** The open step; null on "Profilo inviato" and "serve un altro account". */
    step: number | null;
    title: ReactNode;
    /** Under the title, grey. */
    intro?: ReactNode;
    /** Right of the logo: "Salva ed esci"; for guests "Accedi" by default. */
    topRight?: ReactNode;
    /** "Facoltativo" next to "Passo N di 9". */
    optional?: boolean;
    /** Above the title, e.g. the round tick of "Profilo inviato". */
    icon?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
};

/** Turquoise links of the page: "Accedi", "Salva ed esci", "Modifica". */
export const shellLinkClassName =
    'flex min-h-11 items-center text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring';

/**
 * The dark page of a sign-up ("Diventa trainer", "Registra la palestra"),
 * as in the design "Diventa trainer · N di 9": the logo and a link on top,
 * then one column (680px on desktop) with "Passo N di 9 · Nome", the bar
 * of segments, the title, the fields and the buttons.
 */
export default function DarkShell({
    steps,
    step,
    title,
    intro,
    topRight,
    optional = false,
    icon,
    footer,
    children,
}: DarkShellProps) {
    const guest = !usePage().props.auth?.user;

    return (
        <div className="theme-dark onboarding-shell flex min-h-dvh flex-col">
            <header className="md:border-b md:border-separator">
                <div className="mx-auto flex min-h-16 max-w-320 items-center justify-between gap-4 px-4 pt-2.5 md:px-8 md:py-4.5">
                    <DarkLogo />
                    {topRight ??
                        (guest && (
                            <Link
                                href={login()}
                                className="flex h-9 items-center rounded-full px-3.5 text-[15px] font-semibold text-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Accedi
                            </Link>
                        ))}
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-170 flex-1 flex-col gap-8 px-4 pt-5 pb-10 md:gap-9 md:px-8 md:pt-14 md:pb-20">
                {step !== null && (
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-baseline justify-between text-[13px] font-semibold">
                            <span className="text-brand">
                                Passo {step} di {steps.length} ·{' '}
                                {steps[step - 1]}
                            </span>
                            {optional && (
                                <span className="text-muted-foreground">
                                    Facoltativo
                                </span>
                            )}
                        </div>
                        <div
                            role="progressbar"
                            aria-label={`Passo ${step} di ${steps.length}`}
                            aria-valuenow={step}
                            aria-valuemin={1}
                            aria-valuemax={steps.length}
                            className="flex gap-1"
                        >
                            {steps.map((label, index) => (
                                <span
                                    key={label}
                                    className={cn(
                                        'h-1 flex-1 rounded-full',
                                        index < step
                                            ? 'bg-brand'
                                            : 'bg-secondary',
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2.5">
                    {icon && (
                        <span className="mb-2.5 flex size-18 items-center justify-center rounded-full bg-brand text-black [&_svg]:size-9">
                            {icon}
                        </span>
                    )}
                    <h1 className="text-[34px] leading-[1.06] font-bold tracking-[-0.03em] text-balance md:text-[44px] [&_strong]:font-bold">
                        {title}
                    </h1>
                    {intro && (
                        <p className="text-[17px] leading-[1.4] text-muted-foreground">
                            {intro}
                        </p>
                    )}
                </div>

                {children}

                {footer}
            </main>
        </div>
    );
}

/**
 * The bottom of a step: the main button, "Indietro" (or "Salta questo
 * passo") under it, a note under them. The same on phones and desktop.
 */
export function ShellFooter({
    back,
    noteBelow,
    children,
}: {
    /** "Indietro" or "Salta questo passo". */
    back?: ReactNode;
    /** E.g. "Hai già un account? Accedi". */
    noteBelow?: ReactNode;
    /** The main button. */
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            {children}
            {back}
            {noteBelow && (
                <p className="mt-1 text-center text-[15px] text-muted-foreground">
                    {noteBelow}
                </p>
            )}
        </div>
    );
}

/** "Continua": filled turquoise, the whole width. */
export const shellNextClassName =
    'flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-[17px] font-semibold text-black outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40';

/** "Invia per approvazione": the same as "Continua". */
export const shellSendClassName = shellNextClassName;

/** "Indietro", "Salta questo passo": text only, the whole width. */
export const shellBackClassName =
    'flex h-14 w-full items-center justify-center rounded-full text-[17px] font-semibold text-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring';
