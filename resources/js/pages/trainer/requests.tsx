import { Head, Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useId, useState } from 'react';
import {
    CountPill,
    areaTitleClassName,
    carbCardClassName,
} from '@/components/mp/area-bits';
import HandledRequests from '@/components/trainer/area/handled-requests';
import RequestCard from '@/components/trainer/home/request-card';
import { useRequestAnswer } from '@/components/trainer/home/use-request-answer';
import { cn } from '@/lib/utils';
import { profile } from '@/routes/trainer';
import type { TrainerBookingRequest, TrainerHandledRequest } from '@/types';

type RequestsProps = {
    /** Waiting for an answer, the ones expiring first on top. */
    requests: TrainerBookingRequest[];
    /** Answered or expired in the last 30 days, the latest on top. */
    handled: TrainerHandledRequest[];
};

type Tab = 'pending' | 'done';

/**
 * "Richieste" (design "Trainer · Richieste · nuovo"): "Da confermare", with
 * Accetta and Rifiuta, and "Gestite" ("Conferma automatica" is in
 * Impostazioni). "Oggi" shows the same requests; the notifications of a new
 * request open this page.
 */
export default function Requests({ requests, handled }: RequestsProps) {
    const panelId = useId();
    const [tab, setTab] = useState<Tab>(
        requests.length === 0 && handled.length > 0 ? 'done' : 'pending',
    );
    const { busyId, answer } = useRequestAnswer(['requests', 'handled']);

    const tabs: { value: Tab; label: string; count: number }[] = [
        { value: 'pending', label: 'Da confermare', count: requests.length },
        { value: 'done', label: 'Gestite', count: 0 },
    ];

    return (
        <>
            <Head title="Richieste" />

            <div className="flex max-w-240 flex-col gap-5">
                <div className="flex flex-col gap-1">
                    <Link
                        href={profile()}
                        className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-base font-semibold text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <ChevronLeft aria-hidden="true" className="size-5" />
                        Profilo
                    </Link>
                    <h1 className={areaTitleClassName}>Richieste</h1>
                </div>

                <div
                    role="tablist"
                    aria-label="Richieste"
                    className="-mx-4 flex border-b border-separator md:mx-0"
                >
                    {tabs.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.value}
                            aria-controls={panelId}
                            onClick={() => setTab(item.value)}
                            className={cn(
                                'relative flex h-12 flex-1 items-center justify-center gap-2 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                                tab === item.value
                                    ? 'text-foreground after:absolute after:inset-x-[24%] after:-bottom-px after:h-0.75 after:rounded-t-[3px] after:bg-brand'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {item.label}
                            {item.count > 0 && (
                                <CountPill>{item.count}</CountPill>
                            )}
                        </button>
                    ))}
                </div>

                <div
                    id={panelId}
                    role="tabpanel"
                    className="flex flex-col gap-5"
                >
                    {tab === 'pending' && (
                        <>
                            {requests.length === 0 ? (
                                <div
                                    role="status"
                                    className={cn(
                                        carbCardClassName,
                                        'flex flex-col gap-1 p-6',
                                    )}
                                >
                                    <b className="text-[17px] font-semibold">
                                        Nessuna richiesta da confermare
                                    </b>
                                    <span className="text-[15px] leading-5 text-muted-foreground">
                                        Quando un cliente chiede una seduta la
                                        trovi qui e in Oggi.
                                    </span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2.5">
                                    {requests.map((request) => (
                                        <RequestCard
                                            key={request.id}
                                            request={request}
                                            busy={busyId !== null}
                                            onConfirm={(weekly) =>
                                                answer(
                                                    request,
                                                    'confirmed',
                                                    weekly,
                                                )
                                            }
                                            onDecline={() =>
                                                answer(request, 'declined')
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'done' && <HandledRequests handled={handled} />}
                </div>
            </div>
        </>
    );
}

Requests.layout = { section: 'requests' };
