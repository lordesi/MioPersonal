import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Building2,
    CalendarDays,
    Clock,
    Euro,
    MapPin,
    User,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { eventWhen, placesLabel } from '@/components/events/event-card';
import HomeShelf from '@/components/home/home-shelf';
import { eventCard } from '@/components/mp/cards';
import DarkDialog, {
    darkSecondaryButtonClassName,
} from '@/components/mp/dark-dialog';
import ProfileCard from '@/components/mp/profile-card';
import PhotoHero, {
    IconPlaceholder,
    heroChipClassName,
    heroFactsClassName,
    heroTitleClassName,
} from '@/components/trainer-profile/photo-hero';
import { ProfileBlock } from '@/components/trainer-profile/profile-sections';
import { Spinner } from '@/components/ui/spinner';
import { useShare } from '@/hooks/use-share';
import { cn } from '@/lib/utils';
import { cancel, register, search, start } from '@/routes/events';
import { join, leave } from '@/routes/events/waitlist';
import type { GroupSessionSummary, SeoData } from '@/types';

type EventHost = {
    name: string;
    href: string | null;
    kind: 'trainer' | 'gym';
    photoUrl: string | null;
};

type EventDetail = Omit<GroupSessionSummary, 'hosts'> & {
    description: string | null;
    cancelNote: string | null;
    started: boolean;
    lesson: boolean;
    mapsUrl: string | null;
    gymHref: string | null;
    hosts: EventHost[];
};

/** What the viewer can do: take a place, give it back, or nothing here. */
type EventState = 'open' | 'registered' | 'organizer' | 'not-client';

type EventProps = {
    seo: SeoData;
    event: EventDetail;
    otherDates: GroupSessionSummary[];
    state: EventState;
    /** "Avvisami se si libera": whether the viewer is in line, and how many are. */
    waitlist: { joined: boolean; count: number };
    city: { slug: string; name: string } | null;
    /** A lesson of a course: the course and its gym. */
    course: {
        name: string;
        href: string;
        gymName: string;
        gymHref: string;
    } | null;
    /** "Altri eventi a {città}". */
    nearby: GroupSessionSummary[];
    /** The page of the organizer area, for its organizers. */
    organizerHref: string | null;
};

/** The main button of the box: turquoise outline, full width. */
const mainButton = 'btn-brand h-12.5 w-full text-[17px]';

/** A grey note in the box: "Ci sei!", "I posti sono finiti.". */
const boxNote = 'rounded-[14px] bg-card px-3.5 py-3 text-[15px]';

/**
 * The page of an event, in the dark design of the trainer profile: the
 * photo with the title, what it is and who organizes it; on the right
 * (desktop, below on phones) when, where, the price (paid at the place)
 * and "Prenota il posto", confirmed at once while there are places left.
 */
