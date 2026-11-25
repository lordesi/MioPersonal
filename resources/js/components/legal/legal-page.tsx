import { Head, Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    PageBreadcrumb,
    brandFilledClassName,
    darkCardClassName,
    pageColumnClassName,
    pageTitleClassName,
} from '@/components/mp/page-bits';
import { cn } from '@/lib/utils';
import { show as contactPage } from '@/routes/contact';

export type LegalSection = {
    /** Anchor in the URL, e.g. "#dati". */
    id: string;
    title: string;
    content: ReactNode;
};

type LegalPageProps = {
    /** Breadcrumb and browser tab, e.g. "Privacy policy". */
    pageName: string;
    title: string;
    intro: string;
    /** Shown as "Ultimo aggiornamento: …". */
    updatedOn: string;
    sections: LegalSection[];
    /** "Hai una domanda su questa pagina?" at the end (only the terms, as in the design). */
    questions?: boolean;
};

const smallLabelClassName =
    'text-xs leading-4 font-semibold tracking-[0.6px] uppercase';

/**
 * Privacy, Terms and Cookie pages: same structure, different texts.
 * Phones: every section folds (the first one open).
 * Desktop: the index on the left, the sections open on the right.
 * The texts are drafts: a lawyer must check them before the launch.
 */
export default function LegalPage({
    pageName,
    title,
    intro,
    updatedOn,
    sections,
    questions = false,
}: LegalPageProps) {
    // Phones: the open sections; desktop shows them all.
    const [open, setOpen] = useState<string[]>(
        sections.length > 0 ? [sections[0].id] : [],
    );
    const toggle = (id: string) =>
        setOpen((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );

    // Phones: a link to "#dati" opens that section.
    useEffect(() => {
        const id = window.location.hash.slice(1);

        if (sections.some((section) => section.id === id)) {
            setOpen((current) =>
                current.includes(id) ? current : [...current, id],
            );
        }
    }, [sections]);

    return (
        <div
            className={cn(
                pageColumnClassName,
                'gap-8 pb-12 md:gap-12 md:pb-24',
            )}
        >
            <Head title={pageName} />

            <header className="flex flex-col gap-3 pt-2 md:gap-4 md:pt-6">
                <PageBreadcrumb current={pageName} />
                <h1 className={pageTitleClassName}>{title}</h1>
                <p className="text-[17px] leading-6 text-muted-foreground md:max-w-170 md:text-xl md:leading-7.5">
                    {intro}
                </p>
                <p className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                    Ultimo aggiornamento: {updatedOn}
                </p>
            </header>

            <div className="flex flex-col gap-8 md:flex-row md:flex-wrap md:items-start md:gap-x-16 md:gap-y-12">
                <nav
                    aria-label="Indice"
                    className="hidden max-w-80 flex-[1_1_240px] flex-col gap-2 md:flex"
                >
                    <span
                        className={cn(
                            smallLabelClassName,
                            'text-muted-foreground',
                        )}
                    >
                        Indice
                    </span>
                    <ol>
                        {sections.map((section, index) => (
                            <li key={section.id}>
                                <a
                                    href={`#${section.id}`}
                                    className="flex min-h-9 items-center gap-3 text-[15px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    <span className="w-5 shrink-0 font-semibold text-brand tabular-nums">
                                        {index + 1}
                                    </span>
                                    {section.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <article className="flex min-w-0 flex-col gap-8 md:max-w-180 md:flex-[999_1_560px] md:gap-12">
                    <div className="flex flex-col md:gap-12">
                        {sections.map((section, index) => {
                            const isOpen = open.includes(section.id);
                            const contentId = `${section.id}-content`;

                            return (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    aria-labelledby={`${section.id}-title`}
                                    className="flex scroll-mt-6 flex-col border-b border-separator md:gap-4 md:border-b-0"
                                >
                                    <h2
                                        id={`${section.id}-title`}
                                        className="text-[17px] leading-5.5 font-semibold tracking-[-0.43px] md:text-[22px] md:leading-7 md:font-bold md:tracking-normal"
                                    >
                                        {/* Phones: the row that opens and closes the section. */}
                                        <button
                                            type="button"
                                            aria-expanded={isOpen}
                                            aria-controls={contentId}
                                            onClick={() => toggle(section.id)}
                                            className="flex min-h-14 w-full items-center gap-3 py-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
                                        >
                                            <SectionNumber number={index + 1} />
                                            <span className="flex-1">
                                                {section.title}
                                            </span>
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
                                        {/* Desktop: a plain title. */}
                                        <span className="hidden gap-3 md:flex">
                                            <SectionNumber number={index + 1} />
                                            {section.title}
                                        </span>
                                    </h2>
                                    <div
                                        id={contentId}
                                        className={cn(
                                            'flex-col gap-3 pb-5 pl-9 text-[15px] leading-5.25 md:flex md:gap-4 md:pb-0 md:pl-0 md:text-base md:leading-6.5 [&_a]:text-brand',
                                            isOpen ? 'flex' : 'hidden',
                                        )}
                                    >
                                        {section.content}
                                    </div>
                                </section>
                            );
                        })}
                    </div>

                    {questions && (
                        <section
                            aria-label="Domande"
                            className={cn(
                                darkCardClassName,
                                'flex flex-wrap items-center justify-between gap-4 p-4 md:p-6',
                            )}
                        >
                            <span className="flex flex-col gap-0.5">
                                <span className="text-[17px] leading-5.5 font-semibold">
                                    Hai una domanda su questa pagina?
                                </span>
                                <span className="text-[13px] leading-4.5 text-muted-foreground md:text-[15px] md:leading-5.25">
                                    Ti rispondiamo noi, senza giri di parole.
                                </span>
                            </span>
                            <Link
                                href={contactPage()}
                                className={cn(
                                    brandFilledClassName,
                                    'h-11 px-6',
                                )}
                            >
                                Scrivici
                            </Link>
                        </section>
                    )}
                </article>
            </div>
        </div>
    );
}

function SectionNumber({ number }: { number: number }) {
    return (
        <span className="w-6 shrink-0 text-brand tabular-nums">{number}</span>
    );
}

/** A paragraph of a legal section. */
export function LegalParagraph({ children }: { children: ReactNode }) {
    return <p>{children}</p>;
}

/** A bulleted list of a legal section. */
export function LegalList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="flex list-disc flex-col gap-2.5 pl-4.5">
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
}

/** A highlighted remark, e.g. "Non chiediamo dati sulla salute". */
export function LegalNote({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <p
            className={cn(
                'rounded-[14px] bg-muted px-3.5 py-3 text-[13px] leading-4.5 text-muted-foreground md:px-4 md:py-3.5 md:text-[15px] md:leading-5.25',
                className,
            )}
        >
            {children}
        </p>
    );
}
