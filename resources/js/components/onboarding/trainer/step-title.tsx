import { createContext, useContext } from 'react';

/**
 * True when the steps are shown in "Modifica profilo" (trainer area) instead
 * of "Diventa trainer": smaller titles and no words about the other steps.
 */
export const EditingProfileContext = createContext(false);

export function useEditingProfile(): boolean {
    return useContext(EditingProfileContext);
}

/** Title and subtitle at the top of every registration step. */
export default function StepTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    // In "Modifica profilo" the page has its own h1: each step is a section.
    const Heading = useEditingProfile() ? 'h2' : 'h1';

    return (
        <div className="flex flex-col gap-1.5">
            <Heading
                className={
                    Heading === 'h2'
                        ? 'text-lg font-semibold'
                        : 'text-[26px] leading-8 font-semibold tracking-tight md:text-3xl'
                }
            >
                {title}
            </Heading>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
