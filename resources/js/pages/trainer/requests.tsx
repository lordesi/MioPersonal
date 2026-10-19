import { Head, router, setLayoutProps } from '@inertiajs/react';
import { Inbox } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmptyState from '@/components/states/empty-state';
import PageHeading from '@/components/trainer/area/page-heading';
import type { RequestAnswer } from '@/components/trainer/dashboard/booking-request-card';
import BookingRequestCard from '@/components/trainer/dashboard/booking-request-card';
import { accept, decline } from '@/routes/trainer/requests';
import type { TrainerBookingRequest } from '@/types';

type RequestsProps = {
    /** Waiting for an answer, the ones expiring first on top. */
    requests: TrainerBookingRequest[];
};

/** "Richieste": confirm or decline the bookings waiting for an answer. */
export default function Requests({ requests }: RequestsProps) {
    // The answers given on this page: the card shows them until the next visit.
    const [answers, setAnswers] = useState<Record<number, RequestAnswer>>({});

    const pendingCount = requests.filter(
        (request) => (answers[request.id] ?? 'pending') === 'pending',
    ).length;

    useEffect(() => {
        // The badge in the menu follows the answers given on this page.
        setLayoutProps({ pendingCount });
    }, [pendingCount]);

    const answer = (
        request: TrainerBookingRequest,
        value: Exclude<RequestAnswer, 'pending'>,
    ) => {
        const action = value === 'confirmed' ? accept : decline;

        router.post(
            action.url(request.id),
            {},
            {
                preserveScroll: true,
                // The answered card stays on the page with its message.
                only: ['trainerArea'],
                onSuccess: () =>
                    setAnswers((current) => ({
                        ...current,
                        [request.id]: value,
                    })),
                // Expired or cancelled meanwhile: say it and show the real list.
                onError: (errors) => {
                    toast.error(errors.booking ?? 'Riprova tra poco.');
                    router.reload({ only: ['requests', 'trainerArea'] });
                },
            },
        );
    };

    return (
        <>
            <Head title="Richieste" />

            <PageHeading
                title="Richieste"
                description="Lo slot resta bloccato per il cliente finché non rispondi, al massimo 24 ore."
            />

            {requests.length === 0 ? (
                <EmptyState
                    icon={Inbox}
                    title="Nessuna richiesta da confermare"
                    description="Quando un cliente chiede una seduta la trovi qui."
                    bordered
                    className="rounded-[20px] bg-card"
                />
            ) : (
                <div className="flex max-w-3xl flex-col gap-3">
                    {requests.map((request) => (
                        <BookingRequestCard
                            key={request.id}
                            request={request}
                            answer={answers[request.id] ?? 'pending'}
                            onAnswer={(value) => answer(request, value)}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

Requests.layout = { section: 'requests' };