export default function Event({
    seo,
    event,
    otherDates,
    state,
    waitlist,
    organizerHref,
    city,
    course,
    nearby,
}: EventProps) {
    const { auth } = usePage().props;
    const [busy, setBusy] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const share = useShare(event.title);
    // A course lesson: only the places already taken; the gym books the others.
    const closed = event.cancelled || event.started || event.lesson;

    const options = {
        preserveScroll: true,
        onStart: () => setBusy(true),
        onFinish: () => setBusy(false),
        onError: (errors: Record<string, string>) =>
            toast.error(errors.place ?? 'Riprova tra poco.'),
    };

    const book = () => router.post(register.url(event.slug), {}, options);
    const waitForPlace = () =>
        router.post(
            join.url(event.slug),
            {},
            {
                ...options,
                onError: (errors: Record<string, string>) =>
                    toast.error(errors.waitlist ?? 'Riprova tra poco.'),
            },
        );
    const stopWaiting = () => router.delete(leave.url(event.slug), options);
    const giveBack = () =>
        router.delete(cancel.url(event.slug), {
            ...options,
            onSuccess: () => setConfirmCancel(false),
        });

    const citySearch = search.url(city ? { city: city.slug } : undefined);
    const backHref = course ? course.href : citySearch;

    return (
        <>
            <Head title={seo.title} />

            <PhotoHero
                titleId="event-title"
                photosLabel={`Foto di ${event.title}`}
                slides={
                    event.coverUrl
                        ? [{ caption: event.title, url: event.coverUrl }]
                        : []
                }
                placeholder={
                    <IconPlaceholder
                        icon={CalendarDays}
                        label={`Nessuna foto di ${event.title}`}
                    />
                }
                backHref={backHref}
                backLabel={course ? 'Torna al corso' : 'Torna agli eventi'}
                backText={
                    course
                        ? course.name
                        : city
                          ? `Eventi a ${city.name}`
                          : 'Eventi'
                }
                onShare={share}
                shareLabel="Condividi l’evento"
                favorite={null}
            >
                <ul className="flex flex-wrap gap-1 md:gap-2">
                    <li className={heroChipClassName}>{event.typeLabel}</li>
                    {event.discipline && (
                        <li className={heroChipClassName}>
                            {event.discipline}
                        </li>
                    )}
                    {event.cancelled && (
                        <li
                            className={cn(
                                heroChipClassName,
                                'border-destructive text-destructive',
                            )}
                        >
                            Annullato
                        </li>
                    )}
                </ul>

                <h1
                    id="event-title"
                    className={cn(heroTitleClassName, 'md:font-bold')}
                >
                    {event.title}
                </h1>

                <div className={heroFactsClassName}>
                    <span className="flex items-center gap-1 md:gap-1.5">
                        <Clock aria-hidden="true" className="size-4.5" />
                        {eventWhen(event)}
                    </span>
                    <span className="flex items-center gap-1 md:gap-1.5">
                        <MapPin aria-hidden="true" className="size-4.5" />
                        {event.place}
                    </span>
                </div>
            </PhotoHero>

            <div className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 pt-10 md:px-8">
                <div className="flex flex-col gap-10 md:grid md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-18">
                    <div className="flex min-w-0 flex-col gap-10 md:gap-14">
                        {event.cancelled && (
                            <p
                                role="status"
                                className="rounded-[20px] px-4 py-3.5 text-[15px] shadow-[inset_0_0_0_1px_var(--destructive)]"
                            >
                                L’organizzatore ha annullato questo evento.
                                {event.cancelNote && ` “${event.cancelNote}”`}
                            </p>
                        )}

                        {event.description && (
                            <ProfileBlock
                                id="about-title"
                                title="Di cosa si tratta"
                            >
                                <p className="max-w-160 text-[17px] leading-6 break-words whitespace-pre-line md:leading-6.5">
                                    {event.description}
                                </p>
                            </ProfileBlock>
                        )}

                        {event.hosts.length > 0 && (
                            <ProfileBlock
                                id="hosts-title"
                                title={
                                    event.hosts.length === 1
                                        ? 'Organizzato da'
                                        : 'Organizzato insieme da'
                                }
                            >
                                <ul className="flex flex-col gap-2 md:gap-3">
                                    {event.hosts.map((host) => (
                                        <li key={`${host.kind}-${host.name}`}>
                                            <HostRow host={host} />
                                        </li>
                                    ))}
                                </ul>
                            </ProfileBlock>
                        )}
                    </div>

                    <aside
                        id="prenota"
                        aria-label="Prenota il posto"
                        className="flex scroll-mt-6 flex-col gap-5 rounded-[26px] bg-background p-5 shadow-[inset_0_0_0_1px_var(--border),0_24px_64px_-12px_rgba(0,0,0,0.8)] md:sticky md:top-6 md:p-6"
                    >
                        <dl className="flex flex-col gap-3.5">
                            <Fact icon={Clock} label="Quando">
                                {eventWhen(event)}
                            </Fact>
                            <Fact icon={MapPin} label="Dove">
                                {event.place}
                                {event.mapsUrl && (
                                    <>
                                        {' · '}
                                        <a
                                            href={event.mapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-brand hover:underline"
                                        >
                                            Mappa
                                        </a>
                                    </>
                                )}
                            </Fact>
                            <Fact icon={Euro} label="Prezzo">
                                {event.price === 'Gratis'
                                    ? 'Gratis'
                                    : `${event.price}, da pagare sul posto`}
                            </Fact>
                            {!event.cancelled && (
                                <Fact icon={Users} label="Posti">
                                    {placesLabel(event)} su {event.capacity}
                                </Fact>
                            )}
                        </dl>

                        <div className="border-t border-border pt-5">
                            <Action
                                state={state}
                                guest={!auth?.user}
                                closed={closed}
                                started={event.started}
                                soldOut={event.remaining === 0}
                                waitlist={waitlist}
                                onWait={waitForPlace}
                                onStopWaiting={stopWaiting}
                                busy={busy}
                                slug={event.slug}
                                organizerHref={organizerHref}
                                onBook={book}
                                onCancel={() => setConfirmCancel(true)}
                            />
                        </div>

                        {event.gymHref && (
                            <Link
                                href={event.gymHref}
                                className="flex min-h-11 items-center justify-center gap-2 text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <Building2
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                                Vedi la palestra
                            </Link>
                        )}
                    </aside>
                </div>
            </div>

            <HomeShelf
                id="dates-title"
                title="Altre date"
                link={{ label: 'Tutti gli eventi', href: citySearch }}
                items={otherDates}
                itemKey={(other) => other.slug}
            >
                {(other) => <ProfileCard {...eventCard(other)} />}
            </HomeShelf>
            {city && (
                <HomeShelf
                    id="nearby-title"
                    title={`Altri eventi a ${city.name}`}
                    link={{
                        label: 'Vedi tutti',
                        href: search.url({ city: city.slug }),
                    }}
                    items={nearby}
                    itemKey={(other) => other.slug}
                >
                    {(other) => <ProfileCard {...eventCard(other)} />}
                </HomeShelf>
            )}

            {/* Room for the bar on phones. */}
            <div className="pb-32 md:pb-14" />

            <DarkDialog
                open={confirmCancel}
                onOpenChange={setConfirmCancel}
                title="Annullare l’iscrizione?"
                description="Il posto torna libero per altri. Potrai iscriverti di nuovo se ci sono ancora posti."
            >
                <div className="flex flex-col gap-2 md:flex-row-reverse md:items-center md:gap-4">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={giveBack}
                        className="flex h-12.5 w-full items-center justify-center gap-2 rounded-full text-[17px] font-semibold text-destructive shadow-[inset_0_0_0_1.5px_var(--destructive)] outline-none hover:bg-destructive/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60 md:w-auto md:flex-1"
                    >
                        {busy && <Spinner />}
                        Annulla iscrizione
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        className={darkSecondaryButtonClassName}
                    >
                        Tengo il posto
                    </button>
                </div>
            </DarkDialog>

            {/* Phones (as the bar of the trainer profile): the box with "Prenota il posto" is below the description. */}
            {!closed && state !== 'organizer' && (
                <div className="fixed inset-x-3 bottom-4 z-40 flex items-center gap-3 rounded-[26px] bg-background p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[inset_0_0_0_1px_var(--border),0_16px_48px_-8px_rgba(0,0,0,0.75)] md:hidden">
                    <span
                        aria-hidden="true"
                        className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-card text-brand"
                    >
                        <CalendarDays className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[17px] leading-5.5 font-bold tabular-nums">
                            {event.price}
                        </span>
                        <span className="truncate text-[13px] text-muted-foreground">
                            {state === 'registered'
                                ? 'Hai il tuo posto'
                                : placesLabel(event)}
                        </span>
                    </span>
                    <a
                        href="#prenota"
                        className="flex h-11 shrink-0 items-center gap-3 rounded-full bg-[linear-gradient(180deg,#6fe4e6_0%,#42d7d9_52%,#2fc4c6_100%)] pr-1.5 pl-5 text-[17px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_24px_0_rgba(66,215,217,0.28)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        {state === 'registered'
                            ? 'Il tuo posto'
                            : event.remaining === 0
                              ? 'Lista d’attesa'
                              : 'Prenota'}
                        <span className="flex size-8 items-center justify-center rounded-full bg-background text-brand">
                            <ArrowUpRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </span>
                    </a>
                </div>
            )}
        </>
    );
}

