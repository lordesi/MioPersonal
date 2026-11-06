import { router, usePage } from '@inertiajs/react';
import { CalendarClock, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { freeStarts } from '@/lib/booking';
import {
    formatDateMedium,
    formatDayNumber,
    formatTime,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { cancel, reschedule } from '@/routes/trainer/sessions';
import { withdraw } from '@/routes/trainer/sessions/reschedule';
import type { AvailabilityDay } from '@/types';

/** As TrainerSessionChangeController::NOTE_MAX. */
const NOTE_MAX = 300;

/** Outline button on the black panels of the calendar and of "Panoramica". */
const darkOutline =
    'h-11 rounded-[10px] border-sidebar-foreground/25 bg-transparent px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground';

type SessionChangeActionsProps = {
    id: number;
    /** ISO UTC strings. */
    start: string;
    end: string;
    clientName: string;
    /** ISO UTC string: the time already proposed to the client, if any. */
    proposedStart: string | null;
};

/**
 * "Sposta" (a new time the client accepts) and "Annulla seduta" (with a
 * message for the client) of a confirmed session not started yet
 * (TrainerSessionChangeController). The page must send `rescheduleSlots`
 * as an optional prop (TrainerSessions::rescheduleSlots).
 */
export default function SessionChangeActions({
    id,
    start,
    end,
    clientName,
    proposedStart,
}: SessionChangeActionsProps) {
    const [moving, setMoving] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const minutes =
        (new Date(end).getTime() - new Date(start).getTime()) / 60000;

    return (
        <div className="flex flex-col gap-2.5">
            {proposedStart && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-dashed border-sidebar-foreground/30 px-3.5 py-3 text-[13px] leading-4.5">
                    <span>
                        Hai proposto{' '}
                        <strong className="tabular-nums">
                            {formatDateMedium(proposedStart)},{' '}
                            {formatTime(proposedStart)}
                        </strong>
                        : aspetti la risposta di {clientName}.
                    </span>
                    <button
                        type="button"
                        onClick={() =>
                            router.delete(withdraw.url(id), {
                                preserveScroll: true,
                            })
                        }
                        className="font-semibold underline underline-offset-4"
                    >
                        Ritira proposta
                    </button>
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className={darkOutline}
                    onClick={() => setMoving(true)}
                >
                    <CalendarClock aria-hidden="true" />
                    {proposedStart ? 'Proponi un altro orario' : 'Sposta'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className={darkOutline}
                    onClick={() => setCancelling(true)}
                >
                    <X aria-hidden="true" />
                    Annulla seduta
                </Button>
            </div>

            {moving && (
                <RescheduleDialog
                    id={id}
                    start={start}
                    minutes={minutes}
                    clientName={clientName}
                    onClose={() => setMoving(false)}
                />
            )}
            <CancelSessionDialog
                id={id}
                clientName={clientName}
                open={cancelling}
                onOpenChange={setCancelling}
            />
        </div>
    );
}

/** "Annulla seduta": a message for the client, optional, in the email. */
function CancelSessionDialog({
    id,
    clientName,
    open,
    onOpenChange,
}: {
    id: number;
    clientName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const noteId = useId();

    const submit = () =>
        router.patch(
            cancel.url(id),
            { note },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setNote('');
                    onOpenChange(false);
                },
            },
        );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Annullare la seduta?</DialogTitle>
                    <DialogDescription>
                        Avvisiamo {clientName} via email. Se la seduta fa parte
                        di un pacchetto, torna disponibile.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor={noteId} className="text-sm font-semibold">
                        Messaggio per {clientName}{' '}
                        <span className="font-normal text-muted-foreground">
                            · facoltativo
                        </span>
                    </label>
                    <Textarea
                        id={noteId}
                        value={note}
                        maxLength={NOTE_MAX}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Es. Mi dispiace, ho un imprevisto: riprenotiamo la prossima settimana?"
                        className="min-h-24"
                    />
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={() => onOpenChange(false)}
                    >
                        Torna indietro
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        className="h-10 font-semibold"
                        disabled={processing}
                        onClick={submit}
                    >
                        {processing && <Spinner />}
                        Annulla seduta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * "Sposta": the free times of the trainer (this session doesn't count),
 * loaded when the dialog opens. The client gets the proposal by email.
 */
function RescheduleDialog({
    id,
    start,
    minutes,
    clientName,
    onClose,
}: {
    id: number;
    start: string;
    minutes: number;
    clientName: string;
    onClose: () => void;
}) {
    const slots = usePage<{ rescheduleSlots?: AvailabilityDay[] | null }>()
        .props.rescheduleSlots;
    const [loaded, setLoaded] = useState(false);
    const [date, setDate] = useState<string | null>(null);
    const [chosen, setChosen] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // When the dialog opens: the free times of today, not old ones.
    useEffect(() => {
        router.reload({
            only: ['rescheduleSlots'],
            data: { sposta: id },
            onFinish: () => setLoaded(true),
        });
    }, [id]);

    const days = (loaded ? (slots ?? []) : []).filter(
        (day) =>
            freeStarts(day, minutes).filter((time) => time !== start).length >
            0,
    );
    const day = days.find((item) => item.date === date) ?? days[0];
    const times = day
        ? freeStarts(day, minutes).filter((time) => time !== start)
        : [];

    const submit = () => {
        if (!chosen) {
            return;
        }

        router.post(
            reschedule.url(id),
            { start: chosen },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: onClose,
                onError: (errors) =>
                    setError(errors.start ?? errors.booking ?? null),
            },
        );
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Proponi un nuovo orario</DialogTitle>
                    <DialogDescription>
                        Ora è {formatDateMedium(start)}, {formatTime(start)}.{' '}
                        {clientName} riceve la proposta via email: la seduta si
                        sposta solo se accetta, altrimenti resta com’è.
                    </DialogDescription>
                </DialogHeader>

                {!loaded ? (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner /> Cerco gli orari liberi…
                    </span>
                ) : days.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Non hai orari liberi nei prossimi giorni: cambia le tue
                        disponibilità, oppure annulla la seduta.
                    </p>
                ) : (
                    // min-w-0: the row of days scrolls instead of widening the dialog.
                    <div className="flex min-w-0 flex-col gap-4">
                        <div
                            role="group"
                            aria-label="Giorno"
                            className="flex min-w-0 gap-1.5 overflow-x-auto pb-1"
                        >
                            {days.map((item) => {
                                const on = item.date === day?.date;

                                return (
                                    <button
                                        key={item.date}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => {
                                            setDate(item.date);
                                            setChosen(null);
                                        }}
                                        className={cn(
                                            'flex w-14 flex-none flex-col items-center rounded-xl border py-2 text-xs',
                                            on
                                                ? 'border-foreground bg-foreground text-background'
                                                : 'bg-card hover:border-foreground',
                                        )}
                                    >
                                        {formatWeekdayShort(item.date)}
                                        <span className="text-lg leading-6 font-bold tabular-nums">
                                            {formatDayNumber(item.date)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div
                            role="group"
                            aria-label="Ora"
                            className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5"
                        >
                            {times.map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    aria-pressed={chosen === time}
                                    onClick={() => {
                                        setChosen(time);
                                        setError(null);
                                    }}
                                    className={cn(
                                        'h-10 rounded-lg border text-sm font-medium tabular-nums',
                                        chosen === time
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'bg-card hover:border-foreground',
                                    )}
                                >
                                    {formatTime(time)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={onClose}
                    >
                        Torna indietro
                    </Button>
                    <Button
                        type="button"
                        className="h-10 font-semibold"
                        disabled={!chosen || processing}
                        onClick={submit}
                    >
                        {processing && <Spinner />}
                        Invia proposta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
