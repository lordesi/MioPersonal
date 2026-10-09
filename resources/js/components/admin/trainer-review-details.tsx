import { Link } from '@inertiajs/react';
import { useId } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import AdminPanel from '@/components/admin/admin-panel';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { trainerStatuses } from '@/lib/admin';
import { formatAgo, formatPrice } from '@/lib/format';
import type { TrainerReviewStatus, TrainerUnderReview } from '@/types';

type HeaderProps = {
    trainer: TrainerUnderReview;
    status: TrainerReviewStatus;
};

/** Name, status and "Anteprima profilo pubblico", plus the automatic warnings. */
export function TrainerReviewHeader({ trainer, status }: HeaderProps) {
    const style = trainerStatuses[status];
    const since = `${trainer.status === 'changes' ? 'Modifiche richieste' : 'Inviato'} ${formatAgo(trainer.statusSince)}`;

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 rounded-[14px] border bg-card p-5">
                <UserAvatar
                    name={trainer.name}
                    size="xl"
                    className="size-18 text-[22px] text-muted-foreground"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-[22px] leading-7 font-bold tracking-tight">
                            {trainer.name}
                        </h2>
                        <AdminBadge variant={style.variant}>
                            {style.label}
                        </AdminBadge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {trainer.disciplines.join(', ')} · {trainer.zone} ·{' '}
                        {since}
                    </span>
                </div>
                <Button asChild variant="outline" className="h-9">
                    <Link href={trainer.profileHref}>
                        Anteprima profilo pubblico
                    </Link>
                </Button>
            </div>

            {trainer.warnings.length > 0 && (
                <div
                    role="alert"
                    className="flex flex-wrap gap-2.5 rounded-xl border-[1.5px] border-foreground px-3.5 py-3 text-sm"
                >
                    <strong>Da controllare:</strong>
                    {trainer.warnings.map((warning) => (
                        <span key={warning}>{warning}</span>
                    ))}
                </div>
            )}
        </>
    );
}

/** What the trainer sent: profile, certificates and the team's notes. */
export function TrainerReviewDetails({
    trainer,
}: {
    trainer: TrainerUnderReview;
}) {
    const notesId = useId();
    const certificates = trainer.certifications.length;
    const documents = [
        trainer.hasIdentityDocument
            ? 'Carta d’identità'
            : 'Documento d’identità mancante',
        certificates === 1 ? '1 attestato' : `${certificates} attestati`,
    ].join(' · ');

    const rows = [
        { label: 'Presentazione', value: trainer.bio },
        { label: 'Luoghi', value: trainer.places.join(' · ') },
        {
            label: 'Servizi e prezzi',
            value: trainer.services
                .map(
                    (service) =>
                        `${service.label} ${formatPrice(service.priceCents)}`,
                )
                .join(' · '),
        },
        { label: 'Orari', value: `${trainer.weeklyHours} ore a settimana` },
        { label: 'Documenti', value: documents },
    ];

    return (
        <div className="flex flex-col gap-4">
            <AdminPanel title="Profilo inviato" className="gap-3.5">
                <dl className="grid gap-x-4 gap-y-2.5 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
                    {rows.map((row) => (
                        <div key={row.label} className="contents">
                            <dt className="text-muted-foreground">
                                {row.label}
                            </dt>
                            <dd className="tabular-nums">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            </AdminPanel>

            <AdminPanel title="Certificazioni e attestati" className="gap-2.5">
                {certificates === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nessun attestato caricato.
                    </p>
                ) : (
                    trainer.certifications.map((certification) => (
                        <div
                            key={certification.title}
                            className="flex items-center gap-3 rounded-[10px] bg-muted px-3 py-2.5"
                        >
                            <span className="flex flex-1 flex-col">
                                <span className="text-sm font-semibold">
                                    {certification.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {certification.issuer}
                                </span>
                            </span>
                            {/* TODO: open the file with a temporary link once uploads are stored. */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="bg-background"
                            >
                                Apri attestato
                            </Button>
                        </div>
                    ))
                )}
                <p className="text-xs text-muted-foreground">
                    Gli attestati si aprono con un link temporaneo e vengono
                    cancellati dopo la decisione, come da privacy policy.
                </p>
            </AdminPanel>

            <section className="flex flex-col gap-2 rounded-[14px] border bg-card p-5">
                <label htmlFor={notesId} className="font-semibold">
                    Note interne
                </label>
                {/* TODO: save the team's notes on the server. */}
                <Textarea
                    key={trainer.id}
                    id={notesId}
                    rows={3}
                    placeholder="Visibili solo al team"
                />
            </section>
        </div>
    );
}
