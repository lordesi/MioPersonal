import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import BookingInviteController from '@/actions/App/Http/Controllers/BookingInviteController';
import {
    IconBadge,
    brandFilledClassName,
    brandOutlineClassName,
    darkCardClassName,
    pageColumnClassName,
    pageTitleClassName,
} from '@/components/mp/page-bits';
import { Spinner } from '@/components/ui/spinner';
import { perPersonLabel } from '@/lib/booking';
import {
    formatDateLong,
    formatHours,
    formatPrice,
    formatTimeRange,
} from '@/lib/format';
import { cn } from '@/lib/utils';
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
 * "Invita un amico": the page of the link the booker shares, in the dark
 * design. The friend sees the session and the share, signs in and joins
 * with "Partecipo".
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
        <div
            className={cn(
                pageColumnClassName,
                'max-w-176 gap-6 pb-16 md:gap-8 md:pb-24',
            )}
        >
            <Head title={seo.title} />

            <section
                aria-labelledby="invite-title"
                className="flex flex-col gap-6 md:gap-8"
            >
                <div className="flex flex-col gap-3">
                    <span className="text-[13px] font-semibold tracking-[0.08em] text-brand uppercase">
                        Invito a una seduta
                    </span>
                    <h1 id="invite-title" className={pageTitleClassName}>
                        {invite.bookerFirstName} ti invita ad allenarvi insieme
                    </h1>
                    <p className="text-[17px] text-muted-foreground md:text-xl">
                        {invite.serviceName} con{' '}
                        <Link
                            href={invite.trainerHref}
                            className="font-semibold text-brand hover:underline"
                        >
                            {invite.trainerName}
                        </Link>
                    </p>
                </div>

                <ul
                    className={cn(
                        darkCardClassName,
                        'flex flex-col gap-4 p-5 md:gap-5 md:p-7',
                    )}
                >
                    <Row icon={CalendarDays}>
                        <span className="tabular-nums">
                            {formatDateLong(invite.start)},{' '}
                            {formatTimeRange(invite.start, invite.hours)} (
                            {formatHours(invite.hours)})
                        </span>
                        <span className="text-[13px] font-normal text-muted-foreground md:text-[15px]">
                            {invite.confirmed
                                ? 'Confermata dal trainer'
                                : 'In attesa della conferma del trainer'}
                        </span>
                    </Row>
                    {invite.placeLabel && (
                        <Row icon={MapPin}>{invite.placeLabel}</Row>
                    )}
                    <Row icon={Users}>
                        <span className="tabular-nums">
                            {invite.people} persone ·{' '}
                            {perPersonLabel(invite.priceCents, invite.people)}
                        </span>
                        <span className="text-[13px] font-normal text-muted-foreground md:text-[15px]">
                            Totale {formatPrice(invite.priceCents)}, da pagare
                            al trainer. Nessun pagamento online.
                        </span>
                    </Row>
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

function Row({
    icon,
    children,
}: {
    icon: typeof CalendarDays;
    children: ReactNode;
}) {
    return (
        <li className="flex items-center gap-3 md:gap-4">
            <IconBadge icon={icon} />
            <span className="flex min-w-0 flex-col gap-0.5 text-[15px] font-semibold md:text-[17px]">
                {children}
            </span>
        </li>
    );
}

/** Full width on phones, as wide as the text on desktop. */
const mainButton = cn(
    brandFilledClassName,
    'w-full gap-2 md:w-auto md:self-start',
);

/** The line under the button: centered on phones, on the left on desktop. */
const hintClassName =
    'text-center text-[13px] text-muted-foreground md:text-left md:text-[15px]';

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
                <div className="flex flex-col gap-2.5">
                    <button
                        type="button"
                        className={mainButton}
                        disabled={joining}
                        onClick={onJoin}
                    >
                        {joining && <Spinner />}
                        Partecipo
                    </button>
                    <p className={hintClassName}>
                        {seats}. Riceverai conferma e promemoria della seduta.
                    </p>
                </div>
            );
        case 'login':
            return (
                <div className="flex flex-col gap-2.5">
                    <Link
                        href={BookingInviteController.start.url(token)}
                        className={mainButton}
                    >
                        Accedi o registrati per partecipare
                    </Link>
                    <p className={hintClassName}>
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
            className="flex flex-col items-stretch gap-4 rounded-[20px] p-5 shadow-[inset_0_0_0_1px_var(--brand)] md:flex-row md:items-center md:justify-between md:p-6"
        >
            <p className="text-[15px] md:text-[17px]">{text}</p>
            {action && (
                <Link
                    href={bookings()}
                    className={cn(brandOutlineClassName, 'shrink-0')}
                >
                    Vai alle mie prenotazioni
                </Link>
            )}
        </div>
    );
}
