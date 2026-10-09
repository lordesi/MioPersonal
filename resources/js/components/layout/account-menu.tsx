import { Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronDown,
    CircleHelp,
    Dumbbell,
    Eye,
    Heart,
    LayoutDashboard,
    LogOut,
    Settings,
    User,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ComponentType } from 'react';
import UserAvatar from '@/components/shared/user-avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { settings } from '@/routes/account';
import { bookings, completeProfile, favorites } from '@/routes/client';
import { show as contactPage } from '@/routes/contact';
import {
    availability,
    register as trainerRegister,
    settings as trainerSettings,
    today,
} from '@/routes/trainer';

export type AccountMenuVariant = 'client' | 'trainer';

type MenuItem = {
    title: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    /** Second line under the title, e.g. "Crea il tuo profilo, è gratis". */
    hint?: string;
    badge?: number;
};

type AccountMenuProps = {
    variant: AccountMenuVariant;
    userName: string;
    /** Number on "Preferiti" (client), hidden when 0. */
    favoritesCount?: number;
    /** "Il mio profilo pubblico" (trainer), hidden when missing. */
    publicProfileHref?: string;
    /** The mobile menu opens right under the header: pass its height. */
    headerHeight?: 15 | 16;
};

/** Groups of links, split by separators; «Esci» is added after the last one. */
function menuGroups({
    variant,
    favoritesCount,
    publicProfileHref,
}: AccountMenuProps): MenuItem[][] {
    const help: MenuItem = {
        title: 'Centro assistenza',
        href: contactPage.url(),
        icon: CircleHelp,
    };

    if (variant === 'trainer') {
        return [
            [
                {
                    title: 'La mia area',
                    href: today.url(),
                    icon: LayoutDashboard,
                },
                ...(publicProfileHref
                    ? [
                          {
                              title: 'Il mio profilo pubblico',
                              href: publicProfileHref,
                              icon: Eye,
                          },
                      ]
                    : []),
                // The design opens "Disponibilità" until a profile editor exists.
                {
                    title: 'Modifica profilo',
                    href: availability.url(),
                    icon: User,
                },
                {
                    title: 'Impostazioni account',
                    href: trainerSettings.url(),
                    icon: Settings,
                },
            ],
            [help],
        ];
    }

    return [
        [
            {
                title: 'Le mie prenotazioni',
                href: bookings.url(),
                icon: Calendar,
            },
            {
                title: 'Preferiti',
                href: favorites.url(),
                icon: Heart,
                badge: favoritesCount,
            },
            { title: 'Profilo', href: completeProfile.url(), icon: User },
            {
                title: 'Impostazioni account',
                href: settings.url(),
                icon: Settings,
            },
        ],
        [
            help,
            {
                title: 'Diventa un trainer',
                href: trainerRegister.url(),
                icon: Dumbbell,
                hint: 'Crea il tuo profilo, è gratis',
            },
        ],
    ];
}

const sheetTop = { 15: 'top-15', 16: 'top-16' } as const;

/** The avatar turns dark while its menu is open. */
const avatarOpen =
    '[&_[data-slot=avatar-fallback]]:bg-primary [&_[data-slot=avatar-fallback]]:text-primary-foreground';

/**
 * Menu opened from the avatar in the top right corner.
 * Desktop: dropdown under the avatar. Mobile: panel sliding from the top.
 */
