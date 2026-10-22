import { Plus, Trash2 } from 'lucide-react';
import type { CSSProperties } from 'react';
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
    NEW_SESSION_NAME,
    removeDuration,
    shortDuration,
} from '@/components/trainer/services/pricing';
import SectionCard from '@/components/trainer/services/section-card';
import { Button } from '@/components/ui/button';
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

/** The text fields of a row: white, black border when focused. */
const fieldClassName =
    'w-full min-w-0 rounded-[10px] border bg-card px-3 outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 aria-invalid:border-destructive';

/** Name, one 104 px column per duration, the bin: header and rows line up. */
function gridColumns(columns: number[]): CSSProperties {
    return {
        gridTemplateColumns: `minmax(0, 1fr) ${columns.map(() => '104px').join(' ')} 40px`,
    };
}

/**
 * "Listino": one row for each kind of session, one column for each
 * duration. A cell is a price; an empty cell is a duration not offered.
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

    // A new row starts empty: its prices are written in the cells.
    const addSession = () =>
        onChange([
            ...sessions,
            { name: '', prices: [], note: '', online: [], onlineNote: '' },
        ]);

    return (
        <SectionCard
            step={1}
            title="Listino"
            description="Una riga per ogni tipo di seduta, una colonna per ogni durata. Le celle vuote non compaiono sul profilo."
            errors={errors}
        >
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary p-3">
                <span
                    id={columnsLabelId}
                    className="mr-1 text-[13px] leading-4.5 font-semibold"
                >
                    Durate offerte
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

            <div className="overflow-x-auto">
                <div className="flex min-w-115 flex-col gap-2.5">
                    <div
                        aria-hidden="true"
                        className="grid gap-2.5 px-3.25 text-xs font-semibold tracking-[0.04em] text-muted-foreground"
                        style={gridColumns(columns)}
                    >
                        <span>Tipo di seduta</span>
                        {columns.map((minutes) => (
                            <span key={minutes} className="text-right">
                                {shortDuration(minutes)}
                            </span>
                        ))}
                        <span />
                    </div>

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
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-input px-4 font-semibold shadow-none"
                    disabled={sessions.length >= MAX_SESSION_TYPES}
                    onClick={addSession}
                >
                    <Plus aria-hidden="true" strokeWidth={2.5} />
                    Aggiungi un tipo di seduta
                </Button>
                <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                    {sessions.length} di {MAX_SESSION_TYPES} · es. calisthenics
                    e crossfit a prezzi diversi
                </span>
            </div>
        </SectionCard>
    );
}

/** A kind of session: name and note, then a price cell for each column. */
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

    // A written price offers the duration, an emptied cell takes it away.
    const setPrice = (minutes: number, priceCents: number | null) => {
        if (priceCents === null) {
            onChange(removeDuration(session, minutes));

            return;
        }

        const others = session.prices.filter(
            (price) => price.minutes !== minutes,
        );

        onChange({
            ...session,
            prices: [...others, { minutes, priceCents }].sort(
                (a, b) => a.minutes - b.minutes,
            ),
        });
    };

    return (
        <div className="rounded-2xl border bg-secondary/50 p-3">
            <div
                className="grid items-start gap-2.5"
                style={gridColumns(columns)}
            >
                <div className="flex min-w-0 flex-col gap-2">
                    <input
                        aria-label="Nome del tipo di seduta"
                        aria-invalid={nameError !== null}
                        required
                        maxLength={SESSION_NAME_MAX}
                        placeholder="Es. Calisthenics"
                        className={`${fieldClassName} h-11 text-[15px] font-semibold`}
                        value={session.name}
                        onChange={(event) =>
                            onChange({ ...session, name: event.target.value })
                        }
                    />
                    {nameError && (
                        <p className="text-xs text-destructive">{nameError}</p>
                    )}
                    <input
                        aria-label={`Nota sotto ${name}`}
                        maxLength={NOTE_MAX}
                        placeholder="Nota: es. a domicilio o al parco"
                        className={`${fieldClassName} h-9.5 text-[13px]`}
                        value={session.note}
                        onChange={(event) =>
                            onChange({ ...session, note: event.target.value })
                        }
                    />
                    {session.prices.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            Scrivi il prezzo di almeno una durata.
                        </p>
                    )}
                </div>

                {columns.map((minutes) => (
                    <EuroInput
                        key={minutes}
                        aria-label={`Prezzo ${name} ${formatDuration(minutes)}`}
                        value={
                            session.prices.find(
                                (price) => price.minutes === minutes,
                            )?.priceCents ?? null
                        }
                        onChange={(cents) => setPrice(minutes, cents)}
                    />
                ))}

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-10 text-muted-foreground"
                    aria-label={`Rimuovi ${name}`}
                    disabled={!onRemove}
                    onClick={onRemove}
                >
                    <Trash2 />
                </Button>
            </div>
        </div>
    );
}
