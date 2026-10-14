import { useId, useState } from 'react';
import ChoiceChips from '@/components/shared/choice-chips';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TrainerReviewStatus } from '@/types';

const changeReasons = [
    'Foto profilo non adatta',
    'Attestato mancante o illeggibile',
    'Bio con contatti o link',
    'Prezzi o servizi poco chiari',
    'Indirizzo non verificabile',
].map((reason) => ({ value: reason, label: reason }));

export type ReviewDecisionPayload = {
    decision: 'approved' | 'changes' | 'rejected';
    /** The chips of "Cosa deve sistemare?". */
    reasons: string[];
    /** For the trainer, sent by email. */
    message: string;
};

const defaultChangesMessage =
    'Ciao, manca poco! Ti chiediamo di sistemare questi punti e reinviare il profilo.';

type ReviewDecisionProps = {
    status: TrainerReviewStatus;
    onDecide: (payload: ReviewDecisionPayload) => void;
    onUndo: () => void;
    /** A decision is being sent. */
    processing: boolean;
    /** From the server, e.g. a missing reason for the rejection. */
    error?: string;
};

/** "Decisione": approve, ask for changes or reject the profile. */
export default function ReviewDecision({
    status,
    onDecide,
    onUndo,
    processing,
    error,
}: ReviewDecisionProps) {
    const titleId = useId();
    const messageId = useId();
    const rejectId = useId();
    const [mode, setMode] = useState<'changes' | 'reject' | null>(null);
    const [reasons, setReasons] = useState<string[]>([]);
    const [changesMessage, setChangesMessage] = useState(defaultChangesMessage);
    const [rejectMessage, setRejectMessage] = useState('');
    // "Chiedi modifiche" is a decision too: the trainer has to send the profile again.
    const decided = status !== 'review';

    const cancel = () => {
        setMode(null);
        setReasons([]);
        setChangesMessage(defaultChangesMessage);
        setRejectMessage('');
    };

    const decide = (decision: ReviewDecisionPayload['decision']) =>
        onDecide({
            decision,
            reasons: decision === 'changes' ? reasons : [],
            message:
                decision === 'changes'
                    ? changesMessage
                    : decision === 'rejected'
                      ? rejectMessage
                      : '',
        });

    return (
        <section
            aria-labelledby={titleId}
            className="sticky top-4 flex flex-col gap-3.5 rounded-[14px] border bg-card p-5"
        >
            <h2 id={titleId} className="font-semibold">
                Decisione
            </h2>

            {decided && (
                <div className="flex flex-col gap-2">
                    <span className="text-sm">
                        {
                            {
                                approved:
                                    'Approvato: il profilo è visibile nella ricerca.',
                                changes:
                                    'Modifiche richieste: il trainer le sistema e reinvia il profilo.',
                                rejected:
                                    'Rifiutato: il trainer ha ricevuto l’email con il motivo.',
                                review: '',
                            }[status]
                        }
                    </span>
                    <button
                        type="button"
                        onClick={onUndo}
                        disabled={processing}
                        className="h-8 self-start text-[13px] underline"
                    >
                        Annulla decisione
                    </button>
                </div>
            )}

            {!decided && mode === null && (
                <div className="flex flex-col gap-2">
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={() => decide('approved')}
                        className="h-10 font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                    >
                        Approva e pubblica
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={() => setMode('changes')}
                    >
                        Chiedi modifiche
                    </Button>
                    <button
                        type="button"
                        onClick={() => setMode('reject')}
                        className="h-9 text-sm font-medium underline"
                    >
                        Rifiuta
                    </button>
                    <span className="text-xs text-muted-foreground">
                        «Approva» si attiva quando hai spuntato tutti i
                        controlli.
                    </span>
                </div>
            )}

            {!decided && mode === 'changes' && (
                <div className="flex flex-col gap-2.5">
                    <span className="text-sm font-semibold">
                        Cosa deve sistemare?
                    </span>
                    <ChoiceChips
                        multiple
                        options={changeReasons}
                        value={reasons}
                        onChange={setReasons}
                        aria-label="Cosa deve sistemare?"
                        className="gap-1.5"
                    />
                    <Label htmlFor={messageId} className="text-[13px]">
                        Messaggio per il trainer
                    </Label>
                    <Textarea
                        id={messageId}
                        rows={3}
                        value={changesMessage}
                        onChange={(event) =>
                            setChangesMessage(event.target.value)
                        }
                    />
                    <Button
                        type="button"
                        className="h-10 font-semibold"
                        disabled={processing}
                        onClick={() => decide('changes')}
                    >
                        Invia richiesta
                    </Button>
                    <button
                        type="button"
                        onClick={cancel}
                        className="h-8 text-[13px] underline"
                    >
                        Annulla
                    </button>
                </div>
            )}

            {!decided && mode === 'reject' && (
                <div className="flex flex-col gap-2.5">
                    <Label htmlFor={rejectId} className="font-semibold">
                        Motivo del rifiuto
                    </Label>
                    <Textarea
                        id={rejectId}
                        rows={3}
                        placeholder="Il trainer lo riceverà via email"
                        value={rejectMessage}
                        onChange={(event) =>
                            setRejectMessage(event.target.value)
                        }
                        aria-invalid={!!error}
                    />
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        disabled={processing || rejectMessage.trim() === ''}
                        className="h-10 border-[1.5px] border-foreground font-semibold"
                        onClick={() => decide('rejected')}
                    >
                        Conferma rifiuto
                    </Button>
                    <button
                        type="button"
                        onClick={cancel}
                        className="h-8 text-[13px] underline"
                    >
                        Annulla
                    </button>
                </div>
            )}
        </section>
    );
}
