import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SettingsSectionProps = {
    /** Anchor of the section menu, e.g. "dati" → "#dati". */
    id: string;
    title: string;
    description?: ReactNode;
    /** Thicker dark border, for "Elimina account" and "Chiudi il profilo". */
    danger?: boolean;
    children: ReactNode;
};

/** One card of "Impostazioni account". */
export default function SettingsSection({
    id,
    title,
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
                'flex scroll-mt-6 flex-col gap-4 rounded-xl bg-card p-4 md:p-6',
                danger ? 'border-[1.5px] border-foreground' : 'border',
            )}
        >
            <div className="flex flex-col gap-1">
                <h2
                    id={titleId}
                    className="text-lg leading-6.5 font-semibold tracking-tight"
                >
                    {title}
                </h2>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}
