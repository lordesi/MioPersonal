import { Head, Link, router } from '@inertiajs/react';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import EventCard, { EventGrid } from '@/components/events/event-card';
import PageHeading from '@/components/trainer/area/page-heading';
import Panel from '@/components/trainer/area/panel';
import { Button } from '@/components/ui/button';
import { organizerRoutes } from '@/lib/events';
import type { GroupSessionSummary, OrganizerArea } from '@/types';

export type OrganizerInvite = {
    id: number;
    from: string | null;
    /** Dates of the series with this invitation. */
    dates: number;
    event: GroupSessionSummary;
};

export type OrganizerEventsProps = {
    area: OrganizerArea;
    upcoming: GroupSessionSummary[];
    past: GroupSessionSummary[];
    invites: OrganizerInvite[];
    /** Only an approved profile publishes events. */
    approved: boolean;
};

/**
 * "Eventi" of the organizer area: the invitations to organize together, the
 * events to come and the last ones.
 */
export default function OrganizerEvents({
    area,
    upcoming,
    past,
    invites,
    approved,
}: OrganizerEventsProps) {
    const routes = organizerRoutes(area);
    const hrefOf = (event: GroupSessionSummary) => routes.show.url(event.id);
    const options = {
        preserveScroll: true,
        onError: (errors: Record<string, string>) =>
            toast.error(Object.values(errors)[0] ?? 'Riprova tra poco.'),
    };

    return (
        <>
            <Head title="Eventi" />

            <PageHeading
                title="Eventi"
                description="Workshop, open day, allenamenti di gruppo: i clienti prenotano il posto, pagano sul posto."
                action={
                    approved ? (
                        <Button asChild>
                            <Link href={routes.create.url()}>
                                <CalendarPlus aria-hidden="true" />
                                Nuovo evento
                            </Link>
                        </Button>
                    ) : undefined
                }
            />

            {!approved && (
                <p
                    role="status"
                    className="rounded-2xl bg-muted px-4 py-3 text-sm"
                >
                    Potrai creare eventi quando il tuo profilo sarà approvato.
                </p>
            )}

            {invites.length > 0 && (
                <Panel title={`Inviti a organizzare · ${invites.length}`}>
                    <ul className="flex flex-col gap-4">
                        {invites.map((invite) => (
                            <li
                                key={invite.id}
                                className="grid gap-3 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-center"
                            >
                                <EventCard event={invite.event} />
                                <div className="flex flex-col gap-3">
                                    <p className="text-sm">
                                        <strong>
                                            {invite.from ?? 'Un organizzatore'}
                                        </strong>{' '}
                                        ti invita tra gli organizzatori
                                        {invite.dates > 1
                                            ? ` di ${invite.dates} date.`
                                            : '.'}{' '}
                                        Se accetti, l’evento compare anche nel
                                        tuo profilo e vedi gli iscritti.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                router.post(
                                                    routes.invites.accept.url(
                                                        invite.id,
                                                    ),
                                                    {},
                                                    options,
                                                )
                                            }
                                        >
                                            Accetta
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                router.post(
                                                    routes.invites.decline.url(
                                                        invite.id,
                                                    ),
                                                    {},
                                                    options,
                                                )
                                            }
                                        >
                                            Rifiuta
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            <Panel title={`In programma · ${upcoming.length}`}>
                {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nessun evento in programma.
                        {approved &&
                            ' Crea il primo: es. “Open day” il sabato mattina o un workshop di mobilità.'}
                    </p>
                ) : (
                    <EventGrid events={upcoming} hrefOf={hrefOf} />
                )}
            </Panel>

            {past.length > 0 && (
                <Panel title="Passati">
                    <EventGrid events={past} hrefOf={hrefOf} />
                </Panel>
            )}
        </>
    );
}