function Fact({
    icon: Icon,
    label,
    children,
}: {
    icon: typeof Clock;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex gap-3">
            <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-card text-brand"
            >
                <Icon className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-[13px] text-muted-foreground">{label}</dt>
                <dd className="text-[15px] break-words tabular-nums">
                    {children}
                </dd>
            </div>
        </div>
    );
}

/** An organizer: a dark card with the photo, to their profile. */
function HostRow({ host }: { host: EventHost }) {
    const content = (
        <>
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-brand">
                {host.photoUrl ? (
                    <img
                        src={host.photoUrl}
                        alt=""
                        className="size-full object-cover"
                    />
                ) : host.kind === 'gym' ? (
                    <Building2 aria-hidden="true" className="size-5" />
                ) : (
                    <User aria-hidden="true" className="size-5" />
                )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[17px] font-semibold">{host.name}</span>
                <span className="text-[13px] text-muted-foreground">
                    {host.kind === 'gym' ? 'Palestra' : 'Personal trainer'}
                </span>
            </span>
        </>
    );

    const card =
        'flex items-center gap-3 rounded-[20px] bg-card px-4 py-3.5 md:gap-4 md:p-5';

    return host.href ? (
        <Link
            href={host.href}
            className={cn(
                card,
                'outline-none hover:bg-[#232323] focus-visible:ring-[3px] focus-visible:ring-ring/50',
            )}
        >
            {content}
            <ArrowRight
                aria-hidden="true"
                className="size-5 shrink-0 text-brand"
            />
        </Link>
    ) : (
        <div className={card}>{content}</div>
    );
}

function Action({
    state,
    guest,
    closed,
    started,
    soldOut,
    waitlist,
    onWait,
    onStopWaiting,
    busy,
    slug,
    organizerHref,
    onBook,
    onCancel,
}: {
    state: EventState;
    guest: boolean;
    closed: boolean;
    started: boolean;
    soldOut: boolean;
    waitlist: { joined: boolean; count: number };
    onWait: () => void;
    onStopWaiting: () => void;
    busy: boolean;
    slug: string;
    organizerHref: string | null;
    onBook: () => void;
    onCancel: () => void;
}) {
    if (state === 'organizer') {
        return (
            <Link href={organizerHref ?? '#'} className={mainButton}>
                Gestisci l’evento
            </Link>
        );
    }

    if (state === 'registered') {
        return (
            <div className="flex flex-col gap-2">
                <p
                    role="status"
                    className="rounded-[14px] px-3.5 py-3 text-[15px] font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                >
                    Ci sei! Il tuo posto è confermato.
                </p>
                {!started && (
                    <button
                        type="button"
                        className={cn(
                            darkSecondaryButtonClassName,
                            'md:w-full',
                        )}
                        disabled={busy}
                        onClick={onCancel}
                    >
                        Annulla iscrizione
                    </button>
                )}
            </div>
        );
    }

    if (closed) {
        return (
            <p className="text-[15px] text-muted-foreground">
                Le iscrizioni sono chiuse.
            </p>
        );
    }

    if (state === 'not-client') {
        return (
            <p className="text-[15px] text-muted-foreground">
                Solo i clienti possono prenotare un posto.
            </p>
        );
    }

    if (soldOut) {
        return (
            <div className="flex flex-col gap-2">
                <p className={cn(boxNote, 'font-semibold')}>
                    I posti sono finiti.
                </p>
                {guest ? (
                    <Link href={start.url(slug)} className={mainButton}>
                        Accedi per essere avvisato
                    </Link>
                ) : waitlist.joined ? (
                    <>
                        <p
                            role="status"
                            className="rounded-[14px] px-3.5 py-3 text-[15px] shadow-[inset_0_0_0_1px_var(--brand)]"
                        >
                            Ti avvisiamo se si libera un posto.
                        </p>
                        <button
                            type="button"
                            className={cn(
                                darkSecondaryButtonClassName,
                                'md:w-full',
                            )}
                            disabled={busy}
                            onClick={onStopWaiting}
                        >
                            Non avvisarmi più
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className={mainButton}
                        disabled={busy}
                        onClick={onWait}
                    >
                        {busy && <Spinner />}
                        Avvisami se si libera un posto
                    </button>
                )}
                {waitlist.count > 0 && (
                    <p className="text-center text-[13px] text-muted-foreground">
                        {waitlist.count === 1
                            ? '1 persona è in lista.'
                            : `${waitlist.count} persone sono in lista.`}{' '}
                        Non prenotiamo noi: chi arriva prima, prende il posto.
                    </p>
                )}
            </div>
        );
    }

    if (guest) {
        return (
            <div className="flex flex-col gap-2">
                <Link href={start.url(slug)} className={mainButton}>
                    Accedi per prenotare
                </Link>
                <p className="text-center text-[13px] text-muted-foreground">
                    Ci vuole un minuto, ed è gratis.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                type="button"
                className={mainButton}
                disabled={busy}
                onClick={onBook}
            >
                {busy && <Spinner />}
                Prenota il posto
            </button>
            <p className="text-center text-[13px] text-muted-foreground">
                Posto confermato subito. Riceverai conferma e promemoria.
            </p>
        </div>
    );
}

Event.layout = { hideHeaderOnMobile: true };
