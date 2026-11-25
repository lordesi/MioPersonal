import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { tabBarPrefetch } from '@/lib/prefetch';
import { cn } from '@/lib/utils';

export type AreaTab = {
    key: string;
    label: string;
    icon: LucideIcon;
    href: string;
    /** "Inbox, 2 non lette": read by the screen readers. */
    ariaLabel?: string;
    /** A turquoise dot: something new inside. */
    dot?: boolean;
};

type AreaTabBarProps = {
    tabs: AreaTab[];
    current: string | null;
    /** e.g. `md:hidden` on the public pages, which have no side menu. */
    className?: string;
};

/**
 * The tab bar of the areas on phones (MioPersonal.TabBar): a glass pill at
 * the bottom, icon and name for each place; the current one in turquoise on
 * a grey fill.
 */
export default function AreaTabBar({
    tabs,
    current,
    className,
}: AreaTabBarProps) {
    return (
        <div
            className={cn(
                'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]',
                className,
            )}
        >
            <nav
                aria-label="Navigazione principale"
                className="pointer-events-auto flex min-h-16 w-full max-w-105 gap-0.5 rounded-full border border-[#edeef014] bg-glass p-1 shadow-[inset_0_1px_0_0_rgba(237,238,240,0.08),0_8px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur-[24px] backdrop-saturate-[1.8]"
            >
                {tabs.map((tab) => {
                    const active = tab.key === current;

                    return (
                        <Link
                            prefetch={tabBarPrefetch}
                            data-prefetch="mount"
                            key={tab.key}
                            href={tab.href}
                            aria-label={tab.ariaLabel}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'relative flex min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] leading-3.25 tracking-[0.06px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                                active
                                    ? 'bg-[#8e92993d] font-semibold text-brand'
                                    : 'font-medium text-foreground',
                            )}
                        >
                            <tab.icon
                                aria-hidden="true"
                                className="size-6"
                                strokeWidth={active ? 2.25 : 1.75}
                            />
                            <span
                                aria-hidden={tab.ariaLabel ? true : undefined}
                            >
                                {tab.label}
                            </span>
                            {tab.dot && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-2 left-[calc(50%+7px)] size-2.25 rounded-full bg-brand shadow-[0_0_0_2px_#000]"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
