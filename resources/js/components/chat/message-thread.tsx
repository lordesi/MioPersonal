import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    Check,
    CheckCheck,
    Download,
    FileText,
    ImageOff,
    ImagePlus,
    MessageCircle,
} from 'lucide-react';
import type { DragEvent } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import MessageComposer from '@/components/chat/message-composer';
import type { ComposerHandle } from '@/components/chat/message-composer';
import PhotoViewer from '@/components/chat/photo-viewer';
import { useChatPolling } from '@/components/chat/use-chat-polling';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import {
    ATTACHMENT_DAYS,
    dayKey,
    daysLeft,
    expiryLabel,
    fetchOlderMessages,
    formatFileSize,
    linkify,
    mergeMessages,
    sameGroup,
} from '@/lib/chat';
import { formatDateLong, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatThread } from '@/types';

type MessageThreadProps = {
    thread: ChatThread;
    /** "Indietro" on mobile: the list. */
    backHref: string;
    /** After a message is sent or arrives: the list on the left is refreshed. */
    onActivity: () => void;
};

/** The expiry shows on the bubble when this few days are left. */
const EXPIRY_WARNING_DAYS = 3;

/**
 * The open conversation: the messages in groups, the new ones every few
 * seconds, the photos full screen, and the box to write. Files can be dropped
 * anywhere on it.
 */
