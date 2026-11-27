import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    CircleHelp,
    Download,
    ExternalLink,
    LayoutDashboard,
    LogOut,
    MessageSquareWarning,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Fragment } from 'react';
import { Initials } from '@/components/trainer/ui/bits';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { openProblemReport } from '@/lib/problem-report';
import { openAppPrompt, useInstallMethod } from '@/lib/pwa';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { settings } from '@/routes/account';
import { home as clientHome, profile as clientProfile } from '@/routes/client';
import { show as contactPage } from '@/routes/contact';
import {
    dashboard as gymDashboard,
    settings as gymSettings,
} from '@/routes/gym';
import { edit as editGymProfile } from '@/routes/gym/profile';
import {
    profile as trainerProfile,
    settings as trainerSettings,
    today,
} from '@/routes/trainer';

export type AccountCapsuleVariant = 'client' | 'trainer' | 'gym';

type MenuItem = {
    title: string;
    icon: LucideIcon;
    /** A page; without it, `action` runs ("Installa l'app"). */
    href?: string;
    action?: () => void;
    /** Opens a page outside the site's areas: a plain link. */
    external?: boolean;
};

type AccountCapsuleMenuProps = {
    variant: AccountCapsuleVariant;
    /** The photo without the turquoise ring (the home). */
    plain?: boolean;
};

/**
 * Groups of links split by separators; "Esci" comes after the last one.
 * The same for each role: the area, the profile (and the public page of a
 * trainer or a gym), then the notifications, the app and the help.
 */
function menuGroups(
    variant: AccountCapsuleVariant,
    canInstall: boolean,
    publicProfileHref: string | null,
): MenuItem[][] {
    const area = {
        client: clientHome.url(),
        trainer: today.url(),
        gym: gymDashboard.url(),
    }[variant];
    const profile = {
        client: clientProfile.url(),
        trainer: trainerProfile.url(),
        gym: editGymProfile.url(),
    }[variant];
    const settingsUrl = {
        client: settings.url(),
        trainer: trainerSettings.url(),
        gym: gymSettings.url(),
    }[variant];

    const mine: MenuItem[] = [
        { title: 'La mia area', icon: LayoutDashboard, href: area },
        { title: 'Profilo', icon: User, href: profile },
    ];

    if (variant !== 'client' && publicProfileHref) {
        mine.push({
            title: 'Vedi profilo pubblico',
            icon: ExternalLink,
            href: publicProfileHref,
            external: true,
        });
    }

    const app: MenuItem[] = [
        { title: 'Notifiche', icon: Bell, href: `${settingsUrl}#notifiche` },
    ];

    if (canInstall) {
        app.push({
            title: 'Installa l’app',
            icon: Download,
            action: openAppPrompt,
        });
    }

    return [
        mine,
        app,
        [
            {
                title: 'Centro assistenza',
                icon: CircleHelp,
                href: contactPage.url(),
            },
            {
                title: 'Segnala un problema',
                icon: MessageSquareWarning,
                action: openProblemReport,
            },
        ],
    ];
}

/** The glass of the capsule and of the menu (design "Menu C"). */
const glass =
    'border border-white/10 bg-[#1c1c1cb8] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_16px_48px_-8px_rgba(0,0,0,0.75)] backdrop-blur-[24px] backdrop-saturate-[1.8]';

const itemClassName =
    'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-full px-3 py-2 text-left text-base leading-5.25 font-medium tracking-[-0.31px] text-foreground outline-none select-none data-[highlighted]:bg-white/8 aria-[current=page]:bg-brand aria-[current=page]:text-[#0a0a0a] aria-[current=page]:shadow-[0_8px_24px_0_rgba(66,215,217,0.28)]';

/**
 * The account menu of the public headers ("Menu C"): the avatar with the
 * turquoise ring opens the glass list of links (no name nor role on top).
 * The same on phones and desktop.
 */
export default function AccountCapsuleMenu({
    variant,
    plain = false,
}: AccountCapsuleMenuProps) {
    const page = usePage();
    const { auth } = page.props;
    const name = auth?.user?.name ?? '';
    const avatar = auth?.user?.avatar;
    const groups = menuGroups(
        variant,
        useInstallMethod() !== null,
        auth?.publicProfileHref ?? null,
    );
    const currentPath = page.url.split(/[?#]/)[0];
    const cleanup = useMobileNavigation();

    return (
        <DropdownMenuPrimitive.Root modal={false}>
            <DropdownMenuPrimitive.Trigger
                aria-label={`Menu account di ${name}`}
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent',
                    !plain &&
                        'shadow-[0_0_0_2px_#0a0a0a,0_0_0_4px_#42d7d9] data-[state=open]:shadow-[0_0_0_2px_#0a0a0a,0_0_0_4px_#7fe6e7]',
                )}
            >
                <Initials name={name} src={avatar} size={44} />
            </DropdownMenuPrimitive.Trigger>

            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                    align="end"
                    sideOffset={14}
                    collisionPadding={16}
                    className="theme-dark z-50 flex w-75 max-w-[calc(100vw-2rem)] flex-col gap-3 bg-transparent! font-sans text-foreground outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2"
                >
                    <div
                        className={cn(
                            'flex flex-col gap-0.5 rounded-[28px] p-2',
                            glass,
                        )}
                    >
                        {groups.map((group, index) => (
                            <Fragment key={index}>
                                {index > 0 && (
                                    <DropdownMenuPrimitive.Separator className="mx-3.5 my-1.5 h-px bg-white/10" />
                                )}
                                {group.map((item) => (
                                    <MenuEntry
                                        key={item.title}
                                        item={item}
                                        current={item.href === currentPath}
                                    />
                                ))}
                            </Fragment>
                        ))}
                        <DropdownMenuPrimitive.Separator className="mx-3.5 my-1.5 h-px bg-white/10" />
                        <DropdownMenuPrimitive.Item asChild>
                            <Link
                                href={logout()}
                                as="button"
                                onClick={() => {
                                    cleanup();
                                    router.flushAll();
                                }}
                                className={cn(
                                    itemClassName,
                                    'text-destructive',
                                )}
                            >
                                <LogOut aria-hidden="true" className="size-5" />
                                Esci
                            </Link>
                        </DropdownMenuPrimitive.Item>
                    </div>
                </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
    );
}

function MenuEntry({ item, current }: { item: MenuItem; current: boolean }) {
    const content = (
        <>
            <item.icon aria-hidden="true" className="size-5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
        </>
    );

    if (item.href === undefined) {
        return (
            <DropdownMenuPrimitive.Item
                onSelect={item.action}
                className={itemClassName}
            >
                {content}
            </DropdownMenuPrimitive.Item>
        );
    }

    return (
        <DropdownMenuPrimitive.Item asChild>
            {item.external ? (
                <a href={item.href} className={itemClassName}>
                    {content}
                </a>
            ) : (
                <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={itemClassName}
                >
                    {content}
                </Link>
            )}
        </DropdownMenuPrimitive.Item>
    );
}
