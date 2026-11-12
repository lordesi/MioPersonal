import { Head, Link, router } from '@inertiajs/react';
import { Flag } from 'lucide-react';
import { useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import ChoiceChips from '@/components/shared/choice-chips';
import EmptyState from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { formatAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { resolve } from '@/routes/admin/reports';
import { users } from '@/routes/admin';
import type { AdminReport } from '@/types';

type ReportsProps = {
    reports: AdminReport[];
};

type Filter = 'open' | 'closed';

const filters: { value: Filter; label: string }[] = [
    { value: 'open', label: 'Da controllare' },
    { value: 'closed', label: 'Chiuse' },
];

const kinds: Record<AdminReport['subject']['kind'], string> = {
    trainer: 'Profilo trainer',
    gym: 'Profilo palestra',
    review: 'Recensione',
    deleted: 'Eliminato',
};

/** "Segnalazioni": what users reported with "Segnala", the oldest open first. */
export default function Reports({ reports }: ReportsProps) {
    const [filter, setFilter] = useState<Filter>('open');
    // The report being saved: its buttons wait.
    const [saving, setSaving] = useState<number | null>(null);

    const close = (
        report: AdminReport,
        resolution: 'removed' | 'dismissed',
    ) => {
        setSaving(report.id);
        router.post(
            resolve.url(report.id),
            { resolution },
            {
                preserveScroll: true,
                onFinish: () => setSaving(null),
            },
        );
    };

    if (reports.length === 0) {
        return (
            <>
                <Head title="Admin · Segnalazioni" />
                <EmptyState
                    icon={Flag}
                    title="Nessuna segnalazione"
                    description="Quando un utente segnala un profilo o una recensione, la trovi qui."
                    bordered
                />
            </>
        );
    }

    const visible = reports.filter((report) =>
        filter === 'open'
            ? report.resolution === null
            : report.resolution !== null,
    );

    return (
        <>
            <Head title="Admin · Segnalazioni" />

            <ChoiceChips
                options={filters}
                value={filter}
                onChange={setFilter}
                aria-label="Filtra le segnalazioni"
                className="gap-1.5"
            />

            <div className="grid gap-3 lg:grid-cols-2">
                {visible.map((report) => {
                    const { subject } = report;
                    const open = report.resolution === null;

                    return (
                        <article
                            key={report.id}
                            className={cn(
                                'flex flex-col gap-2.5 rounded-[14px] bg-card p-4',
                                open
                                    ? 'border-[1.5px] border-foreground'
                                    : 'border opacity-70',
                            )}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <AdminBadge className="h-6 px-2.5">
                                    {kinds[subject.kind]}
                                </AdminBadge>
                                {subject.href ? (
                                    <Link
                                        href={subject.href}
                                        className="text-[15px] font-semibold underline"
                                    >
                                        {subject.title}
                                    </Link>
                                ) : (
                                    <span className="text-[15px] font-semibold">
                                        {subject.title}
                                    </span>
                                )}
                                {subject.hidden &&
                                    subject.kind === 'review' && (
                                        <AdminBadge
                                            variant="muted"
                                            className="h-6 px-2.5"
                                        >
                                            Nascosta
                                        </AdminBadge>
                                    )}
                            </div>
                            {subject.text && (
                                <p className="rounded-lg bg-muted px-3 py-2 text-sm leading-5.25">
                                    {subject.text}
                                </p>
                            )}
                            <p className="text-sm">
                                <strong className="font-semibold">
                                    {report.reason}
                                </strong>
                                {report.details && <> · {report.details}</>}
                            </p>
                            <p className="text-[13px] text-muted-foreground">
                                Segnalato da {report.reporterName} ·{' '}
                                {formatAgo(report.createdAt)}
                                {report.resolution &&
                                    report.resolvedAt &&
                                    ` · ${report.resolution === 'removed' ? 'Chiusa' : 'Ignorata'} ${formatAgo(report.resolvedAt)}`}
                            </p>
                            {open && (
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    {subject.ownerEmail && (
                                        <Button
                                            asChild
                                            variant="link"
                                            size="sm"
                                            className="mr-auto px-0"
                                        >
                                            <Link
                                                href={users.url({
                                                    query: {
                                                        cerca: subject.ownerEmail,
                                                    },
                                                })}
                                            >
                                                Apri in Utenti
                                            </Link>
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={saving === report.id}
                                        onClick={() =>
                                            close(report, 'dismissed')
                                        }
                                    >
                                        Ignora
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={saving === report.id}
                                        onClick={() => close(report, 'removed')}
                                    >
                                        {subject.kind === 'review'
                                            ? 'Nascondi recensione'
                                            : 'Segna come gestita'}
                                    </Button>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>

            {visible.length === 0 && (
                <p className="rounded-[14px] border bg-card p-6 text-center text-muted-foreground">
                    {filter === 'open'
                        ? 'Nessuna segnalazione da controllare.'
                        : 'Nessuna segnalazione chiusa.'}
                </p>
            )}
        </>
    );
}

Reports.layout = { section: 'reports' };
