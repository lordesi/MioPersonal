import { Head, router } from '@inertiajs/react';
import { Inbox, Mail } from 'lucide-react';
import { useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import ChoiceChips from '@/components/shared/choice-chips';
import EmptyState from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { read, unread } from '@/routes/admin/messages';
import { formatAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminMessage } from '@/types';

type MessagesProps = {
    messages: AdminMessage[];
};

type Filter = 'all' | 'unread';

const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'unread', label: 'Da leggere' },
];

/** The answer goes by email, from the team's mailbox. */
function replyHref(message: AdminMessage): string {
    const subject = `Re: ${message.topic} · MioPersonal`;

    return `mailto:${message.email}?subject=${encodeURIComponent(subject)}`;
}

/** "Messaggi": the messages of the Contatti page, the newest first. */
export default function Messages({ messages }: MessagesProps) {
    const [filter, setFilter] = useState<Filter>('all');
    // The message being saved: its button waits.
    const [saving, setSaving] = useState<number | null>(null);

    const toggle = (message: AdminMessage) => {
        setSaving(message.id);
        router.visit(message.read ? unread(message.id) : read(message.id), {
            preserveScroll: true,
            onFinish: () => setSaving(null),
        });
    };

    if (messages.length === 0) {
        return (
            <>
                <Head title="Admin · Messaggi" />
                <EmptyState
                    icon={Inbox}
                    title="Nessun messaggio"
                    description="I messaggi della pagina Contatti compaiono qui, e arrivano anche via email."
                    bordered
                />
            </>
        );
    }

    const visible = messages.filter(
        (message) => filter === 'all' || !message.read,
    );

    return (
        <>
            <Head title="Admin · Messaggi" />

            <ChoiceChips
                options={filters}
                value={filter}
                onChange={setFilter}
                aria-label="Filtra i messaggi"
                className="gap-1.5"
            />

            <div className="flex flex-col gap-3">
                {visible.map((message) => (
                    <article
                        key={message.id}
                        className={cn(
                            'flex flex-col gap-2.5 rounded-[14px] border bg-card p-4',
                            !message.read && 'border-[1.5px] border-foreground',
                        )}
                    >
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-[15px] font-semibold">
                                {message.name}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                {message.email} · {formatAgo(message.createdAt)}
                            </span>
                            {!message.read && (
                                <AdminBadge
                                    variant="solid"
                                    className="ml-auto h-6 px-2.5"
                                >
                                    Da leggere
                                </AdminBadge>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <AdminBadge className="h-6 px-2.5">
                                {message.role}
                            </AdminBadge>
                            <AdminBadge className="h-6 px-2.5">
                                {message.topic}
                            </AdminBadge>
                            {message.registered && (
                                <AdminBadge
                                    variant="muted"
                                    className="h-6 px-2.5"
                                >
                                    Iscritto
                                </AdminBadge>
                            )}
                        </div>
                        <p className="text-sm leading-5.25 whitespace-pre-line">
                            {message.message}
                        </p>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={saving === message.id}
                                onClick={() => toggle(message)}
                            >
                                {message.read
                                    ? 'Segna come da leggere'
                                    : 'Segna come letto'}
                            </Button>
                            <Button asChild size="sm">
                                <a href={replyHref(message)}>
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
                    Hai letto tutti i messaggi.
                </p>
            )}
        </>
    );
}

Messages.layout = { section: 'messages' };