export default function AccountMenu(props: AccountMenuProps) {
    const { variant, userName, headerHeight = 15 } = props;
    const { auth } = usePage().props;
    const email = auth?.user?.email ?? '';
    const groups = menuGroups(props);
    const roleLabel = variant === 'trainer' ? 'Trainer' : 'Cliente';
    const label = `Menu account di ${userName}`;

    const [desktopOpen, setDesktopOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const header = (
        <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-2.5">
            <UserAvatar name={userName} size="md" />
            <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{userName}</span>
                {email && (
                    <span className="truncate text-xs text-muted-foreground">
                        {email}
                    </span>
                )}
            </span>
            <span className="ml-auto inline-flex h-5 items-center rounded-full border px-1.75 text-[11px] font-semibold">
                {roleLabel}
            </span>
        </div>
    );

    const itemContent = (item: MenuItem) => (
        <>
            <item.icon aria-hidden="true" className="size-4" />
            {item.hint ? (
                <span className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs leading-4 font-normal text-muted-foreground">
                        {item.hint}
                    </span>
                </span>
            ) : (
                <span>{item.title}</span>
            )}
            {item.badge ? (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums">
                    {item.badge}
                </span>
            ) : null}
        </>
    );

    const logoutContent = (
        <>
            <LogOut aria-hidden="true" className="size-4" />
            <span>Esci</span>
        </>
    );

    return (
        <>
            {/* Desktop (md and up). */}
            <DropdownMenu open={desktopOpen} onOpenChange={setDesktopOpen}>
                <DropdownMenuTrigger
                    aria-label={label}
                    className="hidden h-10 items-center gap-2 rounded-full border bg-background pr-1.5 pl-1 text-foreground md:flex"
                >
                    <UserAvatar
                        name={userName}
                        className={cn(desktopOpen && avatarOpen)}
                    />
                    <ChevronDown aria-hidden="true" className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-72 rounded-xl bg-card p-1.5 shadow-xl"
                >
                    <DropdownMenuLabel className="p-0 font-normal">
                        {header}
                    </DropdownMenuLabel>
                    {groups.map((group, index) => (
                        <Fragment key={group[0].title}>
                            <DropdownMenuSeparator
                                className={cn(
                                    '-mx-1.5',
                                    index === 0 ? 'mt-0 mb-1.5' : 'my-1.5',
                                )}
                            />
                            <DropdownMenuGroup>
                                {group.map((item) => (
                                    <DropdownMenuItem
                                        key={item.title}
                                        asChild
                                        className={cn(
                                            'min-h-10 cursor-pointer gap-2.5 rounded-lg px-2.5 text-sm font-medium [&_svg]:text-foreground!',
                                            item.hint && 'py-2',
                                        )}
                                    >
                                        <Link href={item.href}>
                                            {itemContent(item)}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </Fragment>
                    ))}
                    <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
                    <DropdownMenuItem
                        asChild
                        className="h-10 w-full cursor-pointer gap-2.5 rounded-lg px-2.5 text-sm font-medium [&_svg]:text-foreground!"
                    >
                        <Link
                            href={logout()}
                            as="button"
                            onClick={handleLogout}
                        >
                            {logoutContent}
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile: the header stays visible above the panel. */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                    aria-label={label}
                    className="flex size-11 items-center justify-center rounded-full md:hidden"
                >
                    <UserAvatar
                        name={userName}
                        className={cn(mobileOpen && avatarOpen)}
                    />
                </SheetTrigger>
                <SheetContent
                    side="top"
                    showCloseButton={false}
                    aria-describedby={undefined}
                    overlayClassName={cn(sheetTop[headerHeight], 'bg-black/35')}
                    className={cn(
                        sheetTop[headerHeight],
                        'gap-0 bg-card px-2.5 pt-1.5 pb-3 shadow-xl md:hidden',
                    )}
                >
                    <SheetTitle className="sr-only">{label}</SheetTitle>
                    {header}
                    <nav aria-label="Account" className="flex flex-col">
                        {groups.map((group, index) => (
                            <Fragment key={group[0].title}>
                                <div
                                    role="separator"
                                    className={cn(
                                        '-mx-1.5 h-px bg-border',
                                        index === 0 ? 'mb-1.5' : 'my-1.5',
                                    )}
                                />
                                {group.map((item) => (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            'flex min-h-13 items-center gap-2.5 rounded-lg px-2.5 text-[15px] leading-5 font-medium hover:bg-accent',
                                            item.hint && 'py-2',
                                        )}
                                    >
                                        {itemContent(item)}
                                    </Link>
                                ))}
                            </Fragment>
                        ))}
                        <div
                            role="separator"
                            className="-mx-1.5 my-1.5 h-px bg-border"
                        />
                        <Link
                            href={logout()}
                            as="button"
                            onClick={() => {
                                setMobileOpen(false);
                                handleLogout();
                            }}
                            className="flex h-13 w-full items-center gap-2.5 rounded-lg px-2.5 text-[15px] leading-5 font-medium hover:bg-accent"
                        >
                            {logoutContent}
                        </Link>
                    </nav>
                </SheetContent>
            </Sheet>
        </>
    );
}
