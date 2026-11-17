import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { DarkLogo } from '@/components/mp/dark-header';
import { cn } from '@/lib/utils';
import { login } from '@/routes';

export const gymSteps = [
    'Account',
    'La palestra',
    'Servizi e orari',
    'Foto',
    'Contatti e invio',
];

type GymShellProps = {
    /** The open step, 1–5; null on "Profilo inviato" and "serve un altro account". */
    step: number | null;
    /** The steps that can be opened from the bar (desktop). */
    reached?: number;
    firstStep?: number;
    onSelect?: (step: number) => void;
    /** Phones, steps after the first: the round arrow back. */
    onBack?: () => void;
    title: ReactNode;
    /** Under the title, grey. */
    intro?: ReactNode;
    /** Right of the logo on desktop, right of "Passo N di 5" on phones. */
    topRight?: ReactNode;
    /** Phones: the photo on top with the title over it (step 1 of a guest). */
    hero?: boolean;
    footer?: ReactNode;
    children: ReactNode;
};

/** Turquoise links of the page: "Accedi", "Salva ed esci", "Modifica". */
export const gymLinkClassName =
    'flex min-h-11 items-center text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * The dark page of "Registra la palestra" (design "Registrazione
 * palestra"): on phones the steps one under the other with a bar of 5
 * segments, on desktop a column of 960px with the 5 steps named on top.
 */
export default function GymShell({
    step,
    reached = 1,
    firstStep = 1,
    onSelect,
    onBack,
    title,
    intro,
    topRight,
    hero = false,
    footer,
    children,
}: GymShellProps) {
    const heading = (
        <div className="flex flex-col gap-2 md:gap-2.5">
            <h1 className="text-[34px] leading-[1.12] font-light tracking-[-0.035em] text-balance md:text-5xl md:leading-[1.1] md:tracking-[-0.03em] [&_strong]:font-bold">
                {title}
            </h1>
            {intro && (
                <p className="text-[15px] leading-5 text-muted-foreground md:text-[17px] md:leading-6">
                    {intro}
                </p>
            )}
        </div>
    );

    return (
        <div className="theme-dark flex min-h-dvh flex-col">
            {/* Desktop: logo and a link on the right. */}
            <nav aria-label="Principale" className="hidden px-8 pt-6 md:block">
                <div className="mx-auto flex max-w-300 items-center justify-between gap-6">
                    <DarkLogo />
                    {topRight}
                </div>
            </nav>

            {/* Phones: the photo of step 1, or the arrow and "Passo N di 5". */}
            {hero ? (
                <header className="relative isolate flex h-95 flex-col overflow-hidden md:hidden">
                    <img
                        src="/images/design/pro-gym.webp"
                        alt=""
                        fetchPriority="high"
                        className="absolute inset-0 -z-10 size-full object-cover object-[50%_30%]"
                    />
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,10,10,0.55)_0%,rgba(10,10,10,0)_22%,rgba(10,10,10,0.2)_40%,rgba(10,10,10,0.88)_72%,#0a0a0a_100%)]"
                    />
                    <div className="mx-4 mt-3 flex h-13 items-center justify-between">
                        <DarkLogo />
                        <Link
                            href={login()}
                            className="flex h-8.5 items-center rounded-full bg-[rgba(10,10,10,0.55)] px-4 text-[15px] font-semibold shadow-[inset_0_0_0_1.5px_var(--foreground)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            Accedi
                        </Link>
                    </div>
                    <div className="mx-4 mt-auto mb-5 flex flex-col gap-2.5">
                        {step !== null && (
                            <span className="text-[13px] font-semibold tracking-[0.6px] text-brand uppercase">
                                Registra la palestra · Passo {step} di{' '}
                                {gymSteps.length}
                            </span>
                        )}
                        {heading}
                    </div>
                </header>
            ) : (
                <header className="flex flex-col gap-4 px-4 pt-3 md:hidden">
                    <div className="flex h-13 items-center justify-between gap-3">
                        {onBack ? (
                            <button
                                type="button"
                                onClick={onBack}
                                aria-label={
                                    step && step > 1
                                        ? `Torna al passo ${step - 1}, ${gymSteps[step - 2]}`
                                        : 'Indietro'
                                }
                                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/35 outline-none hover:bg-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <ChevronLeft
                                    aria-hidden="true"
                                    className="size-5.5"
                                />
                            </button>
                        ) : (
                            <DarkLogo />
                        )}
                        {step !== null && (
                            <span className="text-[15px] font-semibold text-muted-foreground tabular-nums">
                                Passo {step} di {gymSteps.length}
                            </span>
                        )}
                        <div className="flex min-w-11 justify-end">
                            {topRight}
                        </div>
                    </div>
                </header>
            )}

            {step !== null && (
                <StepBar
                    step={step}
                    reached={reached}
                    firstStep={firstStep}
                    onSelect={onSelect}
                />
            )}

            <main className="flex flex-1 flex-col gap-10 px-4 pt-7 pb-10 md:mx-auto md:w-full md:max-w-240 md:px-0 md:pt-10 md:pb-16">
                <div className={cn(hero && 'max-md:hidden')}>{heading}</div>
                {children}
            </main>

            {footer}
        </div>
    );
}

