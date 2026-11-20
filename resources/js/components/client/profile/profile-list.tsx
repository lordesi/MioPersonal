import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Bell,
    CalendarCheck,
    ChevronRight,
    Heart,
    LifeBuoy,
    Package,
    PencilLine,
    Settings,
    ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import DarkDialog from '@/components/mp/dark-dialog';
import { Initials } from '@/components/trainer/ui/bits';
import { listLabelClassName } from '@/components/trainer/ui/styles';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { settings } from '@/routes/account';
import { bookings, favorites } from '@/routes/client';
import { edit as editProfile } from '@/routes/client/profile';
import { show as contactPage } from '@/routes/contact';

type ProfileListProps = {
    /** Phones: big rows like the iOS settings; desktop: the compact column. */
    size: 'lg' | 'sm';
    upcomingCount: number;
    activePackages: number;
};

type Row = {
    title: string;
    icon: LucideIcon;
    href: string;
    /** On the right: "3", "1 attivo". */
    trailing?: string;
    /** Opens outside the client area. */
    external?: boolean;
};

/**
 * The list of the client's "Profilo": the card to edit the profile, then
 * ATTIVITÀ, ACCOUNT and SUPPORTO, and "Esci" with a confirmation. The same
 * list as the trainer's (profile-hub/profile-list.tsx): big on phones,
 * compact in the column on the left on desktop.
 */
export default function ClientProfileList({
    size,
    upcomingCount,
    activePackages,
}: ProfileListProps) {
    const { auth } = usePage().props;
    const [askLogout, setAskLogout] = useState(false);
    const cleanup = useMobileNavigation();
    const large = size === 'lg';
    const favoritesCount = auth.favoritesCount ?? 0;

    const groups: { label: string; rows: Row[] }[] = [
        {
            label: 'Attività',
            rows: [
                {
                    title: 'Le mie prenotazioni',
                    icon: CalendarCheck,
                    href: bookings.url(),
                    trailing:
                        upcomingCount > 0 ? String(upcomingCount) : undefined,
                },
                {
                    title: 'Pacchetti',
                    icon: Package,
                    href: `${bookings.url()}#pacchetti`,
                    trailing: packagesLabel(activePackages) ?? undefined,
                },
                {
                    title: 'Preferiti',
                    icon: Heart,
                    href: favorites.url(),
                    trailing:
                        favoritesCount > 0 ? String(favoritesCount) : undefined,
                },
            ],
        },
        {
            label: 'Account',
            rows: [
                {
                    title: 'Impostazioni account',
                    icon: Settings,
                    href: settings.url(),
                },
                {
                    title: 'Notifiche',
                    icon: Bell,
                    href: `${settings.url()}#notifiche`,
                },
                {
                    title: 'Privacy e sicurezza',
                    icon: ShieldCheck,
                    href: `${settings.url()}#accesso`,
                },
            ],
        },
        {
            label: 'Supporto',
            rows: [
                {
                    title: 'Centro assistenza',
                    icon: LifeBuoy,
                    href: contactPage.url(),
                    external: true,
                },
            ],
        },
    ];

    return (
        <div className={cn('flex flex-col', large ? 'gap-6' : 'gap-4.5')}>
            <Link
                href={editProfile()}
                className={cn(
                    'flex items-center text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    large
                        ? 'gap-4 rounded-[26px] bg-card p-4 hover:bg-[#232323] active:bg-[#262626]'
                        : 'gap-3.5 rounded-[18px] bg-card p-3 hover:bg-[#232323]',
                )}
            >
                <Initials
                    name={auth.user.name}
                    src={auth.user.avatar}
                    size={large ? 64 : 52}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                        className={cn(
                            'truncate font-bold',
                            large
                                ? 'text-[22px] leading-7 tracking-[-0.26px]'
                                : 'text-[17px] leading-5.5 font-semibold',
                        )}
                    >
                        {auth.user.name}
                    </span>
                    <span
                        className={cn(
                            'text-muted-foreground',
                            large
                                ? 'text-[15px] leading-5'
                                : 'text-[13px] leading-4.5',
                        )}
                    >
                        Modifica profilo, foto e obiettivi
                    </span>
                </span>
                {large ? (
                    <ChevronRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                    />
                ) : (
                    <PencilLine
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[#707070]"
                    />
                )}
            </Link>

            {groups.map((group) => (
                <section key={group.label} className="flex flex-col gap-2">
                    <h2
                        className={cn(
                            listLabelClassName,
                            large && 'px-4 text-[13px]',
                        )}
                    >
                        {group.label}
                    </h2>
                    <div
                        className={cn(
                            'flex flex-col overflow-hidden bg-card',
                            large
                                ? 'rounded-[26px]'
                                : 'gap-0.5 rounded-[18px] p-1',
                        )}
                    >
                        {group.rows.map((row, index) => (
                            <ProfileRow
                                key={row.title}
                                row={row}
                                large={large}
                                last={index === group.rows.length - 1}
                            />
                        ))}
                    </div>
                </section>
            ))}

            <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setAskLogout(true)}
                className={cn(
                    'bg-card text-destructive outline-none hover:bg-[#232323] focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    large
                        ? 'h-14 rounded-full text-[17px] font-semibold tracking-[-0.43px] active:bg-[#262626]'
                        : 'min-h-11 rounded-[18px] text-[15px]',
                )}
            >
                Esci
            </button>

            <DarkDialog
                open={askLogout}
                onOpenChange={setAskLogout}
                title="Vuoi uscire?"
                description="Potrai rientrare quando vuoi con la tua email."
            >
                <div className="flex flex-col gap-2.5 md:flex-row-reverse md:justify-start">
                    <Link
                        href={logout()}
                        as="button"
                        onClick={() => {
                            cleanup();
                            router.flushAll();
                        }}
                        className="flex h-12.5 w-full items-center justify-center rounded-full bg-destructive px-6 text-[17px] font-semibold text-[#0a0a0a] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:h-11 md:w-auto md:text-[15px]"
                    >
                        Esci
                    </Link>
                    <button
                        type="button"
                        onClick={() => setAskLogout(false)}
                        className="flex h-12.5 w-full items-center justify-center rounded-full px-6 text-[17px] font-semibold shadow-[inset_0_0_0_1px_var(--field)] outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 md:h-11 md:w-auto md:text-[15px]"
                    >
                        Annulla
                    </button>
                </div>
            </DarkDialog>
        </div>
    );
}

