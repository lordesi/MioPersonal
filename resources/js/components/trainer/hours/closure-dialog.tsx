import { useId, useState } from 'react';
import { areaButtonClassName } from '@/components/mp/area-bits';
import DarkDialog from '@/components/mp/dark-dialog';
import { pillFieldClassName } from '@/components/onboarding/dark-fields';
import { Input } from '@/components/ui/input';
import { addDays } from '@/lib/calendar';
import { datesBetween } from '@/lib/day-overrides';
import { cn } from '@/lib/utils';

/** As in TrainerAvailabilityRequest. */
const NOTE_MAX = 60;
/** The longest holidays added at once: about three months. */
const MAX_DAYS = 92;

/**
 * "+ Aggiungi ferie o chiusura": from, to and an optional note. The days
 * are closed on the page, saved with "Salva modifiche".
 */
export default function ClosureDialog({
    open,
    onOpenChange,
    today,
    onAdd,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Rome date of today: the first day that can be closed. */
    today: string;
    onAdd: (dates: string[], note: string | null) => void;
}) {
    const id = useId();
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [note, setNote] = useState('');
    const last = addDays(today, 365);
    const valid =
        from >= today &&
        to >= from &&
        to <= last &&
        datesBetween(from, to).length <= MAX_DAYS;

    const add = () => {
        if (!valid) {
            return;
        }

        onAdd(datesBetween(from, to), note.trim() === '' ? null : note.trim());
        onOpenChange(false);
        setNote('');
    };

    return (
        <DarkDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Aggiungi ferie o chiusura"
        >
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor={`${id}-from`}
                        className="text-sm font-semibold"
                    >
                        Dal
                    </label>
                    <Input
                        id={`${id}-from`}
                        type="date"
                        value={from}
                        min={today}
                        max={last}
                        onChange={(event) => {
                            setFrom(event.target.value);

                            if (event.target.value > to) {
                                setTo(event.target.value);
                            }
                        }}
                        className={pillFieldClassName}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor={`${id}-to`}
                        className="text-sm font-semibold"
                    >
                        Al
                    </label>
                    <Input
                        id={`${id}-to`}
                        type="date"
                        value={to}
                        min={from}
                        max={last}
                        onChange={(event) => setTo(event.target.value)}
                        className={pillFieldClassName}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor={`${id}-note`} className="text-sm font-semibold">
                    Nota
                </label>
                <Input
                    id={`${id}-note`}
                    value={note}
                    maxLength={NOTE_MAX}
                    placeholder="Ferie"
                    onChange={(event) => setNote(event.target.value)}
                    className={pillFieldClassName}
                />
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className={areaButtonClassName('ghost', 'md')}
                >
                    Annulla
                </button>
                <button
                    type="button"
                    disabled={!valid}
                    onClick={add}
                    className={cn(
                        areaButtonClassName('primary', 'md'),
                        'flex-1',
                    )}
                >
                    Aggiungi
                </button>
            </div>
        </DarkDialog>
    );
}
