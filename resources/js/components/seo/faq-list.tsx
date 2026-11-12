import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FaqItem = { question: string; answer: string };

/**
 * "Domande frequenti": the questions of the page's FAQPage JSON-LD, with the
 * same words. Native <details>: the answers are in the HTML even when closed,
 * for search engines and AI assistants, and open without JavaScript.
 */
export default function FaqList({
    title = 'Domande frequenti',
    items,
    className,
}: {
    title?: string;
    items: FaqItem[];
    className?: string;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="faq-title"
            className={cn('flex flex-col gap-3.5', className)}
        >
            <h2 id="faq-title" className="text-lg leading-6.5 font-semibold">
                {title}
            </h2>
            <div className="flex flex-col divide-y rounded-2xl border bg-card">
                {items.map((item) => (
                    <details key={item.question} className="group px-4 sm:px-5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] leading-5.5 font-semibold [&::-webkit-details-marker]:hidden">
                            <h3>{item.question}</h3>
                            <ChevronDown
                                aria-hidden="true"
                                className="size-4.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                            />
                        </summary>
                        <p className="max-w-3xl pb-4 text-[15px] leading-6 text-muted-foreground">
                            {item.answer}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    );
}
