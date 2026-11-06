import { Link, router, usePage } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    ChevronDown,
    ChevronsUpDown,
    CircleHelp,
    Dumbbell,
    Eye,
    Heart,
    LayoutDashboard,
    LogOut,
    Settings,
    Share2,
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
import { gymSearchUrl } from '@/lib/gym';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { settings } from '@/routes/account';
import { favorites, home as clientHome } from '@/routes/client';
import { show as contactPage } from '@/routes/contact';
import {
    dashboard as gymDashboard,
    settings as gymSettings,
} from '@/routes/gym';
import { edit as editGymProfile } from '@/routes/gym/profile';
import {
    gyms as trainerGyms,
    register as trainerRegister,
    settings as trainerSettings,
    share as trainerShare,
    today,
} from '@/routes/trainer';
import { edit as editTrainerProfile } from '@/routes/trainer/profile';

export type AccountMenuVariant = 'client' | 'trainer' | 'gym';

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
    /** Number on "Preferiti" (client), hidden when 0. By default the one shared by the server. */
    favoritesCount?: number;
    /** "Vedi profilo pubblico" (trainer), hidden when missing. */
    publicProfileHref?: string;
    /** The mobile menu opens right under the header: pass its height. */
    headerHeight?: 15 | 16;
    /**
     * 'sidebar': the button at the bottom of the black side menu (trainer and client areas)
     * (desktop only), with the name; the menu opens above it.
     */
    placement?: 'header' | 'sidebar';
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

    if (variant === 'gym') {
        return [
            [
                {
                    title: 'La mia area',
                    href: gymDashboard.url(),
                    icon: LayoutDashboard,
                },
                ...(publicProfileHref
                    ? [
                          {
                              title: 'Vedi profilo pubblico',
                              href: publicProfileHref,
                              icon: Eye,
                          },
                      ]
                    : []),
                {
                    title: 'Modifica profilo',
                    href: editGymProfile.url(),
                    icon: User,
                },
                {
                    title: 'Impostazioni account',
                    href: gymSettings.url(),
                    icon: Settings,
                },
            ],
            [help],
        ];
    }

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
                              title: 'Vedi profilo pubblico',
                              href: publicProfileHref,
                              icon: Eye,
                          },
                      ]
                    : []),
                {
                    title: 'Condividi profilo',
                    href: trainerShare.url(),
                    icon: Share2,
                },
                {
                    title: 'Palestre',
                    href: trainerGyms.url(),
                    icon: Building2,
                },
                {
                    title: 'Modifica profilo',
                    href: editTrainerProfile.url(),
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
                href: clientHome.url(),
                icon: Calendar,
            },
            {
                title: 'Preferiti',
                href: favorites.url(),
                icon: Heart,
                badge: favoritesCount,
            },
            {
                title: 'Cerca palestre',
                href: gymSearchUrl(),
                icon: Building2,
            },
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

/** The dark background starts right under the header, the card 8px lower. */
const sheetTop = {
    15: { overlay: 'top-15', card: 'top-17' },
    16: { overlay: 'top-16', card: 'top-18' },
} as const;

/**
 * The mobile menu appears and goes away at once, without sliding or fading.
 * With "!": the sheet's "animate-out" would otherwise win when closing.
 */
const noAnimation =
    'data-[state=open]:animate-none! data-[state=closed]:animate-none!';

/** The avatar turns dark while its menu is open. */
const avatarOpen =
    '[&_[data-slot=avatar-fallback]]:bg-primary [&_[data-slot=avatar-fallback]]:text-primary-foreground';

/**
 * Menu opened from the avatar in the top right corner.
 * Desktop: dropdown under the avatar. Mobile: rounded card under the header.
 */
