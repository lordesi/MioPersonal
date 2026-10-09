import { Head, Link } from '@inertiajs/react';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
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
    summary: string[];
    sections: LegalSection[];
};

/**
 * Privacy, Terms and Cookie pages: same structure, different texts.
 * The texts are drafts: a lawyer must check them before the launch.
 */
export default function LegalPage({
    pageName,
    title,
    intro,
    updatedOn,
    summary,
    sections,
}: LegalPageProps) {
    return (
        <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 pt-5 pb-10 md:gap-8 md:px-8 md:pt-10 md:pb-20">
            <Head title={pageName} />

            <div className="flex max-w-195 flex-col gap-6">
                <nav
                    aria-label="Percorso"
                    className="text-sm text-muted-foreground"
                >
                    <Link href={home()} className="hover:underline">
                        Home
                    </Link>{' '}
                    /{' '}
                    <span aria-current="page" className="text-foreground">
                        {pageName}
                    </span>
                </nav>

                <div className="flex flex-col gap-2.5">
                    <span className="flex h-6 items-center self-start rounded-full border border-dashed border-foreground px-2.5 text-xs font-semibold">
                        Bozza da far verificare a un legale
                    </span>
                    <h1 className="text-3xl leading-9 font-bold tracking-tighter md:text-[44px] md:leading-12">
                        {title}
                    </h1>
                    <p className="text-lg text-muted-foreground">{intro}</p>
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                        Ultimo aggiornamento: {updatedOn}
                    </span>
                </div>

                <section
                    aria-label="In breve"
                    className="flex flex-col gap-3 rounded-[18px] bg-primary p-4.5 text-primary-foreground md:p-6"
                >
                    <span className="text-xs font-semibold tracking-[0.08em] uppercase opacity-70">
                        In breve
                    </span>
                    <ul className="flex flex-col gap-2.5">
                        {summary.map((item) => (
                            <li
                                key={item}
                                className="flex gap-2.5 text-[15px] leading-5.5"
                            >
                                <Check
                                    aria-hidden="true"
                                    strokeWidth={2.5}
                                    className="mt-0.75 size-4 shrink-0"
                                />
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                <MobileIndex sections={sections} />
            </div>

            <div className="flex flex-wrap items-start gap-14">
                <nav
                    aria-label="Indice"
                    className="sticky top-6 hidden max-w-65 flex-[1_1_220px] flex-col gap-1.5 md:flex"
                >
                    <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                        Indice
                    </span>
                    <IndexList sections={sections} />
                </nav>

                <article className="flex max-w-190 min-w-0 flex-[999_1_560px] flex-col gap-9">
                    {sections.map((section, index) => (
                        <section
                            key={section.id}
                            id={section.id}
                            aria-labelledby={`${section.id}-title`}
                            className="flex scroll-mt-6 flex-col gap-3"
                        >
                            <h2
                                id={`${section.id}-title`}
                                className="flex gap-3 text-xl font-semibold tracking-tight md:text-2xl"
                            >
                                <span className="text-muted-foreground tabular-nums">
                                    {index + 1}.
                                </span>
                                {section.title}
                            </h2>
                            {section.content}
                        </section>
                    ))}

                    <section
                        aria-label="Domande"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border bg-card p-5"
                    >
                        <span className="flex flex-col">
                            <span className="font-semibold">
                                Hai una domanda su questa pagina?
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Ti rispondiamo noi, senza giri di parole.
                            </span>
                        </span>
                        <Button asChild className="h-11 rounded-[10px] px-4.5">
                            <Link href={contactPage()}>Scrivici</Link>
                        </Button>
                    </section>
                </article>
            </div>
        </div>
    );
}

function IndexList({ sections }: { sections: LegalSection[] }) {
    return (
        <ol>
            {sections.map((section, index) => (
                <li key={section.id}>
                    <a
                        href={`#${section.id}`}
                        className="flex gap-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <span className="w-5 shrink-0 font-semibold text-foreground tabular-nums">
                            {index + 1}
                        </span>
                        {section.title}
                    </a>
                </li>
            ))}
        </ol>
    );
}

/** Below md the index is folded: "Indice · 9 sezioni". */
function MobileIndex({ sections }: { sections: LegalSection[] }) {
    return (
        <Collapsible className="group rounded-xl border bg-card md:hidden">
            <CollapsibleTrigger className="flex min-h-12 w-full items-center justify-between px-3.5 text-[15px] font-semibold">
                Indice · {sections.length} sezioni
                <ChevronDown
                    aria-hidden="true"
                    className="size-4 transition-transform group-data-[state=open]:rotate-180"
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3.5 pb-2.5">
                <IndexList sections={sections} />
            </CollapsibleContent>
        </Collapsible>
    );
}

/** A paragraph of a legal section. */
export function LegalParagraph({ children }: { children: ReactNode }) {
    return <p className="leading-6.5">{children}</p>;
}

/** A bulleted list of a legal section. */
export function LegalList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="flex list-disc flex-col gap-2 pl-5 leading-6.5">
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
                'rounded-r-[10px] border-l-3 border-foreground bg-muted px-3.5 py-3 text-sm leading-5.25',
                className,
            )}
        >
            {children}
        </p>
    );
}
