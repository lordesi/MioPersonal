import { Link, router } from '@inertiajs/react';
import { ChevronRight, Eye, LogOut, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccountMenuVariant } from '@/components/layout/account-menu';
import AccountMenu from '@/components/layout/account-menu';
import { BrandMark } from '@/components/layout/brand-logo';
import type { TabItem } from '@/components/layout/mobile-tab-bar';
import MobileTabBar, {
    TabBadge,
    tabClassName,
} from '@/components/layout/mobile-tab-bar';
import NotificationBell from '@/components/layout/notification-bell';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';

/**
 * The navigation of the reserved areas (client, trainer, gym), drawn from one
 * list: the black side menu from md up, the tabs at the bottom below md, and
 * the "Altro" sheet with everything the tabs leave out. A page is never only
 * on one device.
 */

export type AreaNavItem = TabItem & {
    /** The section a page sets with `Page.layout = { section }`. */
    section: string;
};

export type AreaNavGroup = {
    /** "OFFERTA", "PROFILO"…; the first group usually has none. */
    label?: string;
    items: AreaNavItem[];
};

/** A plain link of the "Altro" sheet, e.g. "Impostazioni account". */
export type SheetLink = {
    title: string;
    href: string;
    icon: LucideIcon;
    hint?: string;
};

/** Marks the current section, the same in the sidebar, the tabs and the sheet. */
export function withActive(
    groups: AreaNavGroup[],
    current?: string,
): AreaNavGroup[] {
    return groups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
            ...item,
            isActive: item.section === current,
        })),
    }));
}

const sidebarLink = (active: boolean) =>
    cn(
        'flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm',
        active
            ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground'
            : 'font-medium text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
    );

type AreaSidebarProps = {
    groups: AreaNavGroup[];
    /** Accessible name of the menu, e.g. "Area trainer". */
    label: string;
    /** "AREA TRAINER" under the logo; none for the client. */
    areaLabel?: string;
    /** Where the logo goes. */
    homeHref: string;
    variant: AccountMenuVariant;
    userName: string;
    /** "Vedi profilo pubblico" (trainer and gym). */
    publicProfileHref?: string;
};

