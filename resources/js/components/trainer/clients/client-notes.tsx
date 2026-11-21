import { router } from '@inertiajs/react';
import { PencilLine, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import TrainerClientRecordsController from '@/actions/App/Http/Controllers/TrainerClientRecordsController';
import {
    brandButtonClassName,
    brandFilledButtonClassName,
    outlineButtonClassName,
    softButtonClassName,
} from '@/components/trainer/ui/styles';
import { romeParts } from '@/lib/calendar';
import { formatDateMedium, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerClient } from '@/types';

/** As TrainerClientNote::BODY_MAX (and TrainerClient::NOTES_MAX). */
const NOTE_MAX = 2000;

const OPTIONS = {
    preserveScroll: true,
    preserveState: true,
    onError: (errors: Record<string, string>) =>
        toast.error(
            errors.body ??
                errors.notes ??
                'Non siamo riusciti a salvare la nota.',
        ),
};

/** «Mar 12 novembre · 18:30», with the year when it is not this one. */
function noteDate(iso: string): string {
    const year = romeParts(new Date(iso)).date.slice(0, 4);
    const thisYear = romeParts(new Date()).date.slice(0, 4);

    return `${formatDateMedium(iso)}${year === thisYear ? '' : ` ${year}`} · ${formatTime(iso)}`;
}

/**
 * "Note" in the card of a client: the trainer's dated notes, the most recent
 * first. The old single note ("Note private") is the last one, undated, until
 * it is emptied. Only the trainer reads them.
 */
export default function ClientNotes({ client }: { client: TrainerClient }) {
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<number | 'old' | null>(null);

    const add = (body: string, done: () => void) =>
        router.post(
            TrainerClientRecordsController.storeNote.url(client.recordId),
            { body },
            {
                ...OPTIONS,
                onSuccess: () => {
                    setAdding(false);
                    done();
                },
                onFinish: done,
            },
        );

    const update = (id: number, body: string, done: () => void) =>
        router.patch(
            TrainerClientRecordsController.updateNote.url({
                client: client.recordId,
                note: id,
            }),
            { body },
            {
                ...OPTIONS,
                onSuccess: () => setEditing(null),
                onFinish: done,
            },
        );

    const remove = (id: number) =>
        router.delete(
            TrainerClientRecordsController.destroyNote.url({
                client: client.recordId,
                note: id,
            }),
            OPTIONS,
        );

    // The old note lives on the client: an empty text takes it away.
    const saveOld = (body: string, done: () => void) =>
        router.patch(
            TrainerClientRecordsController.update.url(client.recordId),
            { notes: body },
            {
                ...OPTIONS,
                onSuccess: () => setEditing(null),
                onFinish: done,
            },
        );

    const empty = client.datedNotes.length === 0 && !client.notes;

    return (
        <section aria-label="Note private" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                    <h3 className="text-[15px] leading-5.5 font-semibold">
                        Note
                    </h3>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        Solo tu le leggi. Niente dati sulla salute.
                    </span>
                </div>
                {!adding && (
                    <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className={cn(outlineButtonClassName, 'h-10 shrink-0')}
                    >
                        <Plus aria-hidden="true" className="size-4" />
                        Aggiungi nota
                    </button>
                )}
            </div>

            {adding && (
                <NoteEditor
                    label="Nuova nota"
                    initial=""
                    onCancel={() => setAdding(false)}
                    onSave={add}
                />
            )}

            {empty && !adding && (
                <p className="rounded-[14px] bg-[#262626] px-3.5 py-3 text-[15px] leading-5.25 text-muted-foreground">
                    Ancora nessuna nota. Scrivi cosa avete fatto, preferenze,
                    cosa ricordare la prossima volta.
                </p>
            )}

            {(client.datedNotes.length > 0 || client.notes) && (
                <ul className="flex flex-col gap-2">
                    {client.datedNotes.map((note) =>
                        editing === note.id ? (
                            <li key={note.id}>
                                <NoteEditor
                                    label="Modifica nota"
                                    initial={note.body}
                                    onCancel={() => setEditing(null)}
                                    onSave={(body, done) =>
                                        update(note.id, body, done)
                                    }
                                />
                            </li>
                        ) : (
                            <NoteItem
                                key={note.id}
                                date={`${noteDate(note.createdAt)}${note.edited ? ' · modificata' : ''}`}
                                body={note.body}
                                onEdit={() => setEditing(note.id)}
                                onRemove={() => remove(note.id)}
                            />
                        ),
                    )}
                    {client.notes &&
                        (editing === 'old' ? (
                            <li>
                                <NoteEditor
                                    label="Modifica nota"
                                    initial={client.notes}
                                    allowEmpty
                                    onCancel={() => setEditing(null)}
                                    onSave={saveOld}
                                />
                            </li>
                        ) : (
                            <NoteItem
                                date="Nota precedente"
                                body={client.notes}
                                onEdit={() => setEditing('old')}
                                onRemove={() => saveOld('', () => {})}
                            />
                        ))}
                </ul>
            )}
        </section>
    );
}

function NoteItem({
    date,
    body,
    onEdit,
    onRemove,
}: {
    date: string;
    body: string;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const [confirming, setConfirming] = useState(false);

    return (
        <li className="flex flex-col gap-1.5 rounded-[14px] bg-[#262626] px-3.5 pt-3 pb-1.5">
            <span className="text-xs leading-4 font-semibold text-muted-foreground">
                {date}
            </span>
            <p className="text-[15px] leading-5.25 break-words whitespace-pre-line text-foreground">
                {body}
            </p>
            {confirming ? (
                <div
                    role="alertdialog"
                    aria-label="Eliminare la nota?"
                    className="flex flex-wrap items-center gap-2 py-1.5"
                >
                    <span className="mr-auto text-[13px] font-semibold">
                        Eliminare la nota?
                    </span>
                    <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        className={cn(softButtonClassName, 'h-9')}
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className={cn(brandButtonClassName, 'h-9 px-4')}
                    >
                        Elimina
                    </button>
                </div>
            ) : (
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1 text-[13px] font-semibold text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <PencilLine aria-hidden="true" className="size-3.5" />
                        Modifica
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                        Elimina
                    </button>
                </div>
            )}
        </li>
    );
}

function NoteEditor({
    label,
    initial,
    allowEmpty = false,
    onCancel,
    onSave,
}: {
    label: string;
    initial: string;
    /** The old note: emptied, it goes away. */
    allowEmpty?: boolean;
    onCancel: () => void;
    onSave: (body: string, done: () => void) => void;
}) {
    const fieldId = useId();
    const [value, setValue] = useState(initial);
    const [saving, setSaving] = useState(false);
    const blank = value.trim() === '';

    return (
        <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
                event.preventDefault();

                if (saving || (blank && !allowEmpty)) {
                    return;
                }

                setSaving(true);
                onSave(value, () => setSaving(false));
            }}
        >
            <label
                htmlFor={fieldId}
                className="text-[13px] font-semibold text-muted-foreground"
            >
                {label}
            </label>
            <textarea
                id={fieldId}
                value={value}
                maxLength={NOTE_MAX}
                rows={3}
                autoFocus
                placeholder="Cosa avete fatto, preferenze, cosa ricordare."
                onChange={(event) => setValue(event.target.value)}
                className="min-h-22 w-full resize-y rounded-[14px] border border-[#707070] bg-card px-3.5 py-3 text-[17px] text-foreground outline-none placeholder:text-[#8a8a8a] focus-visible:border-brand md:text-[15px]"
            />
            <div className="flex items-center gap-2">
                <span className="mr-auto text-xs text-muted-foreground tabular-nums">
                    {value.length}/{NOTE_MAX}
                </span>
                <button
                    type="button"
                    disabled={saving}
                    onClick={onCancel}
                    className={softButtonClassName}
                >
                    Annulla
                </button>
                <button
                    type="submit"
                    disabled={saving || (blank && !allowEmpty)}
                    className={cn(brandFilledButtonClassName, 'h-10')}
                >
                    Salva nota
                </button>
            </div>
        </form>
    );
}
