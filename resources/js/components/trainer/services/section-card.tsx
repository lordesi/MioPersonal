import type { ReactNode } from 'react';
import StepErrors from '@/components/onboarding/trainer/step-errors';

type SectionCardProps = {
    title: string;
    description: string;
    /** On the right of the title, e.g. "1 di 3" or the first session choice. */
    action?: ReactNode;
    /** Messages from the server for this card. */
    errors?: string[];
    children: ReactNode;
};

/** A white card of "Servizi e prezzi": title, grey line under it, content. */
export default function SectionCard({
    title,
    description,
    action,
    errors = [],
    children,
}: SectionCardProps) {
    return (
        <section className="flex flex-col gap-4 rounded-[20px] border bg-card p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-[17px] leading-6 font-semibold tracking-tight">
                        {title}
                    </h2>
                    <p className="text-[13px] leading-5 text-muted-foreground">
                        {description}
                    </p>
                </div>
                {action}
            </div>
            <StepErrors title="Da sistemare:" errors={errors} />
            {children}
        </section>
    );
}
