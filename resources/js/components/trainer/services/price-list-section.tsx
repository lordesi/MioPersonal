import { Plus, Trash2, X } from 'lucide-react';
import { useId } from 'react';
import type { SessionType } from '@/components/onboarding/trainer/draft';
import {
    MAX_SESSION_TYPES,
    NOTE_MAX,
    SESSION_NAME_MAX,
    sessionNameError,
} from '@/components/onboarding/trainer/draft';
import ChoiceChips from '@/components/shared/choice-chips';
import EuroInput from '@/components/trainer/services/euro-input';
import {
    addDuration,
    NEW_SESSION_NAME,
    removeDuration,
    shortDuration,
} from '@/components/trainer/services/pricing';
import SectionCard from '@/components/trainer/services/section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SESSION_MINUTES } from '@/lib/booking';
import { formatDuration } from '@/lib/format';

type PriceListSectionProps = {
    sessions: SessionType[];
    onChange: (sessions: SessionType[]) => void;
    /** The durations shown as columns, shortest first. */
    columns: number[];
    onColumnsChange: (columns: number[]) => void;
    errors: string[];
};

/**
 * "Listino": one row for each kind of session, one column for each
 * duration. A cell is a price, or "Offri" when that duration isn't offered.
 */
export default function PriceListSection({
    sessions,
    onChange,
    columns,
    onColumnsChange,
    errors,
}: PriceListSectionProps) {
    const columnsLabelId = useId();
    const changeSession = (index: number, session: SessionType) =>
        onChange(sessions.map((item, i) => (i === index ? session : item)));

    // A column taken away takes its prices from every row; one stays.
    const changeColumns = (values: string[]) => {
        const next = values.map(Number).sort((a, b) => a - b);

        if (next.length === 0) {
            return;
        }

        const removed = columns.filter((minutes) => !next.includes(minutes));

        if (removed.length > 0) {
            onChange(
                sessions.map((session) =>
                    removed.reduce(removeDuration, session),
                ),
            );
        }

        onColumnsChange(next);
    };

    // A new row starts with the first column, its price to write.
    const addSession = () =>
        onChange([
            ...sessions,
            {
                name: '',
                prices: [{ minutes: columns[0], priceCents: null }],
                note: '',
                online: [],
                onlineNote: '',
            },
        ]);

    return (
        <SectionCard
            title="Listino"
            description="Una riga per ogni tipo di seduta, una colonna per ogni durata. Le celle vuote non compaiono sul profilo."
            errors={errors}
        >
            <div className="flex flex-wrap items-center gap-2.5 rounded-lg bg-muted p-3">
                <span id={columnsLabelId} className="text-[13px] font-semibold">
                    Colonne:
                </span>
                <ChoiceChips
                    multiple
                    aria-labelledby={columnsLabelId}
                    className="gap-1.5"
                    options={SESSION_MINUTES.map((minutes) => ({
                        value: String(minutes),
                        label: shortDuration(minutes),
                    }))}
                    value={columns.map(String)}
                    onChange={changeColumns}
                />
            </div>

            {/* relative: the sr-only header stays inside the scrolling box. */}
            <div className="relative overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                            <th
                                scope="col"
                                className="min-w-48 pr-3 pb-2.5 font-semibold"
                            >
                                Tipo di seduta
                            </th>
                            {columns.map((minutes) => (
                                <th
                                    key={minutes}
                                    scope="col"
                                    className="px-2 pb-2.5 font-semibold tabular-nums"
                                >
                                    {shortDuration(minutes)}
                                </th>
                            ))}
                            <th scope="col" className="pb-2.5">
                                <span className="sr-only">Azioni</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session, index) => (
                            <SessionRow
                                key={index}
                                session={session}
                                columns={columns}
                                nameError={
                                    // Empty is only "required": no message while it's being written.
                                    session.name.trim() === ''
                                        ? null
                                        : sessionNameError(sessions, index)
                                }
                                onChange={(next) => changeSession(index, next)}
                                onRemove={
                                    sessions.length > 1
                                        ? () =>
                                              onChange(
                                                  sessions.filter(
                                                      (_, i) => i !== index,
                                                  ),
                                              )
                                        : undefined
                                }
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    disabled={sessions.length >= MAX_SESSION_TYPES}
                    onClick={addSession}
                >
                    <Plus aria-hidden="true" />
                    Aggiungi un tipo di seduta
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {sessions.length} di {MAX_SESSION_TYPES} · es. calisthenics
                    e crossfit a prezzi diversi
                </span>
            </div>
        </SectionCard>
    );
}

