import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { brandFilledButtonClassName } from '@/components/trainer/ui/styles';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { profile } from '@/routes/trainer';

type ProfilePageProps = {
    /** "Servizi e prezzi". */
    title: ReactNode;
    /** Under the title, grey. */
    intro?: ReactNode;
    /** Right of the title on desktop, e.g. "Vedi profilo pubblico". */
    action?: ReactNode;
    /** Where "‹" goes back to: "Profilo" unless said otherwise. */
    back?: { href: string; label: string };
    children: ReactNode;
    className?: string;
};

/**
 * A page of "Profilo" (services, hours, reviews…) in the "carbone" design:
 * "‹ Profilo", the bold title with a grey line under it, then the
 * sections in a column of 960px on desktop. Phones get "‹ Profilo" from the
 * layout; desktop has it here.
 */
export default function ProfilePage({
    title,
    intro,
    action,
    back: customBack,
    children,
    className,
}: ProfilePageProps) {
    const isMobile = useIsMobile();
    const back = customBack ?? { href: profile.url(), label: 'Profilo' };

    return (
        <div
            className={cn(
                'flex w-full max-w-240 flex-col gap-8 md:pb-8',
                className,
            )}
        >
            <div className="flex flex-col gap-1">
                {/* Phones: the layout has "‹ Profilo"; another way back is shown here. */}
                {(!isMobile || customBack) && (
                    <Link
                        href={back.href}
                        className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-base font-semibold text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <ChevronLeft aria-hidden="true" className="size-5" />
                        {back.label}
                    </Link>
                )}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <h1 className="text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance md:text-[40px]">
                            {title}
                        </h1>
                        {intro && (
                            <p className="text-[15px] leading-5 text-muted-foreground md:text-[17px] md:leading-6">
                                {intro}
                            </p>
                        )}
                    </div>
                    {action}
                </div>
            </div>
            {children}
        </div>
    );
}

/** A section of a Profilo page: the same as the steps of "Diventa trainer". */
export { Section as ProfileSection } from '@/components/onboarding/dark-fields';

/**
 * "Salva modifiche" of a Profilo page, as the bottom of a step. Phones: stuck
 * above the tab bar over a fade. Desktop: a line above, the status on the
 * left, the filled button on the right. A submit button of its form.
 */
export function SaveBar({
    status,
    disabled,
    saving,
    label = 'Salva modifiche',
}: {
    /** "Modifiche non salvate", "Controlla i campi segnati"… */
    status?: string;
    disabled: boolean;
    saving: boolean;
    label?: string;
}) {
    return (
        <div className="sticky bottom-24 z-10 -mx-4 flex flex-col gap-2 bg-[linear-gradient(180deg,rgba(10,10,10,0)_0%,#0a0a0a_35%)] px-4 pt-6 pb-2 md:static md:mx-0 md:flex-row md:items-center md:justify-end md:gap-6 md:border-t md:border-border md:bg-none md:px-0 md:pt-6 md:pb-0">
            {status && (
                <p
                    role="status"
                    className="text-center text-[13px] leading-4.5 text-muted-foreground md:text-right"
                >
                    {status}
                </p>
            )}
            <button
                type="submit"
                disabled={disabled || saving}
                className={cn(
                    brandFilledButtonClassName,
                    'h-13 w-full text-[17px] md:h-12.5 md:w-70',
                )}
            >
                {saving ? 'Salvataggio…' : label}
            </button>
        </div>
    );
}
