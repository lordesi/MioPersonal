import { useId, useState } from 'react';
import ChoiceChips from '@/components/shared/choice-chips';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { TrainerReviewStatus } from '@/types';

/** What the team must check before publishing a profile. */
export const reviewChecks = [
    {
        id: 'identity',
        label: 'Documento d’identità valido e coerente con il nome',
    },
    {
        id: 'certificates',
        label: 'Attestati coerenti con le certificazioni dichiarate',
    },
    {
        id: 'photo',
        label: 'Foto profilo adeguata (viso visibile, niente loghi)',
    },
    { id: 'bio', label: 'Bio senza contatti, link o promesse sanitarie' },
    { id: 'prices', label: 'Servizi e prezzi plausibili' },
    { id: 'places', label: 'Indirizzi dei luoghi verificabili' },
] as const;

export type ReviewCheckId = (typeof reviewChecks)[number]['id'];

const changeReasons = [
    'Foto profilo non adatta',
    'Attestato mancante o illeggibile',
    'Bio con contatti o link',
    'Prezzi o servizi poco chiari',
    'Indirizzo non verificabile',
].map((reason) => ({ value: reason, label: reason }));

type ReviewDecisionProps = {
    status: TrainerReviewStatus;
    checked: ReviewCheckId[];
    onToggleCheck: (id: ReviewCheckId) => void;
    /** TODO: send the decision (and the message for the trainer) to the server. */
    onDecide: (status: 'approved' | 'changes' | 'rejected') => void;
    onUndo: () => void;
};

/**
 * "Controlli": the checklist and the three decisions. "Approva e pubblica"
 * works only when every check is ticked.
 */
export default function ReviewDecision({
    status,
    checked,
    onToggleCheck,
    onDecide,
    onUndo,
}: ReviewDecisionProps) {
    const titleId = useId();
    const messageId = useId();
    const rejectId = useId();
    const [mode, setMode] = useState<'changes' | 'reject' | null>(null);
    const [reasons, setReasons] = useState<string[]>([]);
    const allChecked = checked.length === reviewChecks.length;
    const decided = status === 'approved' || status === 'rejected';

    const cancel = () => {
        setMode(null);
        setReasons([]);
    };

    const decide = (decision: 'approved' | 'changes' | 'rejected') => {
        onDecide(decision);
        cancel();
    };

    return (
        <section
            aria-labelledby={titleId}
            className="sticky top-4 flex flex-col gap-3.5 rounded-[14px] border bg-card p-5"
        >
            <div className="flex items-baseline justify-between">
                <h2 id={titleId} className="font-semibold">
                    Controlli
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {checked.length} di {reviewChecks.length} controlli fatti
                </span>
            </div>

            {reviewChecks.map((check) => (
                <div key={check.id} className="flex items-start gap-2.5">
                    <Checkbox
                        id={`${titleId}-${check.id}`}
                        checked={checked.includes(check.id)}
                        onCheckedChange={() => onToggleCheck(check.id)}
                        className="mt-0.5 size-5"
                    />
                    <Label
                        htmlFor={`${titleId}-${check.id}`}
                        className="text-sm leading-5 font-normal"
                    >
                        {check.label}
                    </Label>
                </div>
            ))}

            <Separator />

            {decided && (
                <div className="flex flex-col gap-2">
                    <span className="text-sm">
                        {status === 'approved'
                            ? 'Approvato: il profilo è visibile nella ricerca.'
                            : 'Rifiutato: il trainer ha ricevuto l’email con il motivo.'}
                    </span>
                    <button
                        type="button"
                        onClick={onUndo}
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
                        disabled={!allChecked}
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
                        defaultValue="Ciao, manca poco! Ti chiediamo di sistemare questi punti e reinviare il profilo."
                    />
                    <Button
                        type="button"
                        className="h-10 font-semibold"
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
                    />
                    <Button
                        type="button"
                        variant="outline"
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
