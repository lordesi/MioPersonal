import {
    FileText,
    ImagePlus,
    LoaderCircle,
    Paperclip,
    Send,
    X,
} from 'lucide-react';
import type { ClipboardEvent, FormEvent, KeyboardEvent, Ref } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    ATTACHMENT_DAYS,
    ATTACHMENT_MAX_BYTES,
    BODY_MAX,
    ChatError,
    formatFileSize,
    PHOTO_MAX_BYTES,
    PHOTOS_AT_ONCE,
    sendMessage,
} from '@/lib/chat';
import { shrinkImage } from '@/lib/image';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

/** What the thread can do with the box: the files dropped on the conversation. */
export type ComposerHandle = {
    addFiles: (files: File[]) => void;
};

type MessageComposerProps = {
    recordId: number;
    name: string;
    onSent: (message: ChatMessage) => void;
    ref?: Ref<ComposerHandle>;
};

type Photo = { key: string; file: File; preview: string };

/** The counter shows up from here. */
const COUNTER_FROM = BODY_MAX - 200;

const isPdf = (file: File) =>
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const isImage = (file: File) =>
    file.type.startsWith('image/') ||
    /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name);

/**
 * The box at the bottom: text, photos and a PDF. Photos come from the button,
 * from the clipboard (Ctrl+V) or dropped on the conversation; each is sent as
 * its own message, the text with the first one. Enter sends, Shift+Enter goes
 * to a new line. What could not be sent stays in the box.
 */
