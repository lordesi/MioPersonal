import { Link } from '@inertiajs/react';
import type { TrainerNavSection } from '@/components/layout/trainer-nav';
import {
    profileNavItem,
    trainerNavItems,
} from '@/components/layout/trainer-nav';
import { dotLabel } from '@/components/layout/trainer/trainer-sidebar';
import { glassClassName } from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';

type TrainerTabBarProps = {
    current: TrainerNavSection | null;
    pendingCount: number;
    unreadChats: number;
};

/**
 * The tab bar of the trainer area on phones (Vetro 4): a glass pill floating
 * at the bottom with Home, Calendario, Clienti and Profilo.
 */
export default function TrainerTabBar({
    current,
    pendingCount,
    unreadChats,
}: TrainerTabBarProps) {
    const items = [...trainerNavItems(), profileNavItem()];
    const dots = { home: pendingCount, clients: unreadChats } as Partial<
        Record<TrainerNavSection, number>
    >;

    return (
        <div className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center">
            <nav
                aria-label="Navigazione principale"
                className={cn(
                    'pointer-events-auto flex h-18 items-center gap-2.5 rounded-full p-1.75',
                    glassClassName,
                )}
            >
                {items.map((item) => {
                    const active = item.section === current;
                    const dot = dots[item.section] ?? 0;

                    return (
                        <Link
                            key={item.section}
                            href={item.href}
                            aria-label={
                                dot > 0
                                    ? `${item.title}, ${dotLabel(item.section, dot)}`
                                    : item.title
                            }
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'relative flex h-14 w-17 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                active
                                    ? 'bg-brand text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)]'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <item.icon aria-hidden="true" className="size-6" />
                            {dot > 0 && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute top-2.5 right-4 size-2.5 rounded-full shadow-[0_0_0_2px_#1c1c1c]',
                                        active ? 'bg-[#0a0a0a]' : 'bg-brand',
                                    )}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
