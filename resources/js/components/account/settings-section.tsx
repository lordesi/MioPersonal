import type { LucideIcon } from 'lucide-react';
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * True inside a page of its own ("Impostazioni › Dati personali" of the
 * client): no card and no title, the page has them.
 */
export const BareSettingsSection = createContext(false);

type SettingsSectionProps = {
    /** Anchor of the section menu, e.g. "dati" → "#dati". */
    id: string;
    title: string;
    icon: LucideIcon;
    description?: ReactNode;
    /** Dark border and outlined icon, for "Chiudi il profilo" and "Elimina account". */
    danger?: boolean;
    children: ReactNode;
};

/** One card of "Impostazioni account": round icon, title and the content. */
export default function SettingsSection({
    id,
    title,
    icon: Icon,
    description,
    danger = false,
    children,
}: SettingsSectionProps) {
    const titleId = `${id}-title`;
    const bare = useContext(BareSettingsSection);

    if (bare) {
        return (
            <section
                id={id}
                aria-labelledby={titleId}
                className="flex flex-col gap-4.5"
            >
                <h2 id={titleId} className="sr-only">
                    {title}
                </h2>
                {description && (
                    <p className="text-[15px] leading-5 text-muted-foreground">
                        {description}
                    </p>
                )}
                {children}
            </section>
        );
    }

    return (
        <section
            id={id}
            aria-labelledby={titleId}
            className={cn(
                'flex scroll-mt-6 flex-col gap-4.5 rounded-3xl bg-card p-4 in-[.trainer-area]:rounded-[26px] md:p-6 md:in-[.trainer-area]:rounded-[20px] md:in-[.trainer-area]:bg-transparent md:in-[.trainer-area]:shadow-[inset_0_0_0_1px_var(--border)]',
                danger
                    ? 'border-[1.5px] border-foreground in-[.trainer-area]:border-destructive'
                    : 'border in-[.trainer-area]:border-0',
            )}
        >
            <div className="flex gap-3.5">
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex size-8 flex-none items-center justify-center rounded-full',
                        danger
                            ? 'border-[1.5px] border-foreground'
                            : 'bg-foreground text-background in-[.trainer-area]:bg-transparent in-[.trainer-area]:text-brand in-[.trainer-area]:shadow-[inset_0_0_0_1.5px_var(--brand)]',
                    )}
                >
                    <Icon className="size-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                    <h2
                        id={titleId}
                        className="text-[19px] leading-6.5 font-bold tracking-tight"
                    >
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children}
        </section>
    );
}
