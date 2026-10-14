import { Head, router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import AdminVerificationController from '@/actions/App/Http/Controllers/Admin/AdminVerificationController';
import AdminNotice from '@/components/admin/admin-notice';
import type { ReviewDecisionPayload } from '@/components/admin/review-decision';
import ReviewDecision from '@/components/admin/review-decision';
import {
    TrainerReviewDetails,
    TrainerReviewHeader,
} from '@/components/admin/trainer-review-details';
import VerificationQueue from '@/components/admin/verification-queue';
import EmptyState from '@/components/states/empty-state';
import type { TrainerUnderReview } from '@/types';

type VerificationProps = {
    /** Waiting for the team, plus the ones decided in the last 24 hours. */
    trainers: TrainerUnderReview[];
};

export default function Verification({ trainers }: VerificationProps) {
    const [selectedId, setSelectedId] = useState(trainers[0]?.id ?? 0);
    // "Note interne" being written, by trainer.
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [notice, setNotice] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const reviewCount = trainers.filter(
        (trainer) => trainer.status === 'review',
    ).length;

    const trainer = trainers.find((item) => item.id === selectedId);

    if (!trainer) {
        return (
            <>
                <Head title="Admin · Verifica trainer" />
                <EmptyState
                    icon={ShieldCheck}
                    title="Nessun profilo da verificare"
                    description="Quando un trainer invia il profilo, lo trovi qui."
                    bordered
                />
            </>
        );
    }

    const note = notes[trainer.id] ?? trainer.internalNote ?? '';

    const send = (
        decision: ReviewDecisionPayload['decision'] | 'undone',
        payload: Omit<ReviewDecisionPayload, 'decision'>,
        success: string | null,
    ) =>
        router.post(
            AdminVerificationController.decide.url(trainer.id),
            { decision, ...payload, internal_note: note },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setNotice(success);
                    setError(undefined);
                },
                onError: (errors) =>
                    setError(errors.message ?? errors.decision),
            },
        );

    const decide = ({ decision, ...payload }: ReviewDecisionPayload) =>
        send(
            decision,
            payload,
            {
                approved: `Profilo di ${trainer.name} approvato e pubblicato. Email inviata.`,
                changes: `Richiesta di modifiche inviata a ${trainer.name}.`,
                rejected: `Profilo di ${trainer.name} rifiutato. Email inviata.`,
            }[decision],
        );

    const undo = () => send('undone', { reasons: [], message: '' }, null);

    return (
        <>
            <Head title="Admin · Verifica trainer" />

            <AdminNotice message={notice} onClose={() => setNotice(null)} />

            <div className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                <VerificationQueue
                    trainers={trainers}
                    statusOf={(item) => item.status}
                    selectedId={trainer.id}
                    onSelect={(id) => {
                        setSelectedId(id);
                        setNotice(null);
                        setError(undefined);
                    }}
                    reviewCount={reviewCount}
                />

                <section
                    aria-label="Scheda del trainer"
                    className="flex min-w-0 flex-col gap-4"
                >
                    <TrainerReviewHeader
                        trainer={trainer}
                        status={trainer.status}
                    />
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                        <TrainerReviewDetails
                            trainer={trainer}
                            note={note}
                            onNoteChange={(value) =>
                                setNotes({ ...notes, [trainer.id]: value })
                            }
                        />
                        <ReviewDecision
                            key={`${trainer.id}-${trainer.status}`}
                            status={trainer.status}
                            onDecide={decide}
                            onUndo={undo}
                            processing={processing}
                            error={error}
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

Verification.layout = { section: 'verification' };
