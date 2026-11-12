import { router } from '@inertiajs/react';
import { Flame } from 'lucide-react';
import { useId, useState } from 'react';
import TrainerClientRecordsController from '@/actions/App/Http/Controllers/TrainerClientRecordsController';
import WeekBars from '@/components/client/progress/week-bars';
import FormField from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    formatAgo,
    formatDayMonthShort,
    formatWeekdayShort,
} from '@/lib/format';
import type { TrainerClient } from '@/types';

/** As in TrainerClient::SHARED_NOTE_MAX. */
const SHARED_NOTE_MAX = 500;

/**
 * "Progressi" in the card of "Clienti": the client's "Panoramica", only
 * while the client shares it with this trainer.
 */
export function ClientProgress({ client }: { client: TrainerClient }) {
    const titleId = useId();
    const progress = client.progress;
    const firstName = client.name.split(' ')[0];

    return (
        <section aria-labelledby={titleId} className="flex flex-col gap-3">
            <h3 id={titleId} className="text-[15px] leading-5.5 font-semibold">
                Progressi
            </h3>

            {progress === null ? (
                <p className="text-sm text-muted-foreground">
                    {firstName} non condivide i progressi con te. Può farlo
                    dalla sua Panoramica.
                </p>
            ) : (
                <>
                    <dl className="grid grid-cols-3 gap-2 text-center">
                        {[
                            {
                                label: 'Questa settimana',
                                value: progress.goal
                                    ? `${progress.thisWeek}/${progress.goal}`
                                    : String(progress.thisWeek),
                            },
                            {
                                label: 'Questo mese',
                                value: String(progress.thisMonth),
                            },
                            {
                                label: 'In totale',
                                value: String(progress.total),
                            },
                        ].map((number) => (
                            <div
                                key={number.label}
                                className="flex flex-col gap-0.5 rounded-xl bg-secondary/70 p-2.5"
                            >
                                <dt className="text-xs text-muted-foreground">
                                    {number.label}
                                </dt>
                                <dd className="text-xl font-bold tabular-nums">
                                    {number.value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                        <Flame aria-hidden="true" className="size-4" />
                        {progress.streak === 1
                            ? '1 settimana con l’obiettivo raggiunto'
                            : `${progress.streak} settimane di fila con l’obiettivo raggiunto`}
                    </span>

                    {progress.total > 0 && (
                        <WeekBars weeks={progress.weeks} goal={progress.goal} />
                    )}

                    {progress.recent.length > 0 && (
                        <ul className="flex flex-col divide-y text-sm">
                            {progress.recent.map((entry, index) => (
                                <li
                                    key={`${entry.date}-${index}`}
                                    className="flex gap-3 py-1.5"
                                >
                                    <span className="w-17 flex-none text-muted-foreground tabular-nums">
                                        {formatWeekdayShort(entry.date)}{' '}
                                        {formatDayMonthShort(entry.date)}
                                    </span>
                                    <span className="min-w-0 truncate">
                                        {entry.label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {progress.weights && progress.weights.length > 0 && (
                        <p className="text-sm tabular-nums">
                            Peso:{' '}
                            <span className="font-semibold">
                                {progress.weights
                                    .at(-1)!
                                    .kg.toLocaleString('it-IT')}{' '}
                                kg
                            </span>{' '}
                            <span className="text-muted-foreground">
                                il{' '}
                                {formatDayMonthShort(
                                    progress.weights.at(-1)!.date,
                                )}
                                {progress.weights.length > 1 &&
                                    ` (era ${progress.weights[0].kg.toLocaleString('it-IT')} kg il ${formatDayMonthShort(progress.weights[0].date)})`}
                            </span>
                        </p>
                    )}
                </>
            )}
        </section>
    );
}

/**
 * "Nota per il cliente": a few lines the client reads on top of their
 * "Panoramica", with a notice in the bell. Not a chat: the client doesn't
 * answer here. Only for who has an account.
 */
export function SharedNote({ client }: { client: TrainerClient }) {
    const [note, setNote] = useState(client.sharedNote ?? '');
    const [error, setError] = useState<string | undefined>();
    const [processing, setProcessing] = useState(false);
    const [now] = useState(() => new Date());
    const firstName = client.name.split(' ')[0];

    const save = () =>
        router.patch(
            TrainerClientRecordsController.update.url(client.recordId),
            { shared_note: note },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setError(undefined),
                onError: (errors) => setError(errors.shared_note),
            },
        );

    return (
        <section
            aria-label="Nota per il cliente"
            className="flex flex-col gap-2.5"
        >
            <FormField
                label="Nota per il cliente"
                error={error}
                counter={{ length: note.length, max: SHARED_NOTE_MAX }}
                hint={`${firstName} la legge nella sua Panoramica e riceve un avviso.${client.sharedNoteAt ? ` Ultima modifica ${formatAgo(client.sharedNoteAt, now)}.` : ''}`}
            >
                {({ id, describedBy }) => (
                    <Textarea
                        id={id}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        maxLength={SHARED_NOTE_MAX}
                        rows={3}
                        placeholder="Es. Ottima settimana! Per giovedì porta le scarpe da corsa."
                        aria-describedby={describedBy}
                        aria-invalid={!!error}
                        className="rounded-xl px-3.5 py-3 text-[15px] leading-5.5 md:text-[15px]"
                    />
                )}
            </FormField>
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    disabled={note === (client.sharedNote ?? '') || processing}
                    onClick={save}
                    className="h-11 rounded-xl px-4.5 font-semibold"
                >
                    {note.trim() === '' && client.sharedNote
                        ? 'Togli la nota'
                        : 'Invia la nota'}
                </Button>
            </div>
        </section>
    );
}
