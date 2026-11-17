import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { sectionTitleClassName } from '@/components/mp/page-bits';
import { cn } from '@/lib/utils';
import { show as contact } from '@/routes/contact';

export type FaqItem = { question: string; answer: string };

/**
 * "Domande frequenti": the questions of the page's FAQPage JSON-LD, with the
 * same words. One answer open at a time, the first one open at the start.
 * The closed answers stay in the HTML (hidden), for search engines and AI
 * assistants. Desktop: the title on the left, the questions on the right.
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
    const [open, setOpen] = useState(0);
    const id = useId();

    if (items.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby={`${id}-title`}
            className={cn(
                'flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:gap-x-16 md:gap-y-6',
                className,
            )}
        >
            <div className="flex flex-col gap-3 md:flex-[1_1_280px]">
                <h2 id={`${id}-title`} className={sectionTitleClassName}>
                    {title}
                </h2>
                <p className="hidden text-[17px] leading-6 text-muted-foreground md:block">
                    Non trovi la risposta?{' '}
                    <Link
                        href={contact()}
                        className="font-semibold text-brand outline-none hover:text-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        Scrivici
                    </Link>
                </p>
            </div>
            <div className="flex min-w-0 flex-col rounded-[26px] bg-card px-4 md:flex-[999_1_560px] md:px-6">
                {items.map((item, index) => {
                    const isOpen = open === index;
                    const answerId = `${id}-answer-${index}`;

                    return (
                        <div
                            key={item.question}
                            className="flex flex-col border-b border-separator last:border-b-0"
                        >
                            <h3>
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-controls={answerId}
                                    onClick={() => setOpen(isOpen ? -1 : index)}
                                    className="flex min-h-14 w-full items-center justify-between gap-3 py-3.5 text-left text-[17px] leading-5.5 font-semibold tracking-[-0.43px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:min-h-15 md:gap-4 md:py-4"
                                >
                                    {item.question}
                                    <ChevronDown
                                        aria-hidden="true"
                                        className={cn(
                                            'size-5 shrink-0 transition-transform duration-200',
                                            isOpen
                                                ? 'rotate-180 text-brand'
                                                : 'text-muted-foreground',
                                        )}
                                    />
                                </button>
                            </h3>
                            <p
                                id={answerId}
                                hidden={!isOpen}
                                className="max-w-170 pr-8 pb-4 text-[15px] leading-5.25 text-muted-foreground md:pr-12 md:pb-5 md:text-base md:leading-6"
                            >
                                {item.answer}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
