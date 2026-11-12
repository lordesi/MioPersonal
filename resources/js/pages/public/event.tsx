import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Clock,
    Euro,
    MapPin,
    User,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import {
    EventGrid,
    eventWhen,
    placesLabel,
} from '@/components/events/event-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileMobileHeader from '@/components/profile/profile-mobile-header';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { home } from '@/routes';
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

/**
 * The page of an event: when, where, the price (paid at the place), the
 * organizers and "Prenota il posto", confirmed at once while there are
 * places left.
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
    const closed = event.cancelled || event.started;

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

    const backHref = course
        ? course.href
        : search.url(city ? { city: city.slug } : undefined);

    return (
        <>
            <Head title={seo.title} />
            <ProfileMobileHeader
                backHref={backHref}
                backLabel={course ? 'Torna al corso' : 'Torna agli eventi'}
            />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-20">
                <Breadcrumb aria-label="Percorso" className="hidden md:block">
                    <BreadcrumbList className="text-[13px]">
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={home()}>Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        {course ? (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={course.gymHref}>
                                            {course.gymName}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={course.href}>
                                            {course.name}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        ) : (
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href={backHref}>
                                        {city
                                            ? `Eventi a ${city.name}`
                                            : 'Eventi'}
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        )}
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage>{event.title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px] md:gap-8">
                    <div className="flex min-w-0 flex-col gap-5">
                        <div className="relative flex aspect-16/9 items-center justify-center overflow-hidden rounded-3xl bg-primary text-primary-foreground">
                            {event.coverUrl ? (
                                <img
                                    src={event.coverUrl}
                                    alt=""
                                    className="size-full object-cover"
                                />
                            ) : (
                                <CalendarDays
                                    aria-hidden="true"
                                    className="size-12"
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="secondary">
                                    {event.typeLabel}
                                </Badge>
                                {event.discipline && (
                                    <Badge variant="outline">
                                        {event.discipline}
                                    </Badge>
                                )}
                                {event.cancelled && (
                                    <Badge variant="destructive">
                                        Annullato
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-[30px] leading-9 font-bold tracking-tighter md:text-[40px] md:leading-12">
                                {event.title}
                            </h1>
                        </div>

                        {event.cancelled && (
                            <p
                                role="status"
                                className="rounded-2xl bg-muted px-4 py-3 text-sm"
                            >
                                L’organizzatore ha annullato questo evento.
                                {event.cancelNote && ` “${event.cancelNote}”`}
                            </p>
                        )}

                        {event.description && (
                            <section
                                aria-labelledby="about-title"
                                className="flex flex-col gap-2"
                            >
                                <h2
                                    id="about-title"
                                    className="text-lg font-semibold"
                                >
                                    Di cosa si tratta
                                </h2>
                                <p className="text-[15px] leading-6.5 whitespace-pre-line text-muted-foreground">
                                    {event.description}
                                </p>
                            </section>
                        )}

                        {event.hosts.length > 0 && (
                            <section
                                aria-labelledby="hosts-title"
                                className="flex flex-col gap-3"
                            >
                                <h2
                                    id="hosts-title"
                                    className="text-lg font-semibold"
                                >
                                    {event.hosts.length === 1
                                        ? 'Organizzato da'
                                        : 'Organizzato insieme da'}
                                </h2>
                                <ul className="flex flex-col gap-2">
                                    {event.hosts.map((host) => (
                                        <li key={`${host.kind}-${host.name}`}>
                                            <HostRow host={host} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    <aside
                        id="prenota"
                        className="flex scroll-mt-4 flex-col gap-4 md:sticky md:top-24 md:self-start"
                    >
                        <div className="flex flex-col gap-4 rounded-3xl border bg-card p-5">
                            <dl className="flex flex-col gap-3 text-sm">
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
                                                className="font-medium underline underline-offset-4"
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
                            <Button asChild variant="outline" className="h-11">
                                <Link href={event.gymHref}>
                                    <Building2 aria-hidden="true" />
                                    Vedi la palestra
                                </Link>
                            </Button>
                        )}
                    </aside>
                </div>

                {otherDates.length > 0 && (
                    <section
                        aria-labelledby="dates-title"
                        className="flex flex-col gap-4"
                    >
                        <h2
                            id="dates-title"
                            className="text-2xl font-semibold tracking-tight"
                        >
                            Altre date
                        </h2>
                        <EventGrid events={otherDates} />
                    </section>
                )}

                <ConfirmDialog
                    open={confirmCancel}
                    onOpenChange={setConfirmCancel}
                    title="Annullare l’iscrizione?"
                    description="Il posto torna libero per altri. Potrai iscriverti di nuovo se ci sono ancora posti."
                    confirmLabel="Annulla iscrizione"
                    cancelLabel="Tengo il posto"
                    destructive
                    onConfirm={giveBack}
                />

                {nearby.length > 0 && city && (
                    <section
                        aria-labelledby="nearby-title"
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <h2
                                id="nearby-title"
                                className="text-2xl font-semibold tracking-tight"
                            >
                                Altri eventi a {city.name}
                            </h2>
                            <Link
                                href={search.url({ city: city.slug })}
                                className="inline-flex min-h-11 items-center text-sm font-medium underline md:min-h-0"
                            >
                                Tutti gli eventi a {city.name}
                            </Link>
                        </div>
                        <EventGrid events={nearby} />
                    </section>
                )}
            </div>

            {/* Phones: the box with "Prenota il posto" is below the description. */}
            {!closed && state !== 'organizer' && (
                <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-background px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
                    <span className="flex min-w-0 flex-1 flex-col text-sm">
                        <strong className="truncate">{event.price}</strong>
                        <span className="truncate text-muted-foreground">
                            {state === 'registered'
                                ? 'Hai il tuo posto'
                                : placesLabel(event)}
                        </span>
                    </span>
                    <Button asChild className="h-12 px-5 font-semibold">
                        <a href="#prenota">
                            {state === 'registered'
                                ? 'Vedi la prenotazione'
                                : event.remaining === 0
                                  ? 'Lista d’attesa'
                                  : 'Prenota il posto'}
                        </a>
                    </Button>
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
    children: React.ReactNode;
}) {
    return (
        <div className="flex gap-3">
            <Icon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div className="flex flex-col gap-0.5">
                <dt className="text-xs font-semibold text-muted-foreground">
                    {label}
                </dt>
                <dd className="tabular-nums">{children}</dd>
            </div>
        </div>
    );
}