/** "1 attivo", "2 attivi"; null without packages. */
export function packagesLabel(count: number): string | null {
    if (count === 0) {
        return null;
    }

    return count === 1 ? '1 attivo' : `${count} attivi`;
}

function ProfileRow({
    row,
    large,
    last,
}: {
    row: Row;
    large: boolean;
    last: boolean;
}) {
    const Arrow = row.external ? ArrowUpRight : ChevronRight;
    const content = (
        <>
            <span
                className={cn(
                    'flex shrink-0 items-center justify-center bg-secondary text-foreground',
                    large ? 'size-9 rounded-[10px]' : 'size-7 rounded-lg',
                )}
            >
                <row.icon
                    aria-hidden="true"
                    className={large ? 'size-5' : 'size-4'}
                />
            </span>
            <span
                className={cn(
                    'flex min-w-0 flex-1 items-center gap-3 self-stretch',
                    large && 'min-h-15 pr-4',
                    large &&
                        !last &&
                        'shadow-[inset_0_-1px_0_0_var(--separator)]',
                )}
            >
                <span
                    className={cn(
                        'min-w-0 flex-1 truncate',
                        large
                            ? 'text-[17px] leading-5.5 tracking-[-0.43px]'
                            : 'text-[15px] leading-5',
                    )}
                >
                    {row.title}
                </span>
                {row.trailing && (
                    <span
                        className={cn(
                            'whitespace-nowrap text-muted-foreground tabular-nums',
                            large ? 'text-[17px]' : 'text-[15px]',
                        )}
                    >
                        {row.trailing}
                    </span>
                )}
                <Arrow
                    aria-hidden="true"
                    className="size-4.5 shrink-0 text-muted-foreground"
                />
            </span>
        </>
    );
    const className = cn(
        'flex items-center gap-3 text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
        large
            ? 'pl-4 hover:bg-white/3 active:bg-[#262626]'
            : 'min-h-11 rounded-xl px-2.5 hover:bg-white/5',
    );

    return row.external ? (
        <a href={row.href} className={className}>
            {content}
        </a>
    ) : (
        <Link href={row.href} className={className}>
            {content}
        </Link>
    );
}
