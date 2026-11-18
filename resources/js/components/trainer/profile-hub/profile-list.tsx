import { Link, router, usePage } from '@inertiajs/react';
import { ArrowUpRight, ChevronRight, PencilLine } from 'lucide-react';
import { useState } from 'react';
import type {
    ProfileLink,
    TrainerSection,
} from '@/components/layout/trainer-nav';
import {
    editProfileHref,
    profileGroups,
} from '@/components/layout/trainer-nav';
import DarkDialog from '@/components/mp/dark-dialog';
import { Initials } from '@/components/trainer/ui/bits';
import { listLabelClassName } from '@/components/trainer/ui/styles';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import type { TrainerAreaData } from '@/types';

type ProfileListProps = {
    /** The page open on the right (desktop): its row is marked. */
    current?: TrainerSection;
    /** Phones: big rows like the iOS settings; desktop: the compact column. */
    size: 'lg' | 'sm';
    /** Between the card and the groups, e.g. the switch "Accetto nuovi clienti". */
    children?: React.ReactNode;
    /** The numbers on the right of some rows: "4", "4,8 ★". */
    trailing?: Partial<Record<TrainerSection, string>>;
};

/**
 * The list of "Profilo": the card with the photo (Modifica profilo), then
 * ATTIVITÀ, VETRINA, ACCOUNT and SUPPORTO, and "Esci" with a confirmation.
 * On desktop it stays on the left of every page of the profile.
 */
export default function ProfileList({
    current,
    size,
    children,
    trailing = {},
}: ProfileListProps) {
    const { auth, trainerArea } = usePage<{ trainerArea?: TrainerAreaData }>()
        .props;
    const [askLogout, setAskLogout] = useState(false);
    const cleanup = useMobileNavigation();
    const large = size === 'lg';
    const groups = profileGroups(trainerArea?.publicProfileHref ?? null);
    const editActive = current === 'profile';

    return (
        <div className={cn('flex flex-col', large ? 'gap-5.5' : 'gap-4.5')}>
            <Link
                href={editProfileHref()}
                aria-current={editActive ? 'page' : undefined}
                className={cn(
                    'flex items-center gap-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    large
                        ? 'rounded-[26px] bg-card py-3.5 pr-3.5 pl-4 active:bg-[#262626]'
                        : 'rounded-[18px] p-3',
                    !large &&
                        (editActive
                            ? 'bg-brand-soft'
                            : 'bg-card hover:bg-[#232323]'),
                )}
            >
                <Initials
                    name={auth?.user?.name ?? ''}
                    src={auth?.user?.avatar}
                    size={large ? 60 : 52}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                        className={cn(
                            'truncate font-semibold',
                            large
                                ? 'text-xl leading-6'
                                : 'text-[17px] leading-5.5',
                        )}
                    >
                        {auth?.user?.name}
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        Modifica profilo, foto e presentazione
                    </span>
                </span>
                {large ? (
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4.5 text-[#707070]"
                    />
                ) : (
                    <PencilLine
                        aria-hidden="true"
                        className="size-4 text-[#707070]"
                    />
                )}
            </Link>

            {children}

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
                        {group.links.map((link, index) => (
                            <Row
                                key={link.title}
                                link={link}
                                large={large}
                                last={index === group.links.length - 1}
                                active={
                                    link.section !== undefined &&
                                    link.section === current
                                }
                                trailing={
                                    link.section
                                        ? trailing[link.section]
                                        : undefined
                                }
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
                    'bg-card font-normal text-destructive outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    large
                        ? 'min-h-13 rounded-[26px] text-[17px] active:bg-[#262626]'
                        : 'min-h-11 rounded-[18px] text-[15px] hover:bg-[#232323]',
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

function Row({
    link,
    large,
    last,
    active,
    trailing,
}: {
    link: ProfileLink;
    large: boolean;
    last: boolean;
    active: boolean;
    trailing?: string;
}) {
    const content = (
        <>
            <span
                className={cn(
                    'flex shrink-0 items-center justify-center',
                    large ? 'size-8 rounded-[9px]' : 'size-7 rounded-lg',
                    active
                        ? 'bg-brand-soft text-brand'
                        : 'bg-secondary text-foreground',
                )}
            >
                <link.icon
                    aria-hidden="true"
                    className={large ? 'size-4.5' : 'size-4'}
                />
            </span>
            <span
                className={cn(
                    'flex min-w-0 flex-1 items-center gap-2.5 self-stretch',
                    large && 'pr-3.5',
                    large &&
                        !last &&
                        'shadow-[inset_0_-0.5px_0_0_rgba(255,255,255,0.17)]',
                )}
            >
                <span
                    className={cn(
                        'flex min-w-0 flex-1 flex-col gap-px',
                        large && 'py-2.5',
                    )}
                >
                    <span
                        className={cn(
                            'truncate',
                            large
                                ? 'text-[17px] leading-5.5'
                                : 'text-[15px] leading-5',
                        )}
                    >
                        {link.title}
                    </span>
                    {large && link.hint && (
                        <span className="text-[13px] leading-4.5 text-muted-foreground">
                            {link.hint}
                        </span>
                    )}
                </span>
                {trailing && (
                    <span
                        className={cn(
                            'whitespace-nowrap text-muted-foreground tabular-nums',
                            large ? 'text-[17px]' : 'text-[15px]',
                        )}
                    >
                        {trailing}
                    </span>
                )}
                {link.external ? (
                    <ArrowUpRight
                        aria-hidden="true"
                        className="size-4.5 shrink-0 text-[#707070]"
                    />
                ) : (
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4.5 shrink-0 text-[#707070]"
                    />
                )}
            </span>
        </>
    );

    const className = cn(
        'flex w-full items-center gap-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
        large
            ? 'min-h-13 pl-4 active:bg-[#262626]'
            : 'min-h-11 rounded-xl px-2.5',
        !large && (active ? 'bg-brand-soft' : 'hover:bg-white/5'),
    );

    if (link.external) {
        return (
            <a href={link.href} className={className}>
                {content}
            </a>
        );
    }

    return (
        <Link
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={className}
        >
            {content}
        </Link>
    );
}
