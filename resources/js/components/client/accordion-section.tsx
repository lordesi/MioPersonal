import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AccordionSectionProps = {
    title: ReactNode;
    /** Under the title while closed: what is chosen ("Milano · In presenza"). */
    summary?: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
};

/**
 * A section of "Modifica profilo" (design "Modifica profilo cliente · V1"):
 * the title with what is chosen under it and the arrow; open, the fields.
 * A thin line under each one.
 */
export default function AccordionSection({
    title,
    summary,
    defaultOpen = false,
    children,
}: AccordionSectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = useId();

    return (
        <section className="flex flex-col border-b border-separator">
            <h2>
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen(!open)}
                    className="flex w-full items-center gap-3.5 py-3 text-left text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                    <span className="flex min-h-12 min-w-0 flex-1 flex-col justify-center gap-0.5">
                        <span className="text-[17px] leading-5.5 font-semibold">
                            {title}
                        </span>
                        {summary && (
                            <span className="truncate text-[15px] leading-5 font-normal text-muted-foreground">
                                {summary}
                            </span>
                        )}
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className={cn(
                            'size-5 shrink-0 text-muted-foreground transition-transform duration-150',
                            open && 'rotate-180',
                        )}
                    />
                </button>
            </h2>
            <div
                id={panelId}
                hidden={!open}
                className="flex flex-col gap-5 pt-1 pb-6"
            >
                {children}
            </div>
        </section>
    );
}
