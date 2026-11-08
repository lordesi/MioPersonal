import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    ExternalLink,
    Mail,
    Pencil,
    Phone,
    Search,
    Trash2,
    User,
    UserMinus,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { eventWhen } from '@/components/events/event-card';
import InputError from '@/components/input-error';
import ChoiceChips from '@/components/shared/choice-chips';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import PageHeading from '@/components/trainer/area/page-heading';
import Panel from '@/components/trainer/area/panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { organizerRoutes } from '@/lib/events';
import type { GroupSessionSummary, OrganizerArea } from '@/types';

type ManagedEvent = GroupSessionSummary & {
    description: string | null;
    offlineSeats: number;
    registered: number;
    started: boolean;
    lesson: boolean;
    cancelNote: string | null;
    /** Dates of the series from this one on. */
    following: number;
    inSeries: boolean;
};

type Registration = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    /** registered, cancelled, removed */
    status: string;
    at: string;
};

type Host = {
    id: number;
    name: string;
    kind: 'trainer' | 'gym';
    isOwner: boolean;
    /** pending, accepted, declined */
    status: string;
    isMe: boolean;
};

type HostResult = {
    kind: 'trainer' | 'gym';
    slug: string;
    name: string;
    city: string | null;
};

export type OrganizerEventProps = {
    area: OrganizerArea;
    event: ManagedEvent;
    isOwner: boolean;
    myHostId: number;
    registrations: Registration[];
    hosts: Host[];
    maxHosts: number;
    query: string;
    results: HostResult[];
};

type Scope = 'this' | 'following';

const scopeOptions = [
    { value: 'this', label: 'Solo questa data' },
    { value: 'following', label: 'Questa e le successive' },
];

/**
 * The page of an event in the organizer area: the places (with "Posti
 * rimasti" for the people who booked outside the app), the clients and the
 * co-organizers. The owner changes, cancels or deletes it.
 */
