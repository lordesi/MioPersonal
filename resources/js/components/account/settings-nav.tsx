import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/*
 * Chips that scroll sideways, then a white sticky card from the given screen size.
 * Written out in full so Tailwind can find the classes.
 */
const layouts = {
    md: {
        nav: 'md:sticky md:top-6 md:mx-0 md:w-55 md:flex-none md:flex-col md:gap-0.5 md:overflow-visible md:rounded-[20px] md:border md:bg-card md:p-2.5',
        link: 'md:h-10 md:rounded-[10px] md:border-0 md:px-3 md:text-sm',
        idle: 'md:bg-transparent md:text-foreground/80',
        divider: 'md:flex',
    },
    // The trainer area already has a side menu: one more column fits only on wide screens.
    xl: {
        nav: 'xl:sticky xl:top-6 xl:mx-0 xl:w-55 xl:flex-none xl:flex-col xl:gap-0.5 xl:overflow-visible xl:rounded-[20px] xl:border xl:bg-card xl:p-2.5',
        link: 'xl:h-10 xl:rounded-[10px] xl:border-0 xl:px-3 xl:text-sm',
        idle: 'xl:bg-transparent xl:text-foreground/80',
        divider: 'xl:flex',
    },
} as const;

export type SettingsNavSection = {
    /** id of the section, e.g. "dati" → "#dati". */
    id: string;
    title: string;
    icon: LucideIcon;
    /** Listed under "ZONA DELICATA". */
    danger?: boolean;
};

type SettingsNavProps = {
    /** In page order, the danger ones last. */
    sections: SettingsNavSection[];
    /** From which screen size the chips become a column on the left. */
    columnFrom?: keyof typeof layouts;
};

/** Links to the sections of "Impostazioni account"; the one on screen is black. */
export default function SettingsNav({
    sections,
    columnFrom = 'md',
}: SettingsNavProps) {
    const layout = layouts[columnFrom];
    const [current, setCurrent] = useState(sections[0]?.id);

    // The section that crosses the top part of the screen is the current one.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((entry) => entry.isIntersecting);

                if (visible) {
                    setCurrent(visible.target.id);
                }
            },
            { rootMargin: '0px 0px -70% 0px' },
        );

        sections.forEach(({ id }) => {
            const element = document.getElementById(id);

            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [sections]);

    const link = (section: SettingsNavSection) => {
        const active = section.id === current;

        return (
            <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => setCurrent(section.id)}
                className={cn(
                    'flex h-9 flex-none items-center gap-2.5 rounded-full border px-3 text-[13px] whitespace-nowrap',
                    layout.link,
                    active
                        ? 'border-foreground bg-foreground font-semibold text-background'
                        : cn(
                              'bg-background font-medium hover:bg-accent',
                              layout.idle,
                          ),
                )}
            >
                <section.icon aria-hidden="true" className="size-4" />
                <span className="flex-1">{section.title}</span>
            </a>
        );
    };

    const regular = sections.filter((section) => !section.danger);
    const danger = sections.filter((section) => section.danger);

    return (
        <nav
            aria-label="Sezioni"
            className={cn(
                '-mx-4 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4',
                layout.nav,
            )}
        >
            {regular.map(link)}
            {danger.length > 0 && (
                <span
                    className={cn(
                        'mx-3 mt-2.5 mb-1 hidden border-t pt-3 text-[11px] leading-3.5 font-bold tracking-[0.08em] text-muted-foreground',
                        layout.divider,
                    )}
                >
                    ZONA DELICATA
                </span>
            )}
            {danger.map(link)}
        </nav>
    );
}
