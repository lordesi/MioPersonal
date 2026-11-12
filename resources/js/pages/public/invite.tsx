import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import BookingInviteController from '@/actions/App/Http/Controllers/BookingInviteController';
import { Button } from '@/components/ui/button';
import { perPersonLabel } from '@/lib/booking';
import {
    formatDateLong,
    formatHours,
    formatPrice,
    formatTimeRange,
} from '@/lib/format';
import { bookings } from '@/routes/client';
import type { SeoData } from '@/types';

type InviteState =
    | 'can-join'
    | 'login'
    | 'booker'
    | 'trainer'
    | 'joined'
    | 'full'
    | 'closed';

type InviteProps = {
    seo: SeoData;
    token: string;
    invite: {
        bookerFirstName: string;
        trainerName: string;
        trainerHref: string;
        serviceName: string;
        /** ISO UTC string. */
        start: string;
        hours: number;
        placeLabel: string;
        people: number;
        /** The total for all the people. */
        priceCents: number;
        freeSeats: number;
        /** Else still waiting for the trainer's answer. */
        confirmed: boolean;
    };
    state: InviteState;
};

/**
 * "Invita un amico": the page of the link the booker shares. The friend
 * sees the session and the share, signs in and joins with "Partecipo".
 */
export default function Invite({ seo, token, invite, state }: InviteProps) {
    const [joining, setJoining] = useState(false);

    const join = () =>
        router.post(
            BookingInviteController.join.url(token),
            {},
            {
                preserveScroll: true,
                onStart: () => setJoining(true),
                onFinish: () => setJoining(false),
                onError: (errors) =>
                    toast.error(errors.invite ?? 'Riprova tra poco.'),
            },
        );

    return (
        <div className="mx-auto flex w-full max-w-160 flex-col gap-5 px-4 pt-6 pb-12 md:px-8 md:pt-12">
            <Head title={seo.title} />

            <section
                aria-labelledby="invite-title"
                className="flex flex-col gap-5 rounded-3xl bg-primary p-5.5 text-primary-foreground md:p-8"
            >
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold tracking-[0.08em] text-primary-foreground/60 uppercase">
                        Invito a una seduta
                    </span>
                    <h1
                        id="invite-title"
                        className="text-[28px] leading-8.5 font-bold tracking-[-0.03em] md:text-4xl md:leading-11"
                    >
                        {invite.bookerFirstName} ti invita ad allenarvi insieme
                    </h1>
                    <p className="text-primary-foreground/80">
                        {invite.serviceName} con{' '}
                        <Link
                            href={invite.trainerHref}
                            className="font-semibold underline underline-offset-4"
                        >
                            {invite.trainerName}
                        </Link>
                    </p>
                </div>

                <ul className="flex flex-col gap-3 text-[15px]">
                    <li className="flex gap-3">
                        <CalendarDays
                            aria-hidden="true"
                            className="size-5 flex-none"
                        />
                        <span className="tabular-nums">
                            {formatDateLong(invite.start)},{' '}
                            {formatTimeRange(invite.start, invite.hours)} (
                            {formatHours(invite.hours)})
                            <span className="block text-sm text-primary-foreground/60">
                                {invite.confirmed
                                    ? 'Confermata dal trainer'
                                    : 'In attesa della conferma del trainer'}
                            </span>
                        </span>
                    </li>
                    {invite.placeLabel && (
                        <li className="flex gap-3">
                            <MapPin
                                aria-hidden="true"
                                className="size-5 flex-none"
                            />
                            {invite.placeLabel}
                        </li>
                    )}
                    <li className="flex gap-3">
                        <Users
                            aria-hidden="true"
                            className="size-5 flex-none"
                        />
                        <span className="tabular-nums">
                            {invite.people} persone ·{' '}
                            {perPersonLabel(invite.priceCents, invite.people)}
                            <span className="block text-sm text-primary-foreground/60">
                                Totale {formatPrice(invite.priceCents)}, da
                                pagare al trainer. Nessun pagamento online.
                            </span>
                        </span>
                    </li>
                </ul>
            </section>

            <InviteAction
                state={state}
                token={token}
                freeSeats={invite.freeSeats}
                bookerFirstName={invite.bookerFirstName}
                joining={joining}
                onJoin={join}
            />
        </div>
    );
}

function InviteAction({
    state,
    token,
    freeSeats,
    bookerFirstName,
    joining,
    onJoin,
}: {
    state: InviteState;
    token: string;
    freeSeats: number;
    bookerFirstName: string;
    joining: boolean;
    onJoin: () => void;
}) {
    const seats =
        freeSeats === 1 ? 'Resta 1 posto' : `Restano ${freeSeats} posti`;

    switch (state) {
        case 'can-join':
            return (
                <div className="flex flex-col gap-2">
                    <Button
                        type="button"
                        className="h-12.5 rounded-[14px] text-base font-semibold"
                        disabled={joining}
                        onClick={onJoin}
                    >
                        Partecipo
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        {seats}. Riceverai conferma e promemoria della seduta.
                    </p>
                </div>
            );
        case 'login':
            return (
                <div className="flex flex-col gap-2">
                    <Button
                        asChild
                        className="h-12.5 rounded-[14px] text-base font-semibold"
                    >
                        <Link href={BookingInviteController.start.url(token)}>
                            Accedi o registrati per partecipare
                        </Link>
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        {seats}. Ci vuole un minuto, ed è gratis.
                    </p>
                </div>
            );
        case 'joined':
            return (
                <Notice
                    text="Ci sei! Trovi la seduta in Le mie prenotazioni."
                    action
                />
            );
        case 'booker':
            return (
                <Notice
                    text="Questa è la tua prenotazione: manda il link ai tuoi amici."
                    action
                />
            );
        case 'trainer':
            return <Notice text="Sei il trainer di questa seduta." />;
        case 'full':
            return (
                <Notice
                    text={`I posti sono già tutti presi. Chiedi a ${bookerFirstName} se si libera un posto.`}
                />
            );
        default:
            return (
                <Notice text="Questa seduta non accetta più partecipanti." />
            );
    }
}

function Notice({ text, action = false }: { text: string; action?: boolean }) {
    return (
        <div
            role="status"
            className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-4.5"
        >
            <p className="text-[15px]">{text}</p>
            {action && (
                <Button asChild variant="outline" className="h-11 px-4">
                    <Link href={bookings()}>Vai alle mie prenotazioni</Link>
                </Button>
            )}
        </div>
    );
}
