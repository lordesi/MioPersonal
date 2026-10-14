import { useId } from 'react';
import SwitchRow from '@/components/shared/switch-row';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BookingRules } from '@/types';

const hours = (n: number) => (n === 1 ? '1 ora' : `${n} ore`);
const minutes = (n: number) => (n === 0 ? 'Nessuna' : `${n} minuti`);

/** Radix Select doesn't accept null: "Nessun limite" uses this value. */
const NO_LIMIT = 'none';

/** Each rule with the choices the trainer can pick from (null = "Nessun limite"). */
const ruleFields: {
    name: keyof BookingRules;
    label: string;
    hint: string | ((value: number) => string);
    options: (number | null)[];
    format: (value: number | null) => string;
}[] = [
    {
        name: 'noticeHours',
        label: 'Preavviso minimo',
        hint: (value) =>
            `Nessuno può prenotare uno slot che inizia tra meno di ${hours(value)}.`,
        options: [2, 6, 12, 24, 48],
        format: (n) => hours(n ?? 0),
    },
    {
        name: 'bookingWindowDays',
        label: 'Si può prenotare fino a',
        hint: 'Oltre questa data il calendario risulta chiuso.',
        options: [14, 30, 60, 90],
        format: (n) => `${n} giorni`,
    },
    {
        name: 'breakMinutes',
        label: 'Pausa tra due sedute',
        hint: 'Aggiunta dopo ogni seduta.',
        options: [0, 15, 30],
        format: (n) => minutes(n ?? 0),
    },
    {
        name: 'maxSessionsPerDay',
        label: 'Massimo sedute al giorno',
        hint: 'Raggiunto il limite, il giorno risulta pieno.',
        options: [2, 3, 4, 5, 6, 7, 8, 10, null],
        format: (n) => (n === null ? 'Nessun limite' : String(n)),
    },
    {
        name: 'confirmHours',
        label: 'Tempo per confermare',
        hint: 'Poi la prenotazione decade e lo slot torna libero.',
        options: [12, 24],
        format: (n) => hours(n ?? 0),
    },
    {
        name: 'freeCancellationHours',
        label: 'Cancellazione',
        hint: 'Mostrata sul profilo e nelle email.',
        options: [12, 24, 48],
        format: (n) => `Fino a ${n} ore prima`,
    },
];

type BookingRulesCardProps = {
    rules: BookingRules;
    onRulesChange: (rules: BookingRules) => void;
    autoConfirm: boolean;
    onAutoConfirmChange: (autoConfirm: boolean) => void;
};

/** Booking rules: automatic confirmation, notice, breaks, limits. */
export default function BookingRulesCard({
    rules,
    onRulesChange,
    autoConfirm,
    onAutoConfirmChange,
}: BookingRulesCardProps) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className="flex flex-[1_1_380px] flex-col gap-1 rounded-xl border bg-card p-4 md:p-5"
        >
            <h2 id={titleId} className="mb-2 text-lg font-semibold">
                Regole di prenotazione
            </h2>

            <SwitchRow
                label="Conferma automatica"
                description={
                    autoConfirm
                        ? 'Attiva: le prenotazioni sono confermate subito'
                        : 'Disattivata: confermi tu ogni prenotazione'
                }
                checked={autoConfirm}
                onCheckedChange={onAutoConfirmChange}
                className="rounded-lg bg-muted p-3"
            />

            {ruleFields.map((field) => (
                <RuleRow
                    key={field.name}
                    {...field}
                    value={rules[field.name]}
                    onChange={(value) =>
                        onRulesChange({ ...rules, [field.name]: value })
                    }
                />
            ))}
        </section>
    );
}

function RuleRow({
    label,
    hint,
    options,
    format,
    value,
    onChange,
}: (typeof ruleFields)[number] & {
    value: number | null;
    onChange: (value: number | null) => void;
}) {
    const labelId = useId();

    return (
        <div className="flex items-center gap-3 border-b py-3 last:border-b-0">
            <div className="flex min-w-0 flex-1 flex-col">
                <span id={labelId} className="text-sm font-semibold">
                    {label}
                </span>
                <span className="text-xs text-muted-foreground">
                    {typeof hint === 'function' ? hint(value ?? 0) : hint}
                </span>
            </div>
            <Select
                value={String(value ?? NO_LIMIT)}
                onValueChange={(selected) =>
                    onChange(selected === NO_LIMIT ? null : Number(selected))
                }
            >
                <SelectTrigger
                    aria-labelledby={labelId}
                    className="h-9 w-auto flex-none tabular-nums"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem
                            key={option ?? NO_LIMIT}
                            value={String(option ?? NO_LIMIT)}
                        >
                            {format(option)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
