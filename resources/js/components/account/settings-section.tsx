import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

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

    return (
        <section
            id={id}
            aria-labelledby={titleId}
            className={cn(
                'flex scroll-mt-6 flex-col gap-4.5 rounded-3xl bg-card p-4 md:p-6',
                danger ? 'border-[1.5px] border-foreground' : 'border',
            )}
        >
            <div className="flex gap-3.5">
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex size-8 flex-none items-center justify-center rounded-full',
                        danger
                            ? 'border-[1.5px] border-foreground'
                            : 'bg-foreground text-background',
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