function HostRow({ host }: { host: EventHost }) {
    const content = (
        <>
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
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
            <span className="flex flex-col">
                <span className="font-semibold">{host.name}</span>
                <span className="text-sm text-muted-foreground">
                    {host.kind === 'gym' ? 'Palestra' : 'Personal trainer'}
                </span>
            </span>
        </>
    );

    return host.href ? (
        <Link
            href={host.href}
            className="flex items-center gap-3 rounded-2xl border bg-card p-3 hover:bg-muted"
        >
            {content}
        </Link>
    ) : (
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            {content}
        </div>
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
    const button = 'h-12 rounded-[14px] text-base font-semibold';

    if (state === 'organizer') {
        return (
            <Button asChild className={button}>
                <Link href={organizerHref ?? '#'}>Gestisci l’evento</Link>
            </Button>
        );
    }

    if (state === 'registered') {
        return (
            <div className="flex flex-col gap-2">
                <p
                    role="status"
                    className="rounded-xl bg-muted px-3 py-2.5 text-sm font-medium"
                >
                    Ci sei! Il tuo posto è confermato.
                </p>
                {!started && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        disabled={busy}
                        onClick={onCancel}
                    >
                        Annulla iscrizione
                    </Button>
                )}
            </div>
        );
    }

    if (closed) {
        return (
            <p className="text-sm text-muted-foreground">
                Le iscrizioni sono chiuse.
            </p>
        );
    }

    if (state === 'not-client') {
        return (
            <p className="text-sm text-muted-foreground">
                Solo i clienti possono prenotare un posto.
            </p>
        );
    }

    if (soldOut) {
        return (
            <div className="flex flex-col gap-2">
                <p className="rounded-xl bg-muted px-3 py-2.5 text-sm font-medium">
                    I posti sono finiti.
                </p>
                {guest ? (
                    <Button asChild variant="outline" className="h-11">
                        <Link href={start.url(slug)}>
                            Accedi per essere avvisato
                        </Link>
                    </Button>
                ) : waitlist.joined ? (
                    <>
                        <p
                            role="status"
                            className="rounded-xl border px-3 py-2.5 text-sm"
                        >
                            Ti avvisiamo se si libera un posto.
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11"
                            disabled={busy}
                            onClick={onStopWaiting}
                        >
                            Non avvisarmi più
                        </Button>
                    </>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 font-semibold"
                        disabled={busy}
                        onClick={onWait}
                    >
                        Avvisami se si libera un posto
                    </Button>
                )}
                {waitlist.count > 0 && (
                    <p className="text-center text-xs text-muted-foreground">
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
                <Button asChild className={button}>
                    <Link href={start.url(slug)}>Accedi per prenotare</Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    Ci vuole un minuto, ed è gratis.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Button
                type="button"
                className={button}
                disabled={busy}
                onClick={onBook}
            >
                Prenota il posto
            </Button>
            <p className="text-center text-xs text-muted-foreground">
                Posto confermato subito. Riceverai conferma e promemoria.
            </p>
        </div>
    );
}

Event.layout = { hideHeaderOnMobile: true };
