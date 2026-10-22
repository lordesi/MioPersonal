import type { ReactNode } from 'react';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import NumberedSection from '@/components/trainer/area/numbered-section';

type SectionCardProps = {
    /** The number in the black circle. */
    step: number;
    title: string;
    description: string;
    /** On the right of the title, e.g. "1 di 3". */
    action?: ReactNode;
    /** Messages from the server for this card. */
    errors?: string[];
    children: ReactNode;
};

/** A numbered card of "Servizi e prezzi", with the server's messages on top. */
export default function SectionCard({
    step,
    title,
    description,
    action,
    errors = [],
    children,
}: SectionCardProps) {
    return (
        <NumberedSection
            step={step}
            title={title}
            description={description}
            action={action}
        >
            <StepErrors title="Da sistemare:" errors={errors} />
            {children}
        </NumberedSection>
    );
}
