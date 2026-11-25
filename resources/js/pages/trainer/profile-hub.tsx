import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarCheck,
    CircleAlert,
    Clock,
    Eye,
    History,
    MessageCircle,
    Pencil,
    Settings,
    Share2,
    Star,
    Tag,
    Ticket,
    User,
} from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import {
    AreaRow,
    AreaSwitch,
    AreaRowGroup,
    areaButtonClassName,
    areaTitleClassName,
    carbCardClassName,
} from '@/components/mp/area-bits';
import DarkDialog from '@/components/mp/dark-dialog';
import StatsBlock from '@/components/trainer/home/stats-block';
import { Initials } from '@/components/trainer/ui/bits';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useFeatures } from '@/lib/features';
import { formatUntilDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { show as contactPage } from '@/routes/contact';
import { privacy } from '@/routes/legal';
import {
    availability,
    events,
    gyms,
    pastSessions,
    profile,
    requests,
    reviews,
    services,
    settings,
    share,
} from '@/routes/trainer';
import { edit as editProfile } from '@/routes/trainer/profile';
import { update as updateVisibility } from '@/routes/trainer/visibility';
import type {
    TrainerAreaData,
    TrainerDashboardStats,
    TrainerStatsPeriod,
} from '@/types';

type Visibility = {
    visibleInSearch: boolean;
    acceptsNewClients: boolean;
    pausedUntil: string | null;
    paused: boolean;
};

type ProfileHubProps = {
    me: {
        name: string;
        avatar: string | null;
        publicUrl: string | null;
        /** "Boxe e Functional · Milano". */
        subtitle: string | null;
    };
    /** Null until the registration is sent. */
    visibility: Visibility | null;
    counts: {
        services: number;
        gyms: number;
        reviews: number;
        rating: number | null;
    } | null;
    stats: TrainerDashboardStats | null;
};

/**
 * "Profilo" of the trainer (design "Trainer · Profilo · nuovo"): the photo
 * with the pencil, the name, the disciplines and the city, the statistics,
 * "Accetto nuove prenotazioni", then ATTIVITÀ, VETRINA, ACCOUNT, AIUTO and
 * "Esci". Desktop: the person and the numbers on the left, the lists on the
 * right.
 */
export default function ProfileHub({
    me,
    visibility,
    counts,
    stats,
}: ProfileHubProps) {
    const { trainerArea } = usePage<{ trainerArea?: TrainerAreaData }>().props;
    const features = useFeatures();
    const [askLogout, setAskLogout] = useState(false);
    const cleanup = useMobileNavigation();
    const pending = trainerArea?.pendingCount ?? 0;

    const changePeriod = (
        period: TrainerStatsPeriod,
        from?: string,
        to?: string,
    ) => {
        router.get(
            profile.url({
                query: {
                    periodo: period === '7' ? undefined : period,
                    dal: period === 'intervallo' ? from : undefined,
                    al: period === 'intervallo' ? to : undefined,
                },
            }),
            {},
            {
                only: ['stats'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Profilo" />

            <h1 className={cn(areaTitleClassName, '-mb-1')}>Profilo</h1>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-16">
                <div className="flex min-w-0 flex-col gap-8">
                    <div className="flex items-center gap-4.5">
                        <span className="relative size-22 shrink-0">
                            <Initials
                                name={me.name}
                                src={me.avatar}
                                size={88}
                                className="bg-[#1c1e21] text-foreground"
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
                                {me.name}
                            </span>
                            {me.subtitle && (
                                <span className="text-[15px] leading-5 text-muted-foreground">
                                    {me.subtitle}
                                </span>
                            )}
                        </div>
                    </div>

                    {stats && (
                        <StatsBlock
                            stats={stats}
                            today={stats.to}
                            onChange={changePeriod}
                            title="Le tue statistiche"
                            chart={false}
                        />
                    )}

                    {visibility && <NewClientsSwitch visibility={visibility} />}
                </div>

                <div className="flex min-w-0 flex-col gap-8">
                    <AreaRowGroup title="Attività">
                        <AreaRow
                            title="Richieste"
                            icon={CalendarCheck}
                            href={requests.url()}
                            value={pending > 0 ? pending : undefined}
                        />
                        <AreaRow
                            title="Servizi e prezzi"
                            icon={Tag}
                            href={services.url()}
                            value={counts?.services || undefined}
                        />
                        <AreaRow
                            title="Disponibilità"
                            icon={Clock}
                            href={availability.url()}
                        />
                        <AreaRow
                            title="Recensioni"
                            icon={Star}
                            href={reviews.url()}
                            value={
                                counts?.rating
                                    ? counts.rating.toLocaleString('it-IT')
                                    : undefined
                            }
                        />
                        <AreaRow
                            title="Sedute passate"
                            icon={History}
                            href={pastSessions.url()}
                        />
                        {features.events && (
                            <AreaRow
                                title="Eventi"
                                icon={Ticket}
                                href={events.url()}
                            />
                        )}
                        {features.gyms && (
                            <AreaRow
                                title="Palestre"
                                icon={Building2}
                                href={gyms.url()}
                                value={counts?.gyms || undefined}
                            />
                        )}
                    </AreaRowGroup>

                    <AreaRowGroup title="Vetrina">
                        {me.publicUrl && (
                            <AreaRow
                                title="Vedi profilo pubblico"
                                icon={Eye}
                                href={me.publicUrl}
                                external
                            />
                        )}
                        <AreaRow
                            title="Condividi profilo"
                            icon={Share2}
                            href={share.url()}
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

/**
 * "Accetto nuove prenotazioni": the switch of Impostazioni › Visibilità,
 * saved at once. The clients already followed can always book.
 */
function NewClientsSwitch({ visibility }: { visibility: Visibility }) {
    const labelId = useId();
    const noteId = useId();
    const [saving, setSaving] = useState(false);
    const on = visibility.acceptsNewClients;
    const note = visibility.pausedUntil
        ? `In pausa fino ${formatUntilDay(visibility.pausedUntil)}`
        : on
          ? 'I nuovi clienti possono prenotarti'
          : 'Prenotano solo i clienti che hai già';

    const toggle = () => {
        router.patch(
            updateVisibility.url(),
            {
                visible_in_search: visibility.visibleInSearch,
                accepts_new_clients: !on,
            },
            {
                preserveScroll: true,
                only: ['visibility'],
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onError: () =>
                    toast.error('Non siamo riusciti a salvare. Riprova.'),
            },
        );
    };

    return (
        <div
            className={cn(
                carbCardClassName,
                'flex min-h-16 items-center gap-3.5 px-4 py-3',
            )}
        >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b
                    id={labelId}
                    className="text-[17px] leading-5.5 font-semibold"
                >
                    Accetto nuove prenotazioni
                </b>
                <span
                    id={noteId}
                    className="text-[15px] leading-5 text-muted-foreground"
                >
                    {note}
                </span>
            </span>
            <AreaSwitch
                checked={on}
                onToggle={toggle}
                disabled={saving}
                labelledBy={labelId}
                describedBy={noteId}
            />
        </div>
    );
}

ProfileHub.layout = { section: 'profile-hub' };
