import { Head, Link, usePage } from '@inertiajs/react';
import { PencilLine, Settings } from 'lucide-react';
import ClientProfileList from '@/components/client/profile/profile-list';
import { Initials } from '@/components/trainer/ui/bits';
import {
    brandButtonClassName,
    pageTitleClassName,
    panelClassName,
    softButtonClassName,
} from '@/components/trainer/ui/styles';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { settings } from '@/routes/account';
import { bookings, favorites } from '@/routes/client';
import { edit as editProfile } from '@/routes/client/profile';

type ProfileProps = {
    upcomingCount: number;
    activePackages: number;
};

/**
 * "Profilo" of the client. Phones: the list like the iOS settings. Desktop,
 * like the trainer's "Profilo": the compact list in a column on the left and,
 * on the right, the client at a glance with the numbers of their activity.
 */
export default function Profile({
    upcomingCount,
    activePackages,
}: ProfileProps) {
    const isMobile = useIsMobile();
    const counts = { upcomingCount, activePackages };

    return (
        <>
            <Head title="Profilo" />
            {isMobile ? (
                <>
                    <h1 className="text-[34px] leading-10.25 font-bold tracking-[0.4px]">
                        Profilo
                    </h1>
                    <ClientProfileList size="lg" {...counts} />
                </>
            ) : (
                // Like the trainer's: the column next to the side menu, full height.
                <div className="flex h-full min-h-0 gap-6">
                    <section
                        aria-label="Sezioni del profilo"
                        className={cn(
                            panelClassName,
                            'h-full w-80 shrink-0 [scrollbar-width:none] overflow-y-auto px-3 py-4',
                        )}
                    >
                        <h1 className="mx-2.5 mt-1 mb-4.5 text-[28px] leading-8.5 font-bold tracking-[0.38px]">
                            Profilo
                        </h1>
                        <ClientProfileList size="sm" {...counts} />
                    </section>
                    <Overview {...counts} />
                </div>
            )}
        </>
    );
}

/** Desktop: the client at a glance, the way to edit, the numbers. */
function Overview({ upcomingCount, activePackages }: ProfileProps) {
    const { auth } = usePage().props;
    const tiles = [
        {
            label: 'Prenotazioni in programma',
            value: upcomingCount,
            href: bookings.url(),
        },
        {
            label: 'Pacchetti attivi',
            value: activePackages,
            href: `${bookings.url()}#pacchetti`,
        },
        {
            label: 'Preferiti',
            value: auth.favoritesCount ?? 0,
            href: favorites.url(),
        },
    ];

    return (
        <div className="flex max-w-240 min-w-0 flex-1 [scrollbar-width:none] flex-col gap-6 overflow-y-auto pt-6 pr-4 pb-6">
            <div className="flex flex-col gap-1.5">
                <h2 className={pageTitleClassName}>Il tuo profilo</h2>
                <p className="text-[15px] text-muted-foreground">
                    Le tue prenotazioni, i pacchetti e i trainer che hai
                    salvato.
                </p>
            </div>

            <section className={cn(panelClassName, 'flex flex-col gap-5 p-6')}>
                <div className="flex flex-wrap items-center gap-5">
                    <Initials
                        name={auth.user.name}
                        src={auth.user.avatar}
                        size={96}
                        className="shadow-[0_0_0_3px_#0a0a0a,0_0_0_5px_#42d7d9]"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-[22px] leading-7 font-bold">
                            {auth.user.name}
                        </span>
                        <span className="truncate text-[15px] text-muted-foreground">
                            {auth.user.email}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href={editProfile()} className={brandButtonClassName}>
                        <PencilLine aria-hidden="true" className="size-4.5" />
                        Modifica profilo
                    </Link>
                    <Link
                        href={settings()}
                        className={cn(softButtonClassName, 'h-11')}
                    >
                        <Settings aria-hidden="true" className="size-4.5" />
                        Impostazioni account
                    </Link>
                </div>
            </section>

            <div className="grid grid-cols-3 gap-2.5">
                {tiles.map((tile) => (
                    <Link
                        key={tile.label}
                        href={tile.href}
                        className="flex flex-col gap-1.5 rounded-[22px] bg-card p-4.5 outline-none hover:bg-[#232323] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <span className="text-[13px] text-muted-foreground">
                            {tile.label}
                        </span>
                        <span className="text-[28px] leading-8 font-bold tabular-nums">
                            {tile.value}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

Profile.layout = { section: 'profile', fill: true };
