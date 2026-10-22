import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import BrandLogo from '@/components/layout/brand-logo';
import StepNav, { steps } from '@/components/onboarding/trainer/step-nav';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

type OnboardingShellProps = {
    /** The open step; 8 after sending, when every step is done. */
    step: number;
    reached: number;
    firstStep: number;
    onSelect: (step: number) => void;
    /** The account at the bottom of the sidebar; null for a guest. */
    user: { name: string; email: string } | null;
    children: ReactNode;
};

/**
 * The page of "Diventa trainer": the black sidebar with the 7 steps on the
 * left, the open step on the right. On phones the sidebar becomes a strip
 * with the step and the progress bar, so the form starts on the first screen.
 */
export default function OnboardingShell({
    step,
    reached,
    firstStep,
    onSelect,
    user,
    children,
}: OnboardingShellProps) {
    const getInitials = useInitials();
    const shown = Math.min(step, steps.length);
    const percent = Math.round((shown / steps.length) * 100);

    return (
        <div className="flex min-h-screen flex-col bg-secondary lg:flex-row">
            <aside className="flex flex-col gap-5 bg-sidebar px-4 py-5 text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:w-70 lg:flex-none lg:gap-8 lg:overflow-y-auto lg:px-5 lg:py-7">
                <BrandLogo className="px-1 text-sidebar-foreground" />

                <div className="flex flex-col gap-3 px-1">
                    <span className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground">
                        DIVENTA TRAINER
                    </span>
                    <span className="text-[26px] leading-8 font-bold tracking-[-0.03em] tabular-nums">
                        Passo {shown} di {steps.length}
                    </span>
                    <div
                        role="progressbar"
                        aria-label="Avanzamento della registrazione"
                        aria-valuenow={shown}
                        aria-valuemin={1}
                        aria-valuemax={steps.length}
                        className="h-1.5 overflow-hidden rounded-full bg-sidebar-border"
                    >
                        <div
                            className="h-full rounded-full bg-sidebar-primary transition-[width]"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                <div className="hidden lg:block">
                    <StepNav
                        step={step}
                        reached={reached}
                        firstStep={firstStep}
                        onSelect={onSelect}
                    />
                </div>

                {user && (
                    <div className="mt-auto hidden items-center gap-3 rounded-xl border border-sidebar-border p-2.5 lg:flex">
                        <span
                            aria-hidden="true"
                            className="flex size-9 flex-none items-center justify-center rounded-full bg-sidebar-primary text-[13px] font-bold text-sidebar-primary-foreground"
                        >
                            {getInitials(user.name)}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-sm font-semibold">
                                {user.name}
                            </span>
                            <span className="truncate text-xs text-sidebar-muted-foreground">
                                {user.email}
                            </span>
                        </span>
                    </div>
                )}
            </aside>

            <main className="min-w-0 flex-1 px-4 pt-6 pb-4 md:px-10 md:pt-8">
                <div className="mx-auto flex max-w-280 flex-col gap-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

/** "PASSO 2 DI 7 · PROFILO PUBBLICO", the title and a pill on the right. */
export function StepHeader({
    step,
    title,
    pill,
}: {
    step: number;
    title: string;
    pill: ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-180 flex-col gap-2">
                <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase tabular-nums">
                    Passo {step} di {steps.length} · {steps[step - 1].label}
                </span>
                <h1 className="text-[28px] leading-9 font-bold tracking-[-0.03em] md:text-[34px] md:leading-10">
                    {title}
                </h1>
            </div>
            {pill}
        </header>
    );
}

/** The cards of the step on the left, the black preview on the right. */
export function StepColumns({
    children,
    aside,
}: {
    children: ReactNode;
    aside: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-start gap-5">
            <div className="flex min-w-0 flex-[3_1_540px] flex-col gap-4">
                {children}
            </div>
            <div className="min-w-0 flex-[2_1_320px] lg:sticky lg:top-6">
                {aside}
            </div>
        </div>
    );
}

/**
 * The black panel on the right of every step (preview, checklist, notes).
 * Without a title it needs an accessible name: `label`.
 */
export function DarkPanel({
    title,
    label,
    action,
    className,
    children,
}: {
    title?: string;
    label?: string;
    /** On the right of the title, e.g. an icon. */
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : label}
            className={cn(
                'flex flex-col gap-4.5 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground',
                className,
            )}
        >
            {title && (
                <div className="flex items-center justify-between gap-2">
                    <h2
                        id={titleId}
                        className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground uppercase"
                    >
                        {title}
                    </h2>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

/** A note with an icon at the bottom of a black panel, over a thin line. */
export function PanelNote({
    icon,
    children,
}: {
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <p className="flex gap-2.5 border-t border-sidebar-border pt-4 text-[13px] leading-4.5 text-sidebar-foreground/85 [&>svg]:mt-px [&>svg]:size-4 [&>svg]:flex-none">
            {icon}
            <span>{children}</span>
        </p>
    );
}

/** The white pill of the header: "Circa 10 minuti", "6 passi completati". */
export function HeaderPill({
    icon,
    dark = false,
    children,
}: {
    icon: ReactNode;
    dark?: boolean;
    children: ReactNode;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-8 items-center gap-2 rounded-full px-3 text-[13px] leading-4.5 [&>svg]:size-3.5',
                dark
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'border bg-card font-medium text-foreground/70',
            )}
        >
            {icon}
            {children}
        </span>
    );
}

/**
 * A big checkbox on a whole row: "Accetto i Termini…" (step 1) and
 * "Confermo che le informazioni…" (step 7). Black border when checked.
 */
export function CheckRow({
    checked,
    onCheckedChange,
    error,
    children,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    /** From the server, e.g. the terms not accepted. */
    error?: string;
    children: ReactNode;
}) {
    const errorId = useId();

    return (
        <div className="flex flex-col gap-1.5">
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                onClick={() => onCheckedChange(!checked)}
                className={cn(
                    'flex w-full items-center gap-3.5 rounded-2xl border bg-card px-4.5 py-4 text-left transition-colors',
                    checked
                        ? 'border-foreground shadow-[inset_0_0_0_1px_var(--foreground)]'
                        : 'hover:bg-muted/50',
                    error && !checked && 'border-destructive',
                )}
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex size-6 flex-none items-center justify-center rounded-[7px]',
                        checked
                            ? 'bg-foreground text-background'
                            : 'border-[1.5px] border-ring text-transparent',
                    )}
                >
                    <Check strokeWidth={3.5} className="size-3.5" />
                </span>
                {children}
            </button>
            {error && (
                <p id={errorId} className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}

/** The bar stuck to the bottom of the screen: back, status, save, continue. */
export function StepBar({ children }: { children: ReactNode }) {
    return (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border bg-card/95 py-3 pr-3 pl-4 shadow-[0_10px_30px_rgba(10,10,10,0.08)] backdrop-blur-sm">
            {children}
        </div>
    );
}
