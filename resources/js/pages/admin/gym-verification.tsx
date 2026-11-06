import { Head, Link, router } from '@inertiajs/react';
import { Building2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import AdminNotice from '@/components/admin/admin-notice';
import AdminPanel from '@/components/admin/admin-panel';
import type { ReviewDecisionPayload } from '@/components/admin/review-decision';
import ReviewDecision from '@/components/admin/review-decision';
import EmptyState from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { daysSince, formatWait, trainerStatuses } from '@/lib/admin';
import { formatAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { decide } from '@/routes/admin/gym-verification';
import type { TrainerReviewStatus } from '@/types';

type GymUnderReview = {
    id: number;
    name: string;
    owner: string;
    email: string;
    city: string;
    address: string;
    status: TrainerReviewStatus;
    statusSince: string;
    description: string;
    amenities: string[];
    hours: string[];
    coverUrl: string | null;
    photos: string[];
    contacts: string[];
    warnings: string[];
    internalNote: string | null;
    profileHref: string;
};

const changeReasons = [
    'Foto non adatte o di bassa qualità',
    'Indirizzo non verificabile',
    'Descrizione con contatti o link',
    'Orari mancanti o poco chiari',
    'Non sembra una palestra',
];

/** "Verifica palestre": the gyms waiting for the team, oldest first. */
export default function GymVerification({ gyms }: { gyms: GymUnderReview[] }) {
    const [selectedId, setSelectedId] = useState(gyms[0]?.id ?? 0);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [notice, setNotice] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const gym = gyms.find((item) => item.id === selectedId);
    const reviewCount = gyms.filter((item) => item.status === 'review').length;

    if (!gym) {
        return (
            <>
                <Head title="Admin · Verifica palestre" />
                <EmptyState
                    icon={Building2}
                    title="Nessuna palestra da verificare"
                    description="Quando una palestra invia il profilo, la trovi qui."
                    bordered
                />
            </>
        );
    }

    const note = notes[gym.id] ?? gym.internalNote ?? '';

    const send = (
        decision: ReviewDecisionPayload['decision'] | 'undone',
        payload: Omit<ReviewDecisionPayload, 'decision'>,
        success: string | null,
    ) =>
        router.post(
            decide.url(gym.id),
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

    const status = trainerStatuses[gym.status];

    return (
        <>
            <Head title="Admin · Verifica palestre" />

            <AdminNotice message={notice} onClose={() => setNotice(null)} />

            <div className="grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <section
                    aria-label="Palestre in attesa"
                    className="overflow-hidden rounded-[14px] border bg-card"
                >
                    <h2 className="border-b p-3.5 text-[15px] font-semibold tabular-nums">
                        In attesa · {reviewCount}
                    </h2>
                    <ul>
                        {gyms.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    aria-current={
                                        item.id === gym.id ? 'true' : undefined
                                    }
                                    onClick={() => {
                                        setSelectedId(item.id);
                                        setNotice(null);
                                        setError(undefined);
                                    }}
                                    className={cn(
                                        'flex w-full items-center gap-3 border-b px-3.5 py-3 text-left',
                                        item.id === gym.id
                                            ? 'bg-secondary shadow-[inset_3px_0_0_0] shadow-foreground'
                                            : 'hover:bg-accent',
                                    )}
                                >
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="truncate text-sm font-semibold">
                                            {item.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.city}
                                        </span>
                                        <span className="flex flex-wrap gap-1 pt-1">
                                            <AdminBadge
                                                variant={
                                                    trainerStatuses[item.status]
                                                        .variant
                                                }
                                            >
                                                {
                                                    trainerStatuses[item.status]
                                                        .label
                                                }
                                            </AdminBadge>
                                            {item.warnings.length > 0 && (
                                                <AdminBadge variant="muted">
                                                    <TriangleAlert
                                                        aria-hidden="true"
                                                        className="size-3"
                                                    />
                                                    {item.warnings.length}
                                                </AdminBadge>
                                            )}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-xs font-semibold tabular-nums">
                                        {formatWait(
                                            daysSince(item.statusSince),
                                        )}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section
                    aria-label="Scheda della palestra"
                    className="flex min-w-0 flex-col gap-4"
                >
                    <div className="flex flex-wrap items-center gap-4 rounded-[14px] border bg-card p-5">
                        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h2 className="text-[22px] leading-7 font-bold tracking-tight">
                                    {gym.name}
                                </h2>
                                <AdminBadge variant={status.variant}>
                                    {status.label}
                                </AdminBadge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {gym.address} · {gym.owner} ({gym.email}) ·
                                Inviato {formatAgo(gym.statusSince)}
                            </span>
                        </div>
                        <Button asChild variant="outline" className="h-9">
                            <Link href={gym.profileHref}>
                                Anteprima profilo pubblico
                            </Link>
                        </Button>
                    </div>

                    {gym.warnings.length > 0 && (
                        <ul className="flex flex-col gap-1.5 rounded-[14px] border border-dashed bg-card p-4 text-sm">
                            {gym.warnings.map((warning) => (
                                <li
                                    key={warning}
                                    className="flex items-center gap-2"
                                >
                                    <TriangleAlert
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    {warning}
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                        <div className="flex min-w-0 flex-col gap-4">
                            {(gym.coverUrl || gym.photos.length > 0) && (
                                <AdminPanel title="Foto">
                                    <div className="grid grid-cols-3 gap-2">
                                        {[gym.coverUrl, ...gym.photos]
                                            .filter(
                                                (url): url is string =>
                                                    url !== null,
                                            )
                                            .map((url, index) => (
                                                <a
                                                    key={url}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener"
                                                    className={cn(
                                                        index === 0 &&
                                                            'col-span-3',
                                                    )}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={
                                                            index === 0
                                                                ? 'Copertina'
                                                                : `Foto ${index}`
                                                        }
                                                        className="aspect-video w-full rounded-lg object-cover"
                                                    />
                                                </a>
                                            ))}
                                    </div>
                                </AdminPanel>
                            )}
                            <AdminPanel title="Descrizione">
                                <p className="text-sm whitespace-pre-line">
                                    {gym.description}
                                </p>
                            </AdminPanel>
                            <AdminPanel title="Servizi e orari">
                                <p className="text-sm">
                                    {gym.amenities.join(', ')}
                                </p>
                                <ul className="text-sm text-muted-foreground">
                                    {gym.hours.map((line) => (
                                        <li key={line}>{line}</li>
                                    ))}
                                </ul>
                            </AdminPanel>
                            <AdminPanel title="Contatti pubblici">
                                <p className="text-sm">
                                    {gym.contacts.join(' · ') || 'Nessuno'}
                                </p>
                            </AdminPanel>
                            <AdminPanel title="Note interne">
                                <Textarea
                                    aria-label="Note interne"
                                    rows={3}
                                    value={note}
                                    onChange={(event) =>
                                        setNotes({
                                            ...notes,
                                            [gym.id]: event.target.value,
                                        })
                                    }
                                />
                            </AdminPanel>
                        </div>
                        <ReviewDecision
                            key={`${gym.id}-${gym.status}`}
                            status={gym.status}
                            reasons={changeReasons}
                            subject="la palestra"
                            onDecide={({ decision, ...payload }) =>
                                send(
                                    decision,
                                    payload,
                                    {
                                        approved: `${gym.name} approvata e pubblicata. Email inviata.`,
                                        changes: `Richiesta di modifiche inviata a ${gym.name}.`,
                                        rejected: `${gym.name} rifiutata. Email inviata.`,
                                    }[decision],
                                )
                            }
                            onUndo={() =>
                                send(
                                    'undone',
                                    { reasons: [], message: '' },
                                    null,
                                )
                            }
                            processing={processing}
                            error={error}
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

GymVerification.layout = { section: 'gym-verification' };