/**
 * Phones: 5 segments under the header. Desktop: the 5 steps named, the
 * ones already reached can be opened again.
 */
function StepBar({
    step,
    reached,
    firstStep,
    onSelect,
}: {
    step: number;
    reached: number;
    firstStep: number;
    onSelect?: (step: number) => void;
}) {
    return (
        <>
            <div
                role="progressbar"
                aria-label="Avanzamento della registrazione"
                aria-valuenow={step}
                aria-valuemin={1}
                aria-valuemax={gymSteps.length}
                className="flex gap-1 px-4 md:hidden"
            >
                {gymSteps.map((label, index) => (
                    <span
                        key={label}
                        className={cn(
                            'h-0.75 flex-1 rounded-full',
                            index < step ? 'bg-brand' : 'bg-[#2a2a2a]',
                        )}
                    />
                ))}
            </div>

            <ol
                aria-label="Passi"
                className="mx-auto mt-10 hidden w-full max-w-240 grid-cols-5 gap-2 text-[13px] leading-4.5 md:grid"
            >
                {gymSteps.map((label, index) => {
                    const number = index + 1;
                    const current = number === step;
                    const open =
                        onSelect !== undefined &&
                        !current &&
                        number >= firstStep &&
                        number <= reached;
                    const content = (
                        <>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'h-1 w-full rounded-full',
                                    number <= step
                                        ? 'bg-brand'
                                        : 'bg-[#2a2a2a]',
                                )}
                            />
                            {number} · {label}
                        </>
                    );

                    return (
                        <li
                            key={label}
                            aria-current={current ? 'step' : undefined}
                            className={cn(
                                current
                                    ? 'font-semibold text-brand'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {open ? (
                                <button
                                    type="button"
                                    onClick={() => onSelect(number)}
                                    className="flex w-full flex-col gap-2 text-left outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    {content}
                                </button>
                            ) : (
                                <span className="flex flex-col gap-2">
                                    {content}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </>
    );
}

/**
 * The bottom of a step. Phones: the main button stuck at the bottom over a
 * fade, with a note above or below. Desktop: "Annulla"/"Indietro" on the
 * left, a status and the 280px button on the right, a line above.
 */
export function GymFooter({
    back,
    status,
    noteAbove,
    noteBelow,
    children,
}: {
    /** Desktop only: "Annulla" or "Indietro". */
    back?: ReactNode;
    /** Desktop: why "Continua" is off, e.g. "Compila i campi e accetta i termini". */
    status?: ReactNode;
    /** Phones: e.g. "2 servizi · aperta 6 giorni su 7". */
    noteAbove?: ReactNode;
    /** Phones: e.g. "Hai già registrato la palestra? Accedi". */
    noteBelow?: ReactNode;
    /** The main button. */
    children: ReactNode;
}) {
    return (
        <div className="sticky bottom-0 z-10 flex flex-col gap-2.5 bg-[linear-gradient(180deg,rgba(10,10,10,0)_0%,#0a0a0a_30%)] px-4 pt-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] md:static md:mx-auto md:w-full md:max-w-240 md:flex-row md:items-center md:justify-between md:gap-6 md:border-t md:border-border md:bg-none md:px-0 md:pt-6 md:pb-16">
            <div className="hidden md:block">{back}</div>
            {noteAbove && (
                <p className="text-center text-[13px] leading-4.5 text-muted-foreground md:hidden">
                    {noteAbove}
                </p>
            )}
            <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                {status && (
                    <p
                        role="status"
                        className="hidden text-[13px] leading-4.5 text-muted-foreground md:block"
                    >
                        {status}
                    </p>
                )}
                {children}
            </div>
            {noteBelow && (
                <p className="text-center text-[13px] leading-4.5 text-muted-foreground md:hidden">
                    {noteBelow}
                </p>
            )}
        </div>
    );
}

/** "Continua" (turquoise outline) or "Invia per approvazione" (filled). */
export const gymNextClassName =
    'btn-brand h-13 w-full text-[17px] disabled:pointer-events-none disabled:text-[#707070] disabled:opacity-100 disabled:shadow-[inset_0_0_0_1px_var(--border)] md:h-12.5 md:w-70';

export const gymSendClassName =
    'flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand text-[17px] font-semibold text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)] outline-none hover:bg-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 md:h-12.5 md:w-70';

/** "Annulla" / "Indietro" of the desktop footer: white, underlined. */
export const gymBackClassName =
    'flex min-h-11 items-center px-2 text-[15px] font-semibold text-foreground underline underline-offset-3 outline-none hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/50';
