import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { eventWhen, placesLabel } from '@/components/events/event-card';
import ChoiceChips from '@/components/shared/choice-chips';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { hide, unhide } from '@/routes/admin/events';
import type { GroupSessionSummary } from '@/types';

type AdminEvent = GroupSessionSummary & {
    description: string | null;
    hidden: boolean;
    createdAt: string | null;
};

type Filter = 'all' | 'hidden';

const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'hidden', label: 'Nascosti' },
];

/**
 * "Eventi": the events of trainers and gyms, published at once. "Nascondi"
 * takes one off the lists and its page; "Mostra di nuovo" puts it back.
 */
export default function AdminEvents({ events }: { events: AdminEvent[] }) {
    const [filter, setFilter] = useState<Filter>('all');
    const [saving, setSaving] = useState<number | null>(null);
    const visible = events.filter((event) => filter === 'all' || event.hidden);

    const toggle = (event: AdminEvent) => {
        setSaving(event.id);
        router.visit(event.hidden ? unhide(event.id) : hide(event.id), {
            preserveScroll: true,
            onFinish: () => setSaving(null),
        });
    };

    return (
        <>
            <Head title="Admin · Eventi" />

            <ChoiceChips
                options={filters}
                value={filter}
                onChange={setFilter}
                aria-label="Filtra gli eventi"
                className="gap-1.5"
            />

            <div className="grid gap-3 lg:grid-cols-2">
                {visible.map((event) => (
                    <article
                        key={event.id}
                        className={cn(
                            'flex flex-col gap-2 rounded-[14px] bg-card p-4',
                            event.hidden
                                ? 'border border-dashed border-input opacity-70'
                                : 'border',
                        )}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={event.href}
                                className="text-[15px] font-semibold hover:underline"
                            >
                                {event.title}
                            </Link>
                            <Badge variant="secondary">{event.typeLabel}</Badge>
                            {event.cancelled && (
                                <Badge variant="destructive">Annullato</Badge>
                            )}
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                            {eventWhen(event)} · {event.place} · {event.price} ·{' '}
                            {placesLabel(event)}
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                            di {event.hosts.map((host) => host.name).join(', ')}
                            {event.createdAt &&
                                ` · creato ${formatAgo(event.createdAt)}`}
                        </p>
                        {event.description && (
                            <p className="line-clamp-4 text-sm leading-5.25 whitespace-pre-line">
                                {event.description}
                            </p>
                        )}
                        <div className="flex items-center gap-2">
                            {event.hidden && (
                                <span className="text-xs font-semibold">
                                    Nascosto al pubblico
                                </span>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="ml-auto"
                                disabled={saving === event.id}
                                onClick={() => toggle(event)}
                            >
                                {event.hidden ? 'Mostra di nuovo' : 'Nascondi'}
                            </Button>
                        </div>
                    </article>
                ))}
            </div>

            {visible.length === 0 && (
                <p className="rounded-[14px] border bg-card p-6 text-center text-muted-foreground">
                    Nessun evento.
                </p>
            )}
        </>
    );
}

AdminEvents.layout = { section: 'events' };