export default function AccountMenu(props: AccountMenuProps) {
    const {
        variant,
        userName,
        headerHeight = 15,
        placement = 'header',
    } = props;
    const { auth } = usePage().props;
    const email = auth?.user?.email ?? '';
    // The photo of "Completa il tuo profilo"; without it, the initials.
    const avatar = auth?.user?.avatar;
    const groups = menuGroups({
        ...props,
        favoritesCount:
            props.favoritesCount ?? auth?.favoritesCount ?? undefined,
    });
    const roleLabel = {
        trainer: 'Trainer',
        gym: 'Palestra',
        client: 'Cliente',
    }[variant];
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
            <UserAvatar name={userName} src={avatar} size="md" />
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

    const menuContent = (
        <DropdownMenuContent
            align={placement === 'sidebar' ? 'start' : 'end'}
            side={placement === 'sidebar' ? 'top' : 'bottom'}
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
                <Link href={logout()} as="button" onClick={handleLogout}>
                    {logoutContent}
                </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
    );

    if (placement === 'sidebar') {
        return (
            <DropdownMenu open={desktopOpen} onOpenChange={setDesktopOpen}>
                <DropdownMenuTrigger
                    aria-label={label}
                    className="flex w-full items-center gap-3 rounded-xl bg-sidebar-accent p-2.5 text-left text-sidebar-foreground"
                >
                    <UserAvatar
                        name={userName}
                        src={avatar}
                        size="md"
                        className="[&_[data-slot=avatar-fallback]]:bg-sidebar-primary [&_[data-slot=avatar-fallback]]:text-sidebar-primary-foreground"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold">
                            {userName}
                        </span>
                        <span className="text-xs text-sidebar-muted-foreground">
                            {
                                {
                                    trainer: 'Personal trainer',
                                    gym: 'Palestra',
                                    client: 'Il mio account',
                                }[variant]
                            }
                        </span>
                    </span>
                    <ChevronsUpDown aria-hidden="true" className="size-4" />
                </DropdownMenuTrigger>
                {menuContent}
            </DropdownMenu>
        );
    }

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
                        src={avatar}
                        className={cn(desktopOpen && avatarOpen)}
                    />
                    <ChevronDown aria-hidden="true" className="size-3.5" />
                </DropdownMenuTrigger>
                {menuContent}
            </DropdownMenu>

            {/* Mobile: the header stays visible above the panel. */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                    aria-label={label}
                    // text-foreground: on the dark public header the initials would be white on white.
                    className="flex size-11 items-center justify-center rounded-full text-foreground md:hidden"
                >
                    <UserAvatar
                        name={userName}
                        src={avatar}
                        className={cn(mobileOpen && avatarOpen)}
                    />
                </SheetTrigger>
                <SheetContent
                    side="top"
                    showCloseButton={false}
                    aria-describedby={undefined}
                    overlayClassName={cn(
                        sheetTop[headerHeight].overlay,
                        'bg-black/35',
                        noAnimation,
                    )}
                    // A card floating under the header, 12px from the edges.
                    className={cn(
                        sheetTop[headerHeight].card,
                        'inset-x-3 max-h-[calc(100dvh-6rem)] gap-0 overflow-y-auto rounded-3xl border bg-card p-2 shadow-xl md:hidden',
                        noAnimation,
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
                                        '-mx-2 h-px bg-border',
                                        index === 0 ? 'mb-1.5' : 'my-1.5',
                                    )}
                                />
                                {group.map((item) => (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            'flex min-h-13 items-center gap-2.5 rounded-xl px-2.5 text-[15px] leading-5 font-medium hover:bg-accent',
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
                            className="-mx-2 my-1.5 h-px bg-border"
                        />
                        <Link
                            href={logout()}
                            as="button"
                            onClick={() => {
                                setMobileOpen(false);
                                handleLogout();
                            }}
                            className="flex h-13 w-full items-center gap-2.5 rounded-xl px-2.5 text-[15px] leading-5 font-medium hover:bg-accent"
                        >
                            {logoutContent}
                        </Link>
                    </nav>
                </SheetContent>
            </Sheet>
        </>
    );
}