export default function MessageThread({
    thread,
    backHref,
    onActivity,
}: MessageThreadProps) {
    const [messages, setMessages] = useState(thread.messages);
    const [hasOlder, setHasOlder] = useState(thread.hasOlder);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [otherReadAt, setOtherReadAt] = useState(thread.otherReadAt);
    const [viewing, setViewing] = useState<number | null>(null);
    // Messages arrived while reading further up: the "Nuovi messaggi" button.
    const [unseen, setUnseen] = useState(0);
    const [awayFromBottom, setAwayFromBottom] = useState(false);
    const [dragging, setDragging] = useState(false);
    const dragDepth = useRef(0);
    const scroller = useRef<HTMLDivElement>(null);
    const composer = useRef<ComposerHandle>(null);
    // 'bottom': follow the new messages; a number: keep the place after loading older ones.
    const anchor = useRef<'bottom' | number | null>('bottom');
    const lastId = messages.at(-1)?.id ?? 0;
    const firstName = thread.name.split(' ')[0];

    const nearBottom = () => {
        const element = scroller.current;

        return (
            element === null ||
            element.scrollHeight - element.scrollTop - element.clientHeight <
                120
        );
    };

    const add = (incoming: ChatMessage[], follow: boolean) => {
        const atBottom = nearBottom();
        anchor.current = follow || atBottom ? 'bottom' : null;

        if (!follow && !atBottom) {
            setUnseen((count) => count + incoming.length);
        }

        setMessages((current) => mergeMessages(current, incoming));
        onActivity();
    };

    useChatPolling(thread.recordId, lastId, (incoming, readAt) => {
        setOtherReadAt(readAt);

        if (incoming.length > 0) {
            add(incoming, false);
        }
    });

    useLayoutEffect(() => {
        const element = scroller.current;

        if (element === null || anchor.current === null) {
            return;
        }

        element.scrollTop =
            anchor.current === 'bottom'
                ? element.scrollHeight
                : element.scrollHeight - anchor.current;
        anchor.current = null;
    }, [messages]);

    const onScroll = () => {
        const bottom = nearBottom();
        setAwayFromBottom(!bottom);

        if (bottom) {
            setUnseen(0);
        }
    };

    const toBottom = () => {
        scroller.current?.scrollTo({
            top: scroller.current.scrollHeight,
            behavior: 'smooth',
        });
        setUnseen(0);
    };

    const loadOlder = async () => {
        const first = messages[0];

        if (first === undefined || loadingOlder) {
            return;
        }

        setLoadingOlder(true);

        try {
            const page = await fetchOlderMessages(thread.recordId, first.id);
            const element = scroller.current;

            anchor.current =
                element === null
                    ? null
                    : element.scrollHeight - element.scrollTop;
            setMessages((current) => mergeMessages(page.messages, current));
            setHasOlder(page.hasOlder);
        } catch {
            toast.error('Non siamo riusciti a caricare i messaggi. Riprova.');
        } finally {
            setLoadingOlder(false);
        }
    };

    const photos = useMemo(
        () => messages.filter((message) => message.attachment?.src),
        [messages],
    );

    // The last message of mine the other person has seen: "Visto" under it.
    const seenId = useMemo(() => {
        const last = messages.at(-1);

        if (!last?.mine || !last.at || !otherReadAt) {
            return null;
        }

        return new Date(otherReadAt) >= new Date(last.at) ? last.id : null;
    }, [messages, otherReadAt]);

    const hasFiles = (event: DragEvent) =>
        Array.from(event.dataTransfer.types).includes('Files');

    const dragHandlers = {
        onDragEnter: (event: DragEvent) => {
            if (!hasFiles(event)) {
                return;
            }

            event.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
        },
        onDragOver: (event: DragEvent) => {
            if (hasFiles(event)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            }
        },
        onDragLeave: (event: DragEvent) => {
            if (!hasFiles(event)) {
                return;
            }

            dragDepth.current = Math.max(0, dragDepth.current - 1);

            if (dragDepth.current === 0) {
                setDragging(false);
            }
        },
        onDrop: (event: DragEvent) => {
            if (!hasFiles(event)) {
                return;
            }

            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            composer.current?.addFiles(Array.from(event.dataTransfer.files));
        },
    };

    return (
        <section
            aria-label={`Conversazione con ${thread.name}`}
            className="relative flex min-h-0 flex-1 flex-col"
            {...dragHandlers}
        >
            <header className="flex items-center gap-3 border-b bg-card px-3 py-2.5 md:px-5">
                <Link
                    href={backHref}
                    aria-label="Tutti i messaggi"
                    className="flex size-9 flex-none items-center justify-center rounded-full hover:bg-accent md:hidden"
                >
                    <ArrowLeft aria-hidden="true" className="size-4.5" />
                </Link>
                <Link
                    href={thread.href}
                    className="group flex min-w-0 items-center gap-3"
                >
                    <UserAvatar
                        name={thread.name}
                        src={thread.avatar}
                        size="md"
                        className="flex-none"
                    />
                    <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[15px] leading-5 font-semibold group-hover:underline">
                            {thread.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            {thread.subtitle} · Vedi{' '}
                            {thread.subtitle === 'Cliente'
                                ? 'scheda'
                                : 'profilo'}
                        </span>
                    </span>
                </Link>
            </header>

            <div
                ref={scroller}
                onScroll={onScroll}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-secondary/50 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:22px_22px] px-3 pt-2 pb-4 md:px-6"
            >
                {hasOlder && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={loadOlder}
                        disabled={loadingOlder}
                        className="my-2 h-9 self-center rounded-full bg-card text-[13px]"
                    >
                        {loadingOlder ? 'Carico…' : 'Messaggi precedenti'}
                    </Button>
                )}

                {messages.length === 0 && (
                    <div className="m-auto flex max-w-80 flex-col items-center gap-3 rounded-[20px] bg-card px-6 py-7 text-center shadow-xs">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <MessageCircle
                                aria-hidden="true"
                                className="size-6"
                            />
                        </span>
                        <p className="text-[15px] font-semibold">
                            Scrivi a {firstName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            I messaggi restano qui, solo tra voi due. Puoi
                            mandare anche foto e schede PDF: restano disponibili
                            per {ATTACHMENT_DAYS} giorni.
                        </p>
                    </div>
                )}

                {messages.map((message, index) => {
                    const previous = messages[index - 1];
                    const next = messages[index + 1];
                    const showDay =
                        message.at !== null &&
                        (previous?.at == null ||
                            dayKey(previous.at) !== dayKey(message.at));
                    const groupedWithPrevious =
                        !showDay &&
                        previous !== undefined &&
                        sameGroup(previous, message);
                    const lastOfGroup = !sameGroup(message, next);

                    return (
                        <div
                            key={message.id}
                            className={cn(
                                'flex flex-col',
                                groupedWithPrevious ? 'mt-0.5' : 'mt-3',
                            )}
                        >
                            {showDay && message.at && (
                                <span className="sticky top-1 z-10 mb-3 self-center rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur">
                                    {dayLabel(message.at)}
                                </span>
                            )}
                            <Bubble
                                message={message}
                                tail={lastOfGroup}
                                showTime={lastOfGroup}
                                onOpenPhoto={() => setViewing(message.id)}
                            />
                            {message.id === seenId && (
                                <span className="mt-1 flex items-center gap-1 self-end text-[11px] text-muted-foreground">
                                    <CheckCheck
                                        aria-hidden="true"
                                        className="size-3.5 text-primary"
                                    />
                                    Visto
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {awayFromBottom && (
                <button
                    type="button"
                    onClick={toBottom}
                    aria-label={
                        unseen > 0
                            ? `${unseen} messaggi nuovi`
                            : 'Vai agli ultimi messaggi'
                    }
                    className="absolute right-4 bottom-24 z-20 flex h-10 items-center gap-1.5 rounded-full border bg-card px-3 text-[13px] font-semibold shadow-md hover:bg-accent"
                >
                    <ArrowDown aria-hidden="true" className="size-4" />
                    {unseen > 0 && (
                        <span className="tabular-nums">
                            {unseen} {unseen === 1 ? 'nuovo' : 'nuovi'}
                        </span>
                    )}
                </button>
            )}

            {dragging && (
                <div className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-primary bg-card/90 text-center backdrop-blur-sm">
                    <ImagePlus
                        aria-hidden="true"
                        className="size-8 text-primary"
                    />
                    <p className="text-[15px] font-semibold">
                        Rilascia per allegare
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Foto (JPG, PNG) o PDF
                    </p>
                </div>
            )}

            <MessageComposer
                key={thread.recordId}
                ref={composer}
                recordId={thread.recordId}
                name={thread.name}
                onSent={(message) => {
                    setUnseen(0);
                    add([message], true);
                }}
            />

            <PhotoViewer
                photos={photos}
                openId={viewing}
                onOpenChange={setViewing}
                otherName={thread.name}
            />
        </section>
    );
}

type BubbleProps = {
    message: ChatMessage;
    /** The last of a group: the pointed corner. */
    tail: boolean;
    showTime: boolean;
    onOpenPhoto: () => void;
};

function Bubble({ message, tail, showTime, onOpenPhoto }: BubbleProps) {
    const attachment = message.attachment;
    const photo =
        attachment?.kind === 'photo' && attachment.src ? attachment : null;
    // A photo alone: the time goes on the photo.
    const photoOnly = photo !== null && !message.body;
    const time = showTime && message.at ? formatTime(message.at) : null;
    const warn =
        attachment?.expiresAt &&
        !attachment.expired &&
        daysLeft(attachment.expiresAt) < EXPIRY_WARNING_DAYS;

    return (
        <div
            className={cn(
                'flex max-w-[85%] flex-col overflow-hidden rounded-[18px] shadow-xs md:max-w-[65%]',
                message.mine
                    ? 'self-end bg-primary text-primary-foreground'
                    : 'self-start bg-card',
                tail && (message.mine ? 'rounded-br-md' : 'rounded-bl-md'),
                photo ? 'p-1' : 'px-3.5 py-2',
            )}
        >
            {photo && (
                <div className="relative">
                    <button
                        type="button"
                        onClick={onOpenPhoto}
                        aria-label="Apri la foto"
                        className="block overflow-hidden rounded-[14px] bg-secondary outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                        <img
                            src={photo.src ?? undefined}
                            alt={message.body ?? 'Foto'}
                            loading="lazy"
                            decoding="async"
                            width={photo.width ?? undefined}
                            height={photo.height ?? undefined}
                            style={
                                photo.width && photo.height
                                    ? {
                                          aspectRatio: `${photo.width} / ${photo.height}`,
                                      }
                                    : undefined
                            }
                            className="block max-h-80 w-70 max-w-full object-cover"
                        />
                    </button>
                    {photo.href && (
                        <a
                            href={photo.href}
                            download
                            aria-label="Scarica la foto"
                            title="Scarica"
                            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-foreground/55 text-background backdrop-blur-sm hover:bg-foreground/75"
                        >
                            <Download aria-hidden="true" className="size-4" />
                        </a>
                    )}
                    {photoOnly && time && (
                        <span className="absolute right-2 bottom-2 rounded-full bg-foreground/55 px-2 py-0.5 text-[11px] leading-3.5 text-background tabular-nums backdrop-blur-sm">
                            {time}
                        </span>
                    )}
                </div>
            )}

            {attachment?.kind === 'pdf' && attachment.href && (
                <a
                    href={attachment.href}
                    download
                    className={cn(
                        'mb-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:opacity-90',
                        message.mine
                            ? 'bg-primary-foreground/15'
                            : 'bg-secondary',
                    )}
                >
                    <span
                        className={cn(
                            'flex size-9 flex-none items-center justify-center rounded-lg',
                            message.mine
                                ? 'bg-primary-foreground/20'
                                : 'bg-card text-primary',
                        )}
                    >
                        <FileText aria-hidden="true" className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold">
                            {attachment.name ?? 'Scheda.pdf'}
                        </span>
                        <span className="text-xs tabular-nums opacity-75">
                            PDF · {formatFileSize(attachment.size)}
                        </span>
                    </span>
                    <Download
                        aria-label="Scarica"
                        className="ml-1 size-4 flex-none"
                    />
                </a>
            )}

            {attachment?.expired && (
                <div
                    className={cn(
                        'mb-1 flex items-center gap-2 rounded-xl border border-dashed px-2.5 py-2 text-[13px]',
                        message.mine
                            ? 'border-primary-foreground/40 text-primary-foreground/85'
                            : 'border-border text-muted-foreground',
                    )}
                >
                    {attachment.kind === 'photo' ? (
                        <ImageOff
                            aria-hidden="true"
                            className="size-4 flex-none"
                        />
                    ) : (
                        <FileText
                            aria-hidden="true"
                            className="size-4 flex-none"
                        />
                    )}
                    <span className="min-w-0 truncate">
                        {attachment.kind === 'photo'
                            ? 'Foto non più disponibile'
                            : `PDF non più disponibile${attachment.name ? ` · ${attachment.name}` : ''}`}
                    </span>
                </div>
            )}

            {(message.body || (!photoOnly && time) || warn) && (
                <div
                    className={cn(
                        'flex flex-col gap-0.5',
                        photo && 'px-2.5 pt-1.5 pb-1',
                    )}
                >
                    {message.body && (
                        <p className="text-[15px] leading-5.5 break-words whitespace-pre-line">
                            {linkify(message.body).map((part, index) =>
                                part.href ? (
                                    <a
                                        key={index}
                                        href={part.href}
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        className="break-all underline underline-offset-2"
                                    >
                                        {part.text}
                                    </a>
                                ) : (
                                    part.text
                                ),
                            )}
                        </p>
                    )}
                    {(warn || (!photoOnly && time)) && (
                        <span className="flex items-center justify-end gap-2 text-[11px] leading-3.5 opacity-70">
                            {warn && attachment?.expiresAt && (
                                <span>{expiryLabel(attachment.expiresAt)}</span>
                            )}
                            {!photoOnly && time && (
                                <span className="flex items-center gap-0.5 tabular-nums">
                                    {time}
                                    {message.mine && (
                                        <Check
                                            aria-hidden="true"
                                            className="size-3"
                                        />
                                    )}
                                </span>
                            )}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

/** "Oggi", "Ieri" or "Martedì 6 ottobre". */
function dayLabel(iso: string): string {
    const day = dayKey(iso);

    if (day === dayKey(new Date().toISOString())) {
        return 'Oggi';
    }

    if (day === dayKey(new Date(Date.now() - 86400000).toISOString())) {
        return 'Ieri';
    }

    return formatDateLong(iso);
}