/** A kind of session: name and note, then a cell for each column. */
function SessionRow({
    session,
    columns,
    nameError,
    onChange,
    onRemove,
}: {
    session: SessionType;
    columns: number[];
    nameError: string | null;
    onChange: (session: SessionType) => void;
    /** Missing for the only row: at least one is needed. */
    onRemove?: () => void;
}) {
    const name = session.name.trim() || NEW_SESSION_NAME;

    const setPrice = (minutes: number, priceCents: number | null) =>
        onChange({
            ...session,
            prices: session.prices.map((price) =>
                price.minutes === minutes ? { ...price, priceCents } : price,
            ),
        });

    return (
        <tr className="border-t align-top">
            <td className="py-3 pr-3">
                <div className="flex flex-col gap-1.5">
                    <Input
                        aria-label="Nome del tipo di seduta"
                        aria-invalid={nameError !== null}
                        required
                        maxLength={SESSION_NAME_MAX}
                        placeholder="Es. Calisthenics"
                        className="h-10 text-[15px] font-semibold md:text-[15px]"
                        value={session.name}
                        onChange={(event) =>
                            onChange({ ...session, name: event.target.value })
                        }
                    />
                    {nameError && (
                        <p className="text-xs text-destructive">{nameError}</p>
                    )}
                    <Input
                        aria-label="Nota sotto il servizio"
                        maxLength={NOTE_MAX}
                        placeholder="Nota: es. a domicilio o al parco"
                        className="h-8 text-[13px] text-muted-foreground md:text-[13px]"
                        value={session.note}
                        onChange={(event) =>
                            onChange({ ...session, note: event.target.value })
                        }
                    />
                    {session.prices.length === 0 && (
                        <p className="text-xs text-destructive">
                            Offri almeno una durata.
                        </p>
                    )}
                </div>
            </td>
            {columns.map((minutes) => {
                const price = session.prices.find(
                    (item) => item.minutes === minutes,
                );
                const duration = formatDuration(minutes);

                return (
                    <td key={minutes} className="px-2 py-3">
                        {price ? (
                            <div className="flex items-center gap-1">
                                <EuroInput
                                    aria-label={`Prezzo ${name} ${duration}`}
                                    required
                                    className="w-22"
                                    value={price.priceCents}
                                    onChange={(cents) =>
                                        setPrice(minutes, cents)
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-muted-foreground"
                                    aria-label={`Togli ${duration} da ${name}`}
                                    onClick={() =>
                                        onChange(
                                            removeDuration(session, minutes),
                                        )
                                    }
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 w-30 border-dashed bg-transparent text-[13px] font-normal text-muted-foreground shadow-none"
                                aria-label={`Aggiungi ${duration} a ${name}`}
                                onClick={() =>
                                    onChange(addDuration(session, minutes))
                                }
                            >
                                <Plus aria-hidden="true" />
                                Offri
                            </Button>
                        )}
                    </td>
                );
            })}
            <td className="py-3 text-right">
                {onRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-10 text-muted-foreground"
                        aria-label={`Elimina ${name}`}
                        onClick={onRemove}
                    >
                        <Trash2 />
                    </Button>
                )}
            </td>
        </tr>
    );
}
