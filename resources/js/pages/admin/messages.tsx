import { Head, setLayoutProps } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import AdminBadge from '@/components/admin/admin-badge';
import AdminNotice from '@/components/admin/admin-notice';
import SegmentedControl from '@/components/shared/segmented-control';
import EmptyState from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { messageStatuses } from '@/lib/admin';
import { formatAgo, formatDayMonth } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminContactMessage, ContactMessageStatus } from '@/types';

type MessagesProps = {
    messages: AdminContactMessage[];
    privacyDeadlineDays: number;
};

const statusOptions = (
    Object.keys(messageStatuses) as ContactMessageStatus[]
).map((value) => ({ value, label: messageStatuses[value].label }));

export default function Messages({
    messages,
    privacyDeadlineDays,
}: MessagesProps) {
    const listTitleId = useId();
    const replyId = useId();
    const [selectedId, setSelectedId] = useState(messages[0]?.id ?? 0);
    // TODO: statuses and replies only live in the page until the backend exists.
    const [statuses, setStatuses] = useState<
        Record<number, ContactMessageStatus>
    >({});
    const [replied, setReplied] = useState<number[]>([]);
    const [notice, setNotice] = useState<string | null>(null);

    const statusOf = (message: AdminContactMessage) =>
        statuses[message.id] ?? message.status;
    const unreadCount = messages.filter(
        (message) => statusOf(message) === 'new',
    ).length;

    useEffect(() => {
        setLayoutProps({ unreadMessages: unreadCount });
    }, [unreadCount]);

    const message = messages.find((item) => item.id === selectedId);

    if (!message) {
        return (
            <>
                <Head title="Admin · Messaggi" />
                <EmptyState
                    icon={Mail}
                    title="Nessun messaggio"
                    description="I messaggi inviati dalla pagina Contatti arrivano qui."
                    bordered
                />
            </>
        );
    }

    const deadline = new Date(
        new Date(message.receivedAt).getTime() +
            privacyDeadlineDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const sendReply = () => {
        setReplied([...replied, message.id]);
        setStatuses({ ...statuses, [message.id]: 'in-progress' });
        setNotice(`Risposta inviata a ${message.email}`);
    };

    return (
        <>
            <Head title="Admin · Messaggi" />

            <AdminNotice message={notice} onClose={() => setNotice(null)} />

            <div className="grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <section
                    aria-labelledby={listTitleId}
                    className="overflow-hidden rounded-[14px] border bg-card"
                >
                    <h2
                        id={listTitleId}
                        className="border-b p-3.5 text-[15px] font-semibold tabular-nums"
                    >
                        Da leggere · {unreadCount}
                    </h2>
                    <ul>
                        {messages.map((item) => {
                            const status = messageStatuses[statusOf(item)];
                            const isSelected = item.id === message.id;

                            return (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        aria-current={
                                            isSelected ? 'true' : undefined
                                        }
                                        onClick={() => setSelectedId(item.id)}
                                        className={cn(
                                            'flex w-full flex-col gap-1 border-b px-3.5 py-3 text-left',
                                            isSelected
                                                ? 'bg-secondary shadow-[inset_3px_0_0_0] shadow-foreground'
                                                : 'hover:bg-accent',
                                        )}
                                    >
                                        <span className="flex w-full items-center gap-2">
                                            {statusOf(item) === 'new' && (
                                                <span
                                                    role="img"
                                                    aria-label="Non letto"
                                                    className="size-2 shrink-0 rounded-full bg-foreground"
                                                />
                                            )}
                                            <span className="text-sm font-semibold">
                                                {item.name}
                                            </span>
                                            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                                                {formatAgo(item.receivedAt)}
                                            </span>
                                        </span>
                                        <span className="text-sm">
                                            {item.subject}
                                        </span>
                                        <span className="flex flex-wrap gap-1.5">
                                            <AdminBadge
                                                variant={status.variant}
                                            >
                                                {status.label}
                                            </AdminBadge>
                                            <AdminBadge
                                                variant="muted"
                                                className="font-medium text-foreground"
                                            >
                                                {item.topicLabel}
                                            </AdminBadge>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section
                    aria-label="Messaggio"
                    className="flex flex-col gap-3.5 rounded-[14px] border bg-card p-5"
                >
                    <div className="flex flex-wrap items-start gap-3">
                        <div className="flex flex-1 flex-col gap-1">
                            <h2 className="text-xl font-bold tracking-tight">
                                {message.subject}
                            </h2>
                            <span className="text-sm text-muted-foreground">
                                {message.name} · {message.roleLabel} ·{' '}
                                {message.email} ·{' '}
                                {formatAgo(message.receivedAt)}
                            </span>
                        </div>
                        <SegmentedControl
                            options={statusOptions}
                            value={statusOf(message)}
                            onChange={(value) =>
                                setStatuses({
                                    ...statuses,
                                    [message.id]: value,
                                })
                            }
                            aria-label="Stato del messaggio"
                            className="h-9.5 shrink-0 *:whitespace-nowrap md:h-9.5"
                        />
                    </div>

                    {message.isPrivacyRequest && (
                        <div
                            role="alert"
                            className="flex flex-col gap-2 rounded-xl border-[1.5px] border-foreground px-3.5 py-3 text-sm"
                        >
                            <strong>
                                Richiesta privacy · da evadere entro il{' '}
                                {formatDayMonth(deadline)} (
                                {privacyDeadlineDays} giorni)
                            </strong>
                            {/* TODO: export and delete the account once users can be managed. */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                >
                                    Esporta i dati di {message.name}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                >
                                    Cancella account e dati
                                </Button>
                            </div>
                        </div>
                    )}

                    <p className="rounded-xl bg-muted p-3.5 text-[15px] leading-5.75">
                        {message.text}
                    </p>

                    {replied.includes(message.id) ? (
                        <div className="rounded-r-[10px] border-l-3 border-foreground bg-muted px-3.5 py-3 text-sm">
                            <strong>Risposta inviata</strong> · la trovi anche
                            nella tua casella email.
                        </div>
                    ) : (
                        <>
                            <Label htmlFor={replyId} className="font-semibold">
                                Rispondi via email
                            </Label>
                            {/* TODO: send the reply by email from the server. */}
                            <Textarea
                                key={message.id}
                                id={replyId}
                                rows={5}
                                defaultValue={`Ciao ${message.name}, grazie per averci scritto. `}
                                className="min-h-32 text-[15px] md:text-[15px]"
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    className="h-10 px-4.5 font-semibold"
                                    onClick={sendReply}
                                >
                                    Invia risposta
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10"
                                >
                                    Usa una risposta pronta
                                </Button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </>
    );
}

Messages.layout = { section: 'messages' };
