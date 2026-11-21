import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-logo';
import type { TrainerNavSection } from '@/components/layout/trainer-nav';
import {
    profileNavItem,
    trainerNavItems,
} from '@/components/layout/trainer-nav';
import { Initials } from '@/components/trainer/ui/bits';
import { glassClassName } from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import { today } from '@/routes/trainer';
import { hoverPrefetch } from '@/lib/prefetch';

type TrainerSidebarProps = {
    current: TrainerNavSection | null;
    /** Requests waiting: a dot on "Home". */
    pendingCount: number;
    /** Conversations not read: a dot on "Clienti". */
    unreadChats: number;
    publicProfileHref: string | null;
    userName: string;
    avatar?: string | null;
};

/**
 * The side menu of the trainer area on desktop (Vetro 1): a glass pill with
 * the icons of Home, Calendario and Clienti, and at the bottom the public
 * profile and the trainer's photo, which opens "Profilo".
 */
export default function TrainerSidebar({
    current,
    pendingCount,
    unreadChats,
    publicProfileHref,
    userName,
    avatar,
}: TrainerSidebarProps) {
    const profile = profileNavItem();
    const dots = { home: pendingCount, clients: unreadChats } as Partial<
        Record<TrainerNavSection, number>
    >;

    return (
        <aside
            className={cn(
                'sticky top-4 flex h-[calc(100dvh-2rem)] w-20 shrink-0 flex-col items-center gap-8 rounded-full pt-6 pb-3.5',
                glassClassName,
            )}
        >
            <Link
                prefetch={hoverPrefetch}
                href={today()}
                aria-label="MioPersonal, Home"
                className="flex rounded-full text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <BrandMark className="h-5.5 w-9" />
            </Link>

            <nav
                aria-label="Navigazione principale"
                className="flex flex-col items-center gap-3"
            >
                {trainerNavItems().map((item) => {
                    const active = item.section === current;
                    const dot = dots[item.section] ?? 0;

                    return (
                        <Link
                            prefetch={hoverPrefetch}
                            key={item.section}
                            href={item.href}
                            aria-label={
                                dot > 0
                                    ? `${item.title}, ${dotLabel(item.section, dot)}`
                                    : item.title
                            }
                            title={item.title}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'relative flex size-13 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                active
                                    ? 'bg-brand text-[#0a0a0a] shadow-[0_8px_24px_0_rgba(66,215,217,0.28)]'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                            )}
                        >
                            <item.icon
                                aria-hidden="true"
                                className="size-5.5"
                            />
                            {dot > 0 && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute top-2 right-2 size-2.5 rounded-full shadow-[0_0_0_2px_#1c1c1c]',
                                        active ? 'bg-[#0a0a0a]' : 'bg-brand',
                                    )}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-3">
                {publicProfileHref && (
                    <a
                        href={publicProfileHref}
                        aria-label="Vedi profilo pubblico"
                        title="Vedi profilo pubblico"
                        className="flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/6 text-brand transition-colors outline-none hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <Eye aria-hidden="true" className="size-5" />
                    </a>
                )}
                <Link
                    prefetch={hoverPrefetch}
                    href={profile.href}
                    aria-label={profile.title}
                    title={profile.title}
                    aria-current={current === 'profile' ? 'page' : undefined}
                    className={cn(
                        'flex size-13 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        current === 'profile'
                            ? 'shadow-[0_0_0_3px_#1c1c1c,0_0_0_5px_#42d7d9]'
                            : 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]',
                    )}
                >
                    <Initials name={userName} src={avatar} size={52} />
                </Link>
            </div>
        </aside>
    );
}

export function dotLabel(section: TrainerNavSection, count: number): string {
    if (section === 'home') {
        return count === 1
            ? '1 richiesta da confermare'
            : `${count} richieste da confermare`;
    }

    return count === 1
        ? '1 conversazione da leggere'
        : `${count} conversazioni da leggere`;
}
