import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CircleAlert,
    Dumbbell,
    Heart,
    MessageCircle,
    Pencil,
    Settings,
    User,
} from 'lucide-react';
import { useState } from 'react';
import {
    AreaRow,
    AreaRowGroup,
    areaButtonClassName,
    areaTitleClassName,
} from '@/components/mp/area-bits';
import DarkDialog from '@/components/mp/dark-dialog';
import { Initials } from '@/components/trainer/ui/bits';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { settings } from '@/routes/account';
import { bookings, favorites } from '@/routes/client';
import { edit as editProfile } from '@/routes/client/profile';
import { show as contactPage } from '@/routes/contact';
import { privacy } from '@/routes/legal';

type ProfileProps = {
    city: string | null;
    upcomingCount: number;
    activePackages: number;
    sessionsDone: number;
    trainersCount: number;
};

/** "1 attivo", "2 attivi"; null without packages. */
export function packagesLabel(count: number): string | null {
    if (count === 0) {
        return null;
    }

    return count === 1 ? '1 attivo' : `${count} attivi`;
}

/**
 * "Profilo" of the client (design "Profilo cliente · nuovo"): the photo with
 * the pencil, the name and the city, three numbers, then LA MIA ATTIVITÀ,
 * ACCOUNT and AIUTO, and "Esci". Desktop: the person on the left, the lists
 * on the right.
 */
export default function Profile({
    city,
    upcomingCount,
    activePackages,
    sessionsDone,
    trainersCount,
}: ProfileProps) {
    const { auth } = usePage().props;
    const [askLogout, setAskLogout] = useState(false);
    const cleanup = useMobileNavigation();
    const favoritesCount = auth.favoritesCount ?? 0;

    const stats = [
        { value: sessionsDone, label: 'Sedute fatte' },
        { value: trainersCount, label: 'Trainer' },
        { value: favoritesCount, label: 'Preferiti' },
    ];

    return (
        <>
            <Head title="Profilo" />

            <h1 className={cn(areaTitleClassName, '-mb-1')}>Profilo</h1>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-16">
                <div className="flex flex-col gap-8 lg:gap-7">
                    <div className="flex items-center gap-4.5">
                        <span className="relative size-22 shrink-0">
                            <Initials
                                name={auth.user.name}
                                src={auth.user.avatar}
                                size={88}
                                className="bg-[#1c1e21] text-[29px] text-foreground"
                            />
                            <Link
                                href={editProfile()}
                                aria-label="Modifica profilo"
                                className="absolute -right-0.5 -bottom-0.5 flex size-8.5 items-center justify-center rounded-full bg-brand text-black shadow-[0_0_0_4px_#000] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Pencil aria-hidden="true" className="size-4" />
                            </Link>
                        </span>
                        <div className="flex min-w-0 flex-col gap-1">
                            <span className="truncate text-2xl leading-7.5 font-bold tracking-[-0.02em]">
                                {auth.user.name}
                            </span>
                            {city && (
                                <span className="text-[15px] leading-5 text-muted-foreground">
                                    {city}
                                </span>
                            )}
                        </div>
                    </div>

                    <ul aria-label="Le tue statistiche" className="flex gap-5">
                        {stats.map((stat) => (
                            <li
                                key={stat.label}
                                className="flex flex-1 flex-col gap-1.5"
                            >
                                <b className="text-[32px] leading-none font-bold tracking-[-0.02em] tabular-nums">
                                    {stat.value}
                                </b>
                                <span className="text-sm text-muted-foreground">
                                    {stat.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-8">
                    <AreaRowGroup title="La mia attività">
                        <AreaRow
                            title="Prenotazioni"
                            icon={CalendarDays}
                            href={bookings.url()}
                            value={
                                upcomingCount > 0 ? upcomingCount : undefined
                            }
                        />
                        <AreaRow
                            title="Pacchetti"
                            icon={Dumbbell}
                            href={`${bookings.url()}#pacchetti`}
                            value={packagesLabel(activePackages) ?? undefined}
                        />
                        <AreaRow
                            title="Preferiti"
                            icon={Heart}
                            href={favorites.url()}
                            value={
                                favoritesCount > 0 ? favoritesCount : undefined
                            }
                        />
                    </AreaRowGroup>

                    <AreaRowGroup title="Account">
                        <AreaRow
                            title="Modifica profilo"
                            icon={User}
                            href={editProfile.url()}
                        />
                        <AreaRow
                            title="Impostazioni"
                            icon={Settings}
                            href={settings.url()}
                        />
                    </AreaRowGroup>

                    <AreaRowGroup title="Aiuto">
                        <AreaRow
                            title="Centro assistenza"
                            icon={MessageCircle}
                            href={contactPage.url()}
                            external
                        />
                        <AreaRow
                            title="Privacy e termini"
                            icon={CircleAlert}
                            href={privacy.url()}
                            external
                        />
                    </AreaRowGroup>

                    <div>
                        <button
                            type="button"
                            aria-haspopup="dialog"
                            onClick={() => setAskLogout(true)}
                            className={cn(
                                areaButtonClassName('ghost', 'md'),
                                '-ml-5 text-[#ff7a7a]',
                            )}
                        >
                            Esci
                        </button>
                    </div>
                </div>
            </div>

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
                        className={cn(
                            areaButtonClassName('destructive', 'md'),
                            'w-full md:w-auto',
                        )}
                    >
                        Esci
                    </Link>
                    <button
                        type="button"
                        onClick={() => setAskLogout(false)}
                        className={cn(
                            areaButtonClassName('outline', 'md'),
                            'w-full md:w-auto',
                        )}
                    >
                        Annulla
                    </button>
                </div>
            </DarkDialog>
        </>
    );
}

Profile.layout = { section: 'profile' };
