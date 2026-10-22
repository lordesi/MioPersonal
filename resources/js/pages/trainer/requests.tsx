import { Head, router } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import HandledRequests from '@/components/trainer/area/handled-requests';
import PageHeading from '@/components/trainer/area/page-heading';
import RequestCard from '@/components/trainer/area/request-card';
import SegmentedTabs from '@/components/trainer/area/segmented-tabs';
import { accept, decline } from '@/routes/trainer/requests';
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

/** "Richieste": confirm or decline the bookings waiting for an answer. */
export default function Requests({
    requests,
    handled,
    autoConfirm,
}: RequestsProps) {
    const listId = useId();
    const [tab, setTab] = useState<Tab>('pending');
    // The request whose answer is being saved.
    const [busyId, setBusyId] = useState<number | null>(null);

    const answer = (
        request: TrainerBookingRequest,
        value: 'confirmed' | 'declined',
    ) => {
        const action = value === 'confirmed' ? accept : decline;

        router.post(
            action.url(request.id),
            {},
            {
                preserveScroll: true,
                // The request moves to "Gestite"; the badge of the menu follows.
                only: ['requests', 'handled', 'trainerArea'],
                onStart: () => setBusyId(request.id),
                onFinish: () => setBusyId(null),
                onSuccess: () =>
                    toast.success(
                        value === 'confirmed'
                            ? `Confermata: ${request.clientName} riceve i tuoi contatti.`
                            : 'Rifiutata: lo slot è di nuovo libero.',
                    ),
                // Expired or cancelled meanwhile: say it and show the real list.
                onError: (errors) => {
                    toast.error(errors.booking ?? 'Riprova tra poco.');
                    router.reload({
                        only: ['requests', 'handled', 'trainerArea'],
                    });
                },
            },
        );
    };

    return (
        <>
            <Head title="Richieste" />

            <PageHeading
                title="Richieste"
                action={
                    <SegmentedTabs
                        label="Filtra richieste"
                        controls={listId}
                        value={tab}
                        onChange={setTab}
                        tabs={[
                            {
                                value: 'pending',
                                label: 'In attesa',
                                count: requests.length,
                            },
                            {
                                value: 'done',
                                label: 'Gestite',
                                count: handled.length,
                            },
                        ]}
                    />
                }
            />

            <div id={listId} role="tabpanel" className="flex flex-col gap-3.5">
                {tab === 'pending' &&
                    (requests.length === 0 ? (
                        <div
                            role="status"
                            className="flex flex-col items-center gap-2.5 rounded-3xl border bg-card px-6 py-14 text-center"
                        >
                            <span className="flex size-13 items-center justify-center rounded-2xl bg-sidebar text-sidebar-foreground">
                                <Check
                                    aria-hidden="true"
                                    className="size-6"
                                    strokeWidth={2.5}
                                />
                            </span>
                            <span className="text-lg leading-6.5 font-semibold">
                                Non hai richieste in attesa
                            </span>
                            <span className="max-w-105 text-sm text-foreground/70">
                                Quando un cliente chiede una seduta la trovi
                                qui.
                            </span>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                busy={busyId !== null}
                                onConfirm={() => answer(request, 'confirmed')}
                                onDecline={() => answer(request, 'declined')}
                            />
                        ))
                    ))}

                {tab === 'done' && (
                    <HandledRequests
                        handled={handled}
                        autoConfirm={autoConfirm}
                    />
                )}
            </div>
        </>
    );
}

Requests.layout = { section: 'requests' };
