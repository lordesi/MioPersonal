import { cn } from '@/lib/utils';

/*
 * Chips that scroll sideways, then a sticky column from the given screen size.
 * Written out in full so Tailwind can find the classes.
 */
const layouts = {
    md: {
        nav: 'md:sticky md:top-6 md:mx-0 md:w-55 md:flex-none md:flex-col md:gap-0.5 md:overflow-visible md:px-0',
        link: 'md:h-10 md:rounded-lg md:border-0 md:bg-transparent md:text-sm',
    },
    // The trainer area already has a side menu: one more column fits only on wide screens.
    xl: {
        nav: 'xl:sticky xl:top-6 xl:mx-0 xl:w-55 xl:flex-none xl:flex-col xl:gap-0.5 xl:overflow-visible xl:px-0',
        link: 'xl:h-10 xl:rounded-lg xl:border-0 xl:bg-transparent xl:text-sm',
    },
} as const;

type SettingsNavProps = {
    /** id of each section and its title, in page order. */
    sections: { id: string; title: string }[];
    /** From which screen size the chips become a column on the left. */
    columnFrom?: keyof typeof layouts;
};

/** Links to the sections of "Impostazioni account". */
export default function SettingsNav({
    sections,
    columnFrom = 'md',
}: SettingsNavProps) {
    const layout = layouts[columnFrom];

    return (
        <nav
            aria-label="Sezioni"
            className={cn(
                '-mx-4 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0',
                layout.nav,
            )}
        >
            {sections.map((section) => (
                <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={cn(
                        'flex h-9 flex-none items-center rounded-full border bg-background px-3 text-[13px] font-medium whitespace-nowrap hover:bg-accent',
                        layout.link,
                    )}
                >
                    {section.title}
                </a>
            ))}
        </nav>
    );
}