/** Black side menu of the reserved areas, visible from md up. */
export function AreaSidebar({
    groups,
    label,
    areaLabel,
    homeHref,
    variant,
    userName,
    publicProfileHref,
}: AreaSidebarProps) {
    return (
        <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col gap-6 overflow-y-auto bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
            <div className="flex items-start justify-between gap-2 px-2">
                <div className="flex flex-col gap-2.5">
                    <Link
                        href={homeHref}
                        aria-label={`MioPersonal, ${areaLabel?.toLowerCase() ?? 'vai alla home'}`}
                        className="flex items-center gap-2.5 text-sidebar-primary"
                    >
                        <BrandMark />
                        <span className="text-lg leading-7 font-semibold tracking-tight">
                            MioPersonal
                        </span>
                    </Link>
                    {areaLabel && (
                        <span className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground">
                            {areaLabel}
                        </span>
                    )}
                </div>
                <NotificationBell tone="dark" className="-mt-2 -mr-2" />
            </div>

            <nav aria-label={label} className="flex flex-col gap-5">
                {groups.map((group, index) => (
                    <div
                        key={group.label ?? index}
                        className="flex flex-col gap-0.5"
                    >
                        {group.label && (
                            <span className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-sidebar-muted-foreground/80">
                                {group.label}
                            </span>
                        )}
                        {group.items.map((item) => (
                            <Link
                                key={item.section}
                                href={item.href}
                                aria-current={
                                    item.isActive ? 'page' : undefined
                                }
                                className={sidebarLink(Boolean(item.isActive))}
                            >
                                {item.icon && (
                                    <item.icon
                                        aria-hidden="true"
                                        className="size-4.5"
                                    />
                                )}
                                <span className="flex-1">{item.title}</span>
                                {item.badge ? (
                                    <span
                                        className={cn(
                                            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                                            item.isActive
                                                ? 'bg-sidebar-primary-foreground text-sidebar-primary'
                                                : 'bg-sidebar-primary text-sidebar-primary-foreground',
                                        )}
                                    >
                                        <span className="sr-only">
                                            da vedere:{' '}
                                        </span>
                                        {item.badge}
                                    </span>
                                ) : null}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
                {publicProfileHref && (
                    <Link
                        href={publicProfileHref}
                        className="flex min-h-11 items-center gap-2.5 rounded-[10px] border border-sidebar-border px-3 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                        <Eye aria-hidden="true" className="size-4.5" />
                        Vedi profilo pubblico
                    </Link>
                )}
                <AccountMenu
                    variant={variant}
                    placement="sidebar"
                    userName={userName}
                />
            </div>
        </aside>
    );
}

type AreaTabBarProps = {
    /** Every group: the tabs are taken from here, the rest goes in the sheet. */
    groups: AreaNavGroup[];
    /** The sections with a tab of their own, in order. */
    tabs: string[];
    label: string;
    /** The last tab, opening the sheet: "Altro", or "Profilo" for the client. */
    more: {
        title: string;
        icon?: LucideIcon;
        /** Links after the groups, e.g. settings and help. */
        links: SheetLink[];
        /** Sections that light up this tab, besides the ones in the sheet. */
        sections?: string[];
        /** Optional block on top of the sheet, e.g. the name of the user. */
        header?: ReactNode;
    };
    /** The section of the page. */
    current?: string;
};

/** Bottom tabs of the reserved areas, with the "Altro" sheet; below md. */
export function AreaTabBar({
    groups,
    tabs,
    label,
    more,
    current,
}: AreaTabBarProps) {
    const items = groups.flatMap((group) => group.items);
    const tabItems = tabs
        .map((section) => items.find((item) => item.section === section))
        .filter((item): item is AreaNavItem => item !== undefined);
    const sheetGroups = groups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => !tabs.includes(item.section)),
        }))
        .filter((group) => group.items.length > 0);
    const sheetActive =
        sheetGroups.some((group) =>
            group.items.some((item) => item.isActive),
        ) ||
        (current !== undefined && (more.sections ?? []).includes(current));
    const sheetBadge = sheetGroups
        .flatMap((group) => group.items)
        .reduce((sum, item) => sum + (item.badge ?? 0), 0);

    return (
        <MobileTabBar
            items={tabItems}
            label={label}
            extra={
                <MoreSheet
                    title={more.title}
                    icon={more.icon ?? Menu}
                    active={sheetActive}
                    badge={sheetBadge}
                    groups={sheetGroups}
                    links={more.links}
                    header={more.header}
                />
            }
        />
    );
}

const sheetRow =
    'flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] leading-5 font-medium hover:bg-accent';

function MoreSheet({
    title,
    icon: Icon,
    active,
    badge,
    groups,
    links,
    header,
}: {
    title: string;
    icon: LucideIcon;
    active: boolean;
    badge: number;
    groups: AreaNavGroup[];
    links: SheetLink[];
    header?: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const cleanup = useMobileNavigation();
    const close = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                className={tabClassName(active || open)}
                aria-current={active ? 'page' : undefined}
            >
                <Icon aria-hidden="true" className="size-5.5" />
                {title}
                <TabBadge count={badge} />
            </SheetTrigger>
            <SheetContent
                side="bottom"
                aria-describedby={undefined}
                className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-3xl px-2 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
            >
                <span
                    aria-hidden="true"
                    className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30"
                />
                <SheetTitle className="px-3 pb-1 text-base">{title}</SheetTitle>
                {header}
                <nav aria-label={title} className="flex flex-col">
                    {groups.map((group, index) => (
                        <Fragment key={group.label ?? index}>
                            {group.label && (
                                <span className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                                    {group.label}
                                </span>
                            )}
                            {group.items.map((item) => (
                                <Link
                                    key={item.section}
                                    href={item.href}
                                    onClick={close}
                                    aria-current={
                                        item.isActive ? 'page' : undefined
                                    }
                                    className={cn(
                                        sheetRow,
                                        item.isActive &&
                                            'bg-accent font-semibold',
                                    )}
                                >
                                    {item.icon && (
                                        <item.icon
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    )}
                                    <span className="flex-1">{item.title}</span>
                                    {item.badge ? (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
                                            {item.badge}
                                        </span>
                                    ) : (
                                        <ChevronRight
                                            aria-hidden="true"
                                            className="size-4 text-muted-foreground"
                                        />
                                    )}
                                </Link>
                            ))}
                        </Fragment>
                    ))}
                    <div
                        role="separator"
                        className="mx-1 my-2 h-px bg-border"
                    />
                    {links.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            onClick={close}
                            className={cn(sheetRow, link.hint && 'py-2')}
                        >
                            <link.icon aria-hidden="true" className="size-5" />
                            <span className="flex flex-1 flex-col">
                                <span>{link.title}</span>
                                {link.hint && (
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {link.hint}
                                    </span>
                                )}
                            </span>
                        </Link>
                    ))}
                    <Link
                        href={logout()}
                        as="button"
                        onClick={() => {
                            close();
                            cleanup();
                            router.flushAll();
                        }}
                        className={cn(sheetRow, 'w-full text-left')}
                    >
                        <LogOut aria-hidden="true" className="size-5" />
                        Esci
                    </Link>
                </nav>
            </SheetContent>
        </Sheet>
    );
}
