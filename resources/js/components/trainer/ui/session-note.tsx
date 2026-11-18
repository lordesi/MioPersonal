import { router } from '@inertiajs/react';
import { PencilLine } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import {
    brandButtonClassName,
    outlineButtonClassName,
    softButtonClassName,
} from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import { note as saveNote } from '@/routes/trainer/sessions';

/** As TrainerSessionNoteController::NOTE_MAX. */
const NOTE_MAX = 1000;

/**
 * "Aggiungi nota" of a confirmed session: what was done, how it went. Only
 * the trainer reads it. Shown on Home, in the calendar and in "Svolte".
 */
export default function SessionNote({
    id,
    note,
    className,
}: {
    /** The booking. */
    id: number;
    note: string | null;
    className?: string;
}) {
    const fieldId = useId();
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(note ?? '');
    const [saving, setSaving] = useState(false);

    const save = () => {
        router.patch(
            saveNote.url(id),
            { note: value },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: () => setEditing(false),
                onError: (errors) =>
                    toast.error(
                        errors.note ?? 'Non siamo riusciti a salvare la nota.',
                    ),
            },
        );
    };

    if (!editing) {
        return note ? (
            <div className={cn('flex flex-col gap-1.5', className)}>
                <p className="rounded-[14px] bg-[#262626] px-3.5 py-3 text-[15px] leading-5.25 whitespace-pre-line text-foreground">
                    {note}
                </p>
                <button
                    type="button"
                    onClick={() => {
                        setValue(note);
                        setEditing(true);
                    }}
                    className="inline-flex min-h-9 items-center gap-1.5 self-start text-[13px] font-semibold text-brand outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <PencilLine aria-hidden="true" className="size-3.5" />
                    Modifica nota
                </button>
            </div>
        ) : (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className={cn(outlineButtonClassName, 'self-start', className)}
            >
                <PencilLine aria-hidden="true" className="size-4" />
                Aggiungi nota
            </button>
        );
    }

    return (
        <form
            className={cn('flex flex-col gap-2', className)}
            onSubmit={(event) => {
                event.preventDefault();
                save();
            }}
        >
            <label
                htmlFor={fieldId}
                className="text-[13px] font-semibold text-muted-foreground"
            >
                Nota sulla seduta (la leggi solo tu)
            </label>
            <textarea
                id={fieldId}
                value={value}
                maxLength={NOTE_MAX}
                rows={3}
                autoFocus
                placeholder="Cosa avete fatto, come è andata. Niente dati sulla salute."
                onChange={(event) => setValue(event.target.value)}
                className="min-h-22 w-full resize-y rounded-[14px] border border-[#707070] bg-card px-3.5 py-3 text-[15px] text-foreground outline-none placeholder:text-[#8a8a8a] focus-visible:border-brand"
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                        setValue(note ?? '');
                        setEditing(false);
                    }}
                    className={softButtonClassName}
                >
                    Annulla
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className={cn(brandButtonClassName, 'h-10')}
                >
                    Salva nota
                </button>
            </div>
        </form>
    );
}
