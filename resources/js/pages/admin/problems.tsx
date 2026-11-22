import { Head, router } from '@inertiajs/react';
import { Bug, ImageIcon, Mail } from 'lucide-react';
import { useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import ChoiceChips from '@/components/shared/choice-chips';
import EmptyState from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { reopen, solve } from '@/routes/admin/problems';
import { formatAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminProblem } from '@/types';

type ProblemsProps = {
    problems: AdminProblem[];
};

type Filter = 'open' | 'solved' | 'all';

const filters: { value: Filter; label: string }[] = [
    { value: 'open', label: 'Da risolvere' },
    { value: 'solved', label: 'Risolti' },
    { value: 'all', label: 'Tutti' },
];

/** The answer goes by email, from the team's mailbox. */
function replyHref(problem: AdminProblem): string {
    const subject = 'Re: il problema che ci hai segnalato · MioPersonal';

    return `mailto:${problem.email}?subject=${encodeURIComponent(subject)}`;
}

/** "Problemi segnalati": what the users sent with "Segnala un problema". */
export default function Problems({ problems }: ProblemsProps) {
    const [filter, setFilter] = useState<Filter>('open');
    // The report being saved: its button waits.
    const [saving, setSaving] = useState<number | null>(null);

    const toggle = (problem: AdminProblem) => {
        setSaving(problem.id);
        router.visit(problem.solved ? reopen(problem.id) : solve(problem.id), {
            preserveScroll: true,
            onFinish: () => setSaving(null),
        });
    };

    if (problems.length === 0) {
        return (
            <>
                <Head title="Admin · Problemi segnalati" />
                <EmptyState
                    icon={Bug}
                    title="Nessun problema segnalato"
                    description="Quello che gli utenti inviano con «Segnala un problema» compare qui, e arriva anche via email."
                    bordered
                />
            </>
        );
    }

    const visible = problems.filter(
        (problem) =>
            filter === 'all' || (filter === 'solved') === problem.solved,
    );

    return (
        <>
            <Head title="Admin · Problemi segnalati" />

            <ChoiceChips
                options={filters}
                value={filter}
                onChange={setFilter}
                aria-label="Filtra i problemi"
                className="gap-1.5"
            />

            <div className="flex flex-col gap-3">
                {visible.map((problem) => (
                    <article
                        key={problem.id}
                        className={cn(
                            'flex flex-col gap-2.5 rounded-[14px] border bg-card p-4',
                            !problem.solved &&
                                'border-[1.5px] border-foreground',
                        )}
                    >
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-[15px] font-semibold">
                                {problem.name}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                {problem.email} · {formatAgo(problem.createdAt)}
                            </span>
                            {problem.solved && (
                                <AdminBadge
                                    variant="muted"
                                    className="ml-auto h-6 px-2.5"
                                >
                                    Risolto
                                </AdminBadge>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <AdminBadge className="h-6 px-2.5">
                                {problem.role}
                            </AdminBadge>
                            <AdminBadge className="h-6 px-2.5">
                                {problem.device}
                            </AdminBadge>
                            {problem.viewport && (
                                <AdminBadge
                                    variant="muted"
                                    className="h-6 px-2.5 tabular-nums"
                                >
                                    {problem.viewport}
                                </AdminBadge>
                            )}
                            {problem.installed && (
                                <AdminBadge
                                    variant="muted"
                                    className="h-6 px-2.5"
                                >
                                    App installata
                                </AdminBadge>
                            )}
                        </div>
                        <p className="text-[13px] break-all text-muted-foreground">
                            Pagina:{' '}
                            {problem.page.includes('{') ? (
                                <span className="font-mono">
                                    {problem.page}
                                </span>
                            ) : (
                                <a
                                    href={problem.page}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono underline"
                                >
                                    {problem.page}
                                </a>
                            )}
                        </p>
                        <p className="text-sm leading-5.25 whitespace-pre-line">
                            {problem.message}
                        </p>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {problem.screenshotUrl && (
                                <Button asChild variant="outline" size="sm">
                                    <a
                                        href={problem.screenshotUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <ImageIcon aria-hidden="true" />
                                        Screenshot
                                    </a>
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={saving === problem.id}
                                onClick={() => toggle(problem)}
                            >
                                {problem.solved
                                    ? 'Riapri'
                                    : 'Segna come risolto'}
                            </Button>
                            <Button asChild size="sm">
                                <a href={replyHref(problem)}>
                                    <Mail aria-hidden="true" />
                                    Rispondi
                                </a>
                            </Button>
                        </div>
                    </article>
                ))}
            </div>

            {visible.length === 0 && (
                <p className="rounded-[14px] border bg-card p-6 text-center text-muted-foreground">
                    {filter === 'open'
                        ? 'Nessun problema da risolvere.'
                        : 'Nessun problema risolto finora.'}
                </p>
            )}
        </>
    );
}

Problems.layout = { section: 'problems' };
