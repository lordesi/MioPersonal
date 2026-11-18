import { Link, router } from '@inertiajs/react';
import { MessageCircle, Phone } from 'lucide-react';
import { OffAppInvite } from '@/components/trainer/area/calendar-side';
import SessionChangeActions from '@/components/trainer/area/session-change-actions';
import {
    brandButtonClassName,
    outlineButtonClassName,
} from '@/components/trainer/ui/styles';
import CallAction from '@/components/trainer/ui/call-action';
import type { CalendarItem } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { clients, requests } from '@/routes/trainer';
import { destroy } from '@/routes/trainer/calendar/sessions';

/**
 * What can be done with a session of the calendar: write, call, open the
 * client's card, move or cancel it. A request waiting for the trainer goes
 * to "Richieste"; a session proposed by the trainer can be taken back;
 * someone without an account gets the invite to Miopersonal.
 */
export default function SessionActions({
    item,
    onClosed,
}: {
    item: CalendarItem;
    /** After "Ritira proposta": the session is gone. */
    onClosed?: () => void;
}) {
    const confirmed = item.kind === 'confirmed';
    const over = new Date(item.end).getTime() <= Date.now();

    return (
        <div className="flex flex-col gap-3">
            {!confirmed && (
                <p className="text-[13px] leading-4.5 text-muted-foreground">
                    {item.fromTrainer
                        ? `Hai proposto questa seduta: aspetti che ${item.title} accetti. L’orario resta occupato fino ad allora.`
                        : 'Il cliente aspetta la tua risposta.'}
                </p>
            )}

            {confirmed && (
                <div className="flex flex-wrap gap-2">
                    {item.clientId !== null && !over && (
                        <Link
                            href={clients.url({
                                query: { cliente: item.clientId, chat: 1 },
                            })}
                            aria-label={`Scrivi a ${item.title}`}
                            className={outlineButtonClassName}
                        >
                            <MessageCircle
                                aria-hidden="true"
                                className="size-4.5"
                            />
                            Scrivi
                        </Link>
                    )}
                    {item.phone && !over && (
                        <CallAction
                            phone={item.phone}
                            name={item.title}
                            className={outlineButtonClassName}
                        >
                            {(label) => (
                                <>
                                    <Phone
                                        aria-hidden="true"
                                        className="size-4.5"
                                    />
                                    {label}
                                </>
                            )}
                        </CallAction>
                    )}
                    {item.clientId !== null && (
                        <Link
                            href={clients.url({
                                query: { cliente: item.clientId },
                            })}
                            className={brandButtonClassName}
                        >
                            Apri scheda
                        </Link>
                    )}
                </div>
            )}

            {confirmed && item.canChange && (
                <SessionChangeActions
                    key={item.id}
                    id={item.id}
                    start={item.start}
                    end={item.end}
                    clientName={item.title}
                    proposedStart={item.proposedStart}
                    offApp={item.offApp}
                />
            )}

            {!confirmed && !item.fromTrainer && (
                <Link
                    href={requests()}
                    className={cn(brandButtonClassName, 'self-start')}
                >
                    Rispondi alla richiesta
                </Link>
            )}
            {!confirmed && item.fromTrainer && (
                <button
                    type="button"
                    onClick={() =>
                        router.delete(destroy.url(item.id), {
                            preserveScroll: true,
                            onSuccess: onClosed,
                        })
                    }
                    className={cn(outlineButtonClassName, 'self-start')}
                >
                    Ritira proposta
                </button>
            )}

            {item.offApp && item.inviteLink && (
                <OffAppInvite name={item.title} link={item.inviteLink} />
            )}
        </div>
    );
}
