import { Head, setLayoutProps } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminNotice from '@/components/admin/admin-notice';
import type { ReviewCheckId } from '@/components/admin/review-decision';
import ReviewDecision from '@/components/admin/review-decision';
import {
    TrainerReviewDetails,
    TrainerReviewHeader,
} from '@/components/admin/trainer-review-details';
import VerificationQueue from '@/components/admin/verification-queue';
import EmptyState from '@/components/states/empty-state';
import type { TrainerReviewStatus, TrainerUnderReview } from '@/types';

type VerificationProps = {
    trainers: TrainerUnderReview[];
};

export default function Verification({ trainers }: VerificationProps) {
    const [selectedId, setSelectedId] = useState(trainers[0]?.id ?? 0);
    // TODO: decisions and checks only live in the page until the backend exists.
    const [decisions, setDecisions] = useState<
        Record<number, TrainerReviewStatus>
    >({});
    const [checks, setChecks] = useState<Record<number, ReviewCheckId[]>>({});
    const [notice, setNotice] = useState<string | null>(null);

    const statusOf = (trainer: TrainerUnderReview) =>
        decisions[trainer.id] ?? trainer.status;
    const reviewCount = trainers.filter(
        (trainer) => statusOf(trainer) === 'review',
    ).length;

    useEffect(() => {
        // The menu badge follows the decisions taken on this page.
        setLayoutProps({ verificationCount: reviewCount });
    }, [reviewCount]);

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

    const checked = checks[trainer.id] ?? [];

    const toggleCheck = (id: ReviewCheckId) =>
        setChecks({
            ...checks,
            [trainer.id]: checked.includes(id)
                ? checked.filter((item) => item !== id)
                : [...checked, id],
        });

    const decide = (status: 'approved' | 'changes' | 'rejected') => {
        setDecisions({ ...decisions, [trainer.id]: status });
        setNotice(
            {
                approved: `Profilo di ${trainer.name} approvato e pubblicato. Email inviata.`,
                changes: `Richiesta di modifiche inviata a ${trainer.name}.`,
                rejected: `Profilo di ${trainer.name} rifiutato. Email inviata.`,
            }[status],
        );
    };

    const undo = () => {
        const rest = { ...decisions };
        delete rest[trainer.id];
        setDecisions(rest);
        setNotice(null);
    };

    return (
        <>
            <Head title="Admin · Verifica trainer" />

            <AdminNotice message={notice} onClose={() => setNotice(null)} />

            <div className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                <VerificationQueue
                    trainers={trainers}
                    statusOf={statusOf}
                    selectedId={trainer.id}
                    onSelect={(id) => {
                        setSelectedId(id);
                        setNotice(null);
                    }}
                    reviewCount={reviewCount}
                />

                <section
                    aria-label="Scheda del trainer"
                    className="flex min-w-0 flex-col gap-4"
                >
                    <TrainerReviewHeader
                        trainer={trainer}
                        status={statusOf(trainer)}
                    />
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                        <TrainerReviewDetails trainer={trainer} />
                        <ReviewDecision
                            key={trainer.id}
                            status={statusOf(trainer)}
                            checked={checked}
                            onToggleCheck={toggleCheck}
                            onDecide={decide}
                            onUndo={undo}
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

Verification.layout = { section: 'verification' };