export default function OrganizerEvent({
    area,
    event,
    isOwner,
    myHostId,
    registrations,
    hosts,
    maxHosts,
    query,
    results,
}: OrganizerEventProps) {
    const routes = organizerRoutes(area);
    const open = !event.cancelled && !event.started;
    const canEdit = isOwner && !event.lesson && open;
    const active = registrations.filter((row) => row.status === 'registered');
    const left = registrations.filter((row) => row.status !== 'registered');
    const [cancelling, setCancelling] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [removing, setRemoving] = useState<Registration | null>(null);
    const [leaving, setLeaving] = useState<Host | null>(null);

    const options = {
        preserveScroll: true,
        onError: (errors: Record<string, string>) =>
            toast.error(Object.values(errors)[0] ?? 'Riprova tra poco.'),
    };

    return (
        <>
            <Head title={event.title} />

            <Button asChild variant="ghost" className="-ml-3 self-start">
                <Link href={routes.index.url()}>
                    <ArrowLeft aria-hidden="true" />
                    Eventi
                </Link>
            </Button>

            <PageHeading
                eyebrow={`${event.typeLabel} · ${eventWhen(event)}`}
                title={event.title}
                description={event.place}
                action={
                    <div className="flex flex-wrap gap-2">
                        {!event.lesson && (
                            <Button asChild variant="outline">
                                <Link href={event.href}>
                                    <ExternalLink aria-hidden="true" />
                                    Pagina pubblica
                                </Link>
                            </Button>
                        )}
                        {canEdit && (
                            <Button asChild>
                                <Link href={routes.edit.url(event.id)}>
                                    <Pencil aria-hidden="true" />
                                    Modifica
                                </Link>
                            </Button>
                        )}
                    </div>
                }
            />

            {event.cancelled && (
                <p
                    role="status"
                    className="rounded-2xl bg-muted px-4 py-3 text-sm"
                >
                    Evento annullato: gli iscritti sono stati avvisati.
                    {event.cancelNote && ` “${event.cancelNote}”`}
                </p>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Seats event={event} routes={routes} open={open} />

                <Panel title={`Iscritti · ${active.length}`}>
                    {active.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Ancora nessun iscritto.
                        </p>
                    ) : (
                        <ul className="flex flex-col divide-y">
                            {active.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex items-center gap-3 py-2.5"
                                >
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="font-medium">
                                            {row.name}
                                        </span>
                                        <span className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                                            <a
                                                href={`mailto:${row.email}`}
                                                className="inline-flex items-center gap-1 hover:underline"
                                            >
                                                <Mail
                                                    aria-hidden="true"
                                                    className="size-3.5"
                                                />
                                                {row.email}
                                            </a>
                                            {row.phone && (
                                                <a
                                                    href={`tel:${row.phone}`}
                                                    className="inline-flex items-center gap-1 hover:underline"
                                                >
                                                    <Phone
                                                        aria-hidden="true"
                                                        className="size-3.5"
                                                    />
                                                    {row.phone}
                                                </a>
                                            )}
                                        </span>
                                    </div>
                                    {open && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Annulla l’iscrizione di ${row.name}`}
                                            onClick={() => setRemoving(row)}
                                        >
                                            <UserMinus aria-hidden="true" />
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {left.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Non vengono più:{' '}
                            {left.map((row) => row.name).join(', ')}.
                        </p>
                    )}
                </Panel>
            </div>

            {!event.lesson && (
                <Hosts
                    routes={routes}
                    event={event}
                    hosts={hosts}
                    isOwner={isOwner}
                    myHostId={myHostId}
                    maxHosts={maxHosts}
                    query={query}
                    results={results}
                    open={open}
                    onLeave={setLeaving}
                />
            )}

            {canEdit && (
                <Panel title="Annulla o elimina">
                    <p className="text-sm text-muted-foreground">
                        Annullando, gli iscritti ricevono una mail e una
                        notifica. Puoi eliminare un evento solo se non ha
                        iscritti.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCancelling(true)}
                        >
                            Annulla l’evento
                        </Button>
                        {event.registered === 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => setDeleting(true)}
                            >
                                <Trash2 aria-hidden="true" />
                                Elimina
                            </Button>
                        )}
                    </div>
                </Panel>
            )}

            <CancelDialog
                open={cancelling}
                onOpenChange={setCancelling}
                event={event}
                url={routes.cancel.url(event.id)}
            />

            <DeleteDialog
                open={deleting}
                onOpenChange={setDeleting}
                event={event}
                url={routes.destroy.url(event.id)}
            />

            <ConfirmDialog
                open={removing !== null}
                onOpenChange={(isOpen) => !isOpen && setRemoving(null)}
                title={`Annullare l’iscrizione di ${removing?.name ?? ''}?`}
                description="Il cliente riceve una mail e il posto torna libero."
                confirmLabel="Annulla iscrizione"
                destructive
                onConfirm={() =>
                    removing &&
                    router.delete(
                        routes.registrations.destroy.url({
                            session: event.id,
                            registration: removing.id,
                        }),
                        { ...options, onFinish: () => setRemoving(null) },
                    )
                }
            />

            <ConfirmDialog
                open={leaving !== null}
                onOpenChange={(isOpen) => !isOpen && setLeaving(null)}
                title={
                    leaving?.isMe
                        ? 'Uscire dagli organizzatori?'
                        : `Togliere ${leaving?.name ?? ''} dagli organizzatori?`
                }
                description={
                    event.inSeries
                        ? 'Vale per questa data e le successive.'
                        : 'L’evento non comparirà più nel suo profilo.'
                }
                confirmLabel={leaving?.isMe ? 'Esci' : 'Togli'}
                destructive
                onConfirm={() =>
                    leaving &&
                    router.delete(
                        routes.hosts.destroy.url({
                            session: event.id,
                            host: leaving.id,
                        }),
                        { ...options, onFinish: () => setLeaving(null) },
                    )
                }
            />
        </>
    );
}

type Routes = ReturnType<typeof organizerRoutes>;

/** The places: total, taken here, taken outside the app, left. */
function Seats({
    event,
    routes,
    open,
}: {
    event: ManagedEvent;
    routes: Routes;
    open: boolean;
}) {
    const form = useForm({ remaining: event.remaining });

    useEffect(() => {
        form.setData('remaining', event.remaining);
        // Only when the server sends new numbers.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.remaining]);

    const free = event.capacity - event.registered;

    return (
        <Panel title="Posti">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Totali" value={event.capacity} />
                <Stat label="Da MioPersonal" value={event.registered} />
                <Stat label="Fuori dall’app" value={event.offlineSeats} />
                <Stat label="Rimasti" value={event.remaining} />
            </dl>
            {open && (
                <form
                    noValidate
                    className="flex flex-col gap-1.5"
                    onSubmit={(submitEvent) => {
                        submitEvent.preventDefault();
                        form.put(routes.seats.url(event.id), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <Label htmlFor="event-remaining">Posti rimasti</Label>
                    <div className="flex gap-2">
                        <Input
                            id="event-remaining"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={Math.max(0, free)}
                            className="w-28"
                            value={form.data.remaining}
                            onChange={(changeEvent) =>
                                form.setData(
                                    'remaining',
                                    Number(changeEvent.target.value),
                                )
                            }
                        />
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={
                                form.processing ||
                                form.data.remaining === event.remaining
                            }
                        >
                            {form.processing && <Spinner />}
                            Aggiorna
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Qualcuno ha prenotato al telefono o in palestra? Abbassa
                        i posti rimasti: con 0 l’evento risulta esaurito.
                    </p>
                    <InputError message={form.errors.remaining} />
                </form>
            )}
        </Panel>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col rounded-xl bg-muted/60 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{value}</dd>
        </div>
    );
}

/** The organizers and, for the owner, the search to invite one. */
function Hosts({
    routes,
    event,
    hosts,
    isOwner,
    myHostId,
    maxHosts,
    query,
    results,
    open,
    onLeave,
}: {
    routes: Routes;
    event: ManagedEvent;
    hosts: Host[];
    isOwner: boolean;
    myHostId: number;
    maxHosts: number;
    query: string;
    results: HostResult[];
    open: boolean;
    onLeave: (host: Host) => void;
}) {
    const [search, setSearch] = useState(query);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const used = hosts.filter((host) => host.status !== 'declined').length;
    const canInvite = isOwner && open && used < maxHosts;

    useEffect(() => {
        if (search === query) {
            return;
        }

        clearTimeout(timer.current);
        timer.current = setTimeout(
            () =>
                router.get(
                    routes.show.url(event.id, {
                        query: { q: search || undefined },
                    }),
                    {},
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        only: ['results', 'query'],
                    },
                ),
            300,
        );

        return () => clearTimeout(timer.current);
    }, [search, query, routes, event.id]);

    const invite = (result: HostResult) =>
        router.post(
            routes.hosts.store.url(event.id),
            { kind: result.kind, slug: result.slug },
            {
                preserveScroll: true,
                onSuccess: () => setSearch(''),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ?? 'Riprova tra poco.',
                    ),
            },
        );

    return (
        <Panel title={`Organizzatori · ${used} di ${maxHosts}`}>
            <ul className="flex flex-col divide-y">
                {hosts
                    .filter((host) => host.status !== 'declined')
                    .map((host) => (
                        <li
                            key={host.id}
                            className="flex items-center gap-3 py-2.5"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                {host.kind === 'gym' ? (
                                    <Building2
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                ) : (
                                    <User
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                )}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="font-medium">
                                    {host.name}
                                    {host.isMe && ' (tu)'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {host.isOwner
                                        ? 'Ha creato l’evento'
                                        : host.kind === 'gym'
                                          ? 'Palestra'
                                          : 'Personal trainer'}
                                </span>
                            </span>
                            {host.status === 'pending' && (
                                <Badge variant="outline">In attesa</Badge>
                            )}
                            {!host.isOwner &&
                                (isOwner || host.id === myHostId) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onLeave(host)}
                                    >
                                        {host.id === myHostId
                                            ? 'Esci'
                                            : 'Togli'}
                                    </Button>
                                )}
                        </li>
                    ))}
            </ul>

            {canInvite && (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="host-search">
                        Invita un trainer o una palestra
                    </Label>
                    <div className="relative">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="host-search"
                            type="search"
                            className="pl-9"
                            placeholder="Cerca per nome"
                            value={search}
                            onChange={(changeEvent) =>
                                setSearch(changeEvent.target.value)
                            }
                        />
                    </div>
                    {search.length >= 2 && results.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nessun profilo trovato.
                        </p>
                    )}
                    {results.length > 0 && (
                        <ul className="flex flex-col divide-y rounded-xl border">
                            {results.map((result) => (
                                <li
                                    key={`${result.kind}-${result.slug}`}
                                    className="flex items-center gap-3 px-3 py-2"
                                >
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate font-medium">
                                            {result.name}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {result.kind === 'gym'
                                                ? 'Palestra'
                                                : 'Personal trainer'}
                                            {result.city && ` · ${result.city}`}
                                        </span>
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => invite(result)}
                                    >
                                        Invita
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {event.inSeries
                            ? 'L’invito vale per questa data e le successive. '
                            : ''}
                        Chi accetta vede gli iscritti, può correggere i posti
                        rimasti e l’evento compare nel suo profilo.
                    </p>
                </div>
            )}
        </Panel>
    );
}

function CancelDialog({
    open,
    onOpenChange,
    event,
    url,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: ManagedEvent;
    url: string;
}) {
    const form = useForm({ note: '', scope: 'this' as Scope });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Annullare l’evento?</DialogTitle>
                    <DialogDescription>
                        {event.registered > 0
                            ? `${event.registered === 1 ? 'L’iscritto riceve' : `I ${event.registered} iscritti ricevono`} una mail e una notifica.`
                            : 'Non ci sono ancora iscritti.'}
                    </DialogDescription>
                </DialogHeader>
                {event.inSeries && event.following > 1 && (
                    <ChoiceChips
                        aria-label="Quali date"
                        options={scopeOptions}
                        value={form.data.scope}
                        onChange={(value) =>
                            form.setData('scope', value as Scope)
                        }
                    />
                )}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cancel-note">
                        Messaggio agli iscritti (facoltativo)
                    </Label>
                    <Textarea
                        id="cancel-note"
                        rows={3}
                        maxLength={200}
                        value={form.data.note}
                        onChange={(changeEvent) =>
                            form.setData('note', changeEvent.target.value)
                        }
                    />
                    <InputError message={form.errors.note} />
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Indietro
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={form.processing}
                        onClick={() =>
                            form.post(url, {
                                preserveScroll: true,
                                onSuccess: () => onOpenChange(false),
                            })
                        }
                    >
                        {form.processing && <Spinner />}
                        Annulla l’evento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteDialog({
    open,
    onOpenChange,
    event,
    url,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: ManagedEvent;
    url: string;
}) {
    const form = useForm({ scope: 'this' as Scope });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminare l’evento?</DialogTitle>
                    <DialogDescription>
                        Sparisce dal sito. Le date con iscritti restano: per
                        quelle usa “Annulla l’evento”.
                    </DialogDescription>
                </DialogHeader>
                {event.inSeries && event.following > 1 && (
                    <ChoiceChips
                        aria-label="Quali date"
                        options={scopeOptions}
                        value={form.data.scope}
                        onChange={(value) =>
                            form.setData('scope', value as Scope)
                        }
                    />
                )}
                <InputError
                    message={(form.errors as Record<string, string>).delete}
                />
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Indietro
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={form.processing}
                        onClick={() => form.delete(url)}
                    >
                        {form.processing && <Spinner />}
                        Elimina
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
