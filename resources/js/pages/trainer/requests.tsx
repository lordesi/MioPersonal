import { Head, Link } from '@inertiajs/react';
import { Check, ChevronLeft } from 'lucide-react';
import { useId, useState } from 'react';
import HandledRequests from '@/components/trainer/area/handled-requests';
import RequestCard from '@/components/trainer/home/request-card';
import { useRequestAnswer } from '@/components/trainer/home/use-request-answer';
import { CountChip } from '@/components/trainer/ui/bits';
import {
    pageTitleClassName,
    roundOutlineClassName,
} from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import { today } from '@/routes/trainer';
import type { TrainerBookingRequest, TrainerHandledRequest } from '@/types';

type RequestsProps = {
    /** Waiting for an answer, the ones expiring first on top. */
    requests: TrainerBookingRequest[];
    /** Answered or expired in the last 30 days, the latest on top. */
    handled: TrainerHandledRequest[];
    /** Off: "Gestite" suggests it when requests expired without an answer. */
    autoConfirm: boolean;
};

type Tab = 'pending' | 'done';

/**
 * "Richieste": every request waiting for an answer and the ones already
 * answered ("Gestite"). "Home" shows the same requests; the notifications of
 * a new request open this page.
 */
export default function Requests({
    requests,
    handled,
    autoConfirm,
}: RequestsProps) {
    const listId = useId();
    const [tab, setTab] = useState<Tab>(
        requests.length === 0 && handled.length > 0 ? 'done' : 'pending',
    );
    const { busyId, answer } = useRequestAnswer(['requests', 'handled']);

    const tabs: { value: Tab; label: string; count: number }[] = [
        { value: 'pending', label: 'Da confermare', count: requests.length },
        { value: 'done', label: 'Gestite', count: handled.length },
    ];

    return (
        <div className="flex max-w-260 flex-col gap-5">
            <Head title="Richieste" />

            <header className="flex flex-wrap items-center gap-3">
                <Link
                    href={today()}
                    aria-label="Torna alla Home"
                    className={roundOutlineClassName}
                >
                    <ChevronLeft aria-hidden="true" className="size-5.5" />
                </Link>
                <h1 className={cn(pageTitleClassName, 'mr-auto')}>Richieste</h1>
                <div
                    role="tablist"
                    aria-label="Filtra richieste"
                    className="grid grid-cols-2 rounded-full bg-card p-1"
                >
                    {tabs.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.value}
                            aria-controls={listId}
                            onClick={() => setTab(item.value)}
                            className={cn(
                                'flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                tab === item.value
                                    ? 'bg-foreground text-background'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {item.label}
                            <span className="tabular-nums">{item.count}</span>
                        </button>
                    ))}
                </div>
            </header>

            <div id={listId} role="tabpanel" className="flex flex-col gap-3">
                {tab === 'pending' &&
                    (requests.length === 0 ? (
                        <div
                            role="status"
                            className="flex flex-col items-center gap-2.5 rounded-[26px] bg-[#121212] px-6 py-14 text-center shadow-[inset_0_0_0_1px_#2c2c2c]"
                        >
                            <span className="flex size-13 items-center justify-center rounded-full bg-brand-soft text-brand">
                                <Check
                                    aria-hidden="true"
                                    className="size-6"
                                    strokeWidth={2.5}
                                />
                            </span>
                            <span className="text-lg font-semibold">
                                Non hai richieste in attesa
                            </span>
                            <span className="max-w-105 text-[15px] text-muted-foreground">
                                Quando un cliente chiede una seduta la trovi qui
                                e in Home.
                            </span>
                        </div>
                    ) : (
                        <>
                            <span className="flex items-center gap-2 text-[15px] text-muted-foreground">
                                <CountChip
                                    count={requests.length}
                                    tone="brand"
                                />
                                Rispondi entro la scadenza: dopo, lo slot torna
                                libero.
                            </span>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
                                {requests.map((request) => (
                                    <RequestCard
                                        key={request.id}
                                        request={request}
                                        busy={busyId !== null}
                                        onConfirm={(weekly) =>
                                            answer(request, 'confirmed', weekly)
                                        }
                                        onDecline={() =>
                                            answer(request, 'declined')
                                        }
                                    />
                                ))}
                            </div>
                        </>
                    ))}

                {tab === 'done' && (
                    <HandledRequests
                        handled={handled}
                        autoConfirm={autoConfirm}
                    />
                )}
            </div>
        </div>
    );
}

Requests.layout = { section: 'requests' };