export default function MessageComposer({
    recordId,
    name,
    onSent,
    ref,
}: MessageComposerProps) {
    const [body, setBody] = useState('');
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [pdf, setPdf] = useState<File | null>(null);
    const [preparing, setPreparing] = useState(0);
    const [progress, setProgress] = useState<{
        done: number;
        total: number;
    } | null>(null);
    const photoInput = useRef<HTMLInputElement>(null);
    const pdfInput = useRef<HTMLInputElement>(null);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const previews = useRef(new Set<string>());

    const sending = progress !== null;
    const hasFiles = photos.length > 0 || pdf !== null;
    const canSend =
        !sending && preparing === 0 && (body.trim() !== '' || hasFiles);

    // The previews are freed when the box goes away.
    useEffect(() => {
        const urls = previews.current;

        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const dropPreview = (photo: Photo) => {
        URL.revokeObjectURL(photo.preview);
        previews.current.delete(photo.preview);
    };

    const removePhoto = (key: string) =>
        setPhotos((current) =>
            current.filter((photo) => {
                if (photo.key === key) {
                    dropPreview(photo);

                    return false;
                }

                return true;
            }),
        );

    const addPhotos = async (files: File[]) => {
        const room = PHOTOS_AT_ONCE - photos.length - preparing;

        if (room <= 0) {
            toast.error(
                `Puoi mandare al massimo ${PHOTOS_AT_ONCE} foto alla volta.`,
            );

            return;
        }

        if (files.length > room) {
            toast.error(
                `Puoi mandare al massimo ${PHOTOS_AT_ONCE} foto alla volta.`,
            );
        }

        const picked = files.slice(0, room);
        setPreparing((count) => count + picked.length);

        for (const original of picked) {
            // A phone photo goes from ~5 MB to a few hundred KB, and HEIC becomes JPEG.
            const file = await shrinkImage(original);
            setPreparing((count) => count - 1);

            if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
                toast.error(`"${original.name}": usa una foto JPG o PNG.`);
                continue;
            }

            if (file.size > PHOTO_MAX_BYTES) {
                toast.error(
                    `"${original.name}" pesa troppo: al massimo 10 MB.`,
                );
                continue;
            }

            const preview = URL.createObjectURL(file);
            previews.current.add(preview);
            setPhotos((current) => [
                ...current,
                { key: `${Date.now()}-${Math.random()}`, file, preview },
            ]);
        }
    };

    const addPdf = (file: File) => {
        if (file.size > ATTACHMENT_MAX_BYTES) {
            toast.error('Il PDF può pesare al massimo 10 MB.');

            return;
        }

        setPdf(file);
    };

    const addFiles = (files: File[]) => {
        const images = files.filter(isImage);
        const pdfs = files.filter((file) => !isImage(file) && isPdf(file));

        if (images.length + pdfs.length < files.length) {
            toast.error('Puoi mandare solo foto (JPG, PNG) e PDF.');
        }

        if (pdfs.length > 0) {
            addPdf(pdfs[0]);
        }

        if (images.length > 0) {
            void addPhotos(images);
        }

        textarea.current?.focus();
    };

    useImperativeHandle(ref, () => ({ addFiles }));

    const send = async (event?: FormEvent) => {
        event?.preventDefault();

        if (!canSend) {
            return;
        }

        // The text goes with the first photo, or with the PDF, or alone.
        const queue: Array<{ photo?: Photo; pdf?: File }> = [
            ...photos.map((photo) => ({ photo })),
            ...(pdf ? [{ pdf }] : []),
        ];
        let text = body;

        if (queue.length === 0) {
            queue.push({});
        }

        setProgress({ done: 0, total: queue.length });

        try {
            for (const [index, item] of queue.entries()) {
                const message = await sendMessage(recordId, text, {
                    photo: item.photo?.file,
                    pdf: item.pdf,
                });

                onSent(message);
                setProgress({ done: index + 1, total: queue.length });

                if (text !== '') {
                    text = '';
                    setBody('');
                }

                if (item.photo) {
                    removePhoto(item.photo.key);
                }

                if (item.pdf) {
                    setPdf(null);
                }
            }
        } catch (error) {
            toast.error(
                error instanceof ChatError
                    ? error.message
                    : 'Non siamo riusciti a inviare. Riprova tra poco.',
            );
        } finally {
            setProgress(null);
            textarea.current?.focus();
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            void send(event);
        }
    };

    // A screenshot or a photo copied: Ctrl+V adds it.
    const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        const files = Array.from(event.clipboardData.files);

        if (files.length > 0) {
            event.preventDefault();
            addFiles(files);
        }
    };

    const pickFrom = (input: HTMLInputElement | null) => {
        const files = Array.from(input?.files ?? []);

        if (input) {
            input.value = '';
        }

        if (files.length > 0) {
            addFiles(files);
        }
    };

    return (
        <form
            onSubmit={send}
            className="flex flex-col gap-2 border-t bg-card px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
            {(hasFiles || preparing > 0) && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {photos.map((photo) => (
                            <div
                                key={photo.key}
                                className="group relative size-16 overflow-hidden rounded-xl border bg-secondary"
                            >
                                <img
                                    src={photo.preview}
                                    alt=""
                                    className="size-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(photo.key)}
                                    disabled={sending}
                                    aria-label="Togli la foto"
                                    className="absolute top-1 right-1 flex size-5.5 items-center justify-center rounded-full bg-foreground/75 text-background hover:bg-foreground"
                                >
                                    <X aria-hidden="true" className="size-3" />
                                </button>
                            </div>
                        ))}
                        {Array.from({ length: preparing }, (_, index) => (
                            <div
                                key={`preparing-${index}`}
                                className="flex size-16 items-center justify-center rounded-xl border bg-secondary"
                            >
                                <LoaderCircle
                                    aria-label="Preparo la foto"
                                    className="size-4 animate-spin text-muted-foreground"
                                />
                            </div>
                        ))}
                        {pdf && (
                            <div className="flex h-16 items-center gap-2 rounded-xl border bg-secondary px-3 text-[13px]">
                                <FileText
                                    aria-hidden="true"
                                    className="size-5 flex-none text-primary"
                                />
                                <span className="flex min-w-0 flex-col">
                                    <span className="max-w-44 truncate font-semibold">
                                        {pdf.name}
                                    </span>
                                    <span className="text-muted-foreground tabular-nums">
                                        PDF · {formatFileSize(pdf.size)}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPdf(null)}
                                    disabled={sending}
                                    aria-label="Togli il PDF"
                                    className="flex size-6 items-center justify-center rounded-full hover:bg-accent"
                                >
                                    <X
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {progress
                            ? `Invio ${Math.min(progress.done + 1, progress.total)} di ${progress.total}…`
                            : `Foto e PDF restano disponibili per ${ATTACHMENT_DAYS} giorni: scaricali se ti servono.`}
                    </p>
                </div>
            )}

            <div className="flex items-end gap-1.5">
                <input
                    ref={photoInput}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => pickFrom(event.target)}
                />
                <input
                    ref={pdfInput}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => pickFrom(event.target)}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => photoInput.current?.click()}
                    disabled={sending}
                    aria-label="Allega foto"
                    title="Foto"
                    className="size-10.5 flex-none rounded-full text-muted-foreground hover:text-foreground"
                >
                    <ImagePlus aria-hidden="true" className="size-5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => pdfInput.current?.click()}
                    disabled={sending}
                    aria-label="Allega un PDF"
                    title="PDF"
                    className="size-10.5 flex-none rounded-full text-muted-foreground hover:text-foreground"
                >
                    <Paperclip aria-hidden="true" className="size-5" />
                </Button>
                <label className="sr-only" htmlFor={`message-${recordId}`}>
                    Messaggio per {name}
                </label>
                <div className="relative min-w-0 flex-1">
                    <textarea
                        ref={textarea}
                        id={`message-${recordId}`}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        onKeyDown={onKeyDown}
                        onPaste={onPaste}
                        maxLength={BODY_MAX}
                        rows={1}
                        placeholder={
                            hasFiles
                                ? 'Aggiungi un messaggio'
                                : 'Scrivi un messaggio'
                        }
                        className="block field-sizing-content max-h-36 min-h-10.5 w-full resize-none rounded-[20px] border bg-secondary px-4 py-2.5 text-[15px] leading-5.5 transition-colors outline-none focus:border-foreground/40 focus:bg-card"
                    />
                    {body.length >= COUNTER_FROM && (
                        <span
                            className={cn(
                                'pointer-events-none absolute -top-5 right-3 text-[11px] tabular-nums',
                                body.length >= BODY_MAX
                                    ? 'font-semibold text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {body.length}/{BODY_MAX}
                        </span>
                    )}
                </div>
                <Button
                    type="submit"
                    size="icon"
                    disabled={!canSend}
                    aria-label="Invia"
                    className="size-10.5 flex-none rounded-full transition-transform active:scale-95"
                >
                    {sending ? (
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-4.5 animate-spin"
                        />
                    ) : (
                        <Send aria-hidden="true" className="size-4.5" />
                    )}
                </Button>
            </div>
        </form>
    );
}
