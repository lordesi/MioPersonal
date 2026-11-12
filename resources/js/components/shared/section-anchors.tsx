import { cn } from '@/lib/utils';

/**
 * A bar of links to the sections of a long page ("Corsi · Abbonamenti ·
 * Trainer…"), stuck to the top while scrolling; sideways on phones.
 * Only the sections on the page: pass the ones with content.
 */
export default function SectionAnchors({
    sections,
    className,
}: {
    sections: { id: string; label: string }[];
    className?: string;
}) {
    if (sections.length < 2) {
        return null;
    }

    return (
        <nav
            aria-label="Sezioni della pagina"
            className={cn(
                'sticky top-0 z-20 border-b bg-background/95 backdrop-blur',
                className,
            )}
        >
            <ul className="mx-auto flex w-full max-w-7xl [scrollbar-width:none] gap-1 overflow-x-auto px-2 md:px-6">
                {sections.map((section) => (
                    <li key={section.id} className="shrink-0">
                        <a
                            href={`#${section.id}`}
                            className="flex h-12 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground"
                        >
                            {section.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
