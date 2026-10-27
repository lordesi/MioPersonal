import { useId } from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatHours } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { BookingRules, TrainerAvailability } from '@/types';

/** Radix Select doesn't accept null: "Nessun limite" uses this value. */
const NO_LIMIT = 'none';

/** The options are the same as TrainerProfileRequest::RULE_OPTIONS on the server. */
const rules: {
    name: keyof BookingRules;
    /** The name of the field on the server, for its error. */
    field: string;
    label: string;
    /** null = "Nessun limite". */
    options: (number | null)[];
    format: (value: number) => string;
}[] = [
    {
        name: 'noticeHours',
        field: 'notice_hours',
        label: 'Preavviso minimo',
        options: [2, 6, 12, 24, 48],
        format: formatHours,
    },
    {
        name: 'bookingWindowDays',
        field: 'booking_window_days',
        label: 'Prenotabile fino a',
        options: [14, 30, 60, 90],
        format: (n) => `${n} giorni`,
    },
    {
        name: 'breakMinutes',
        field: 'break_minutes',
        label: 'Pausa tra due sedute',
        options: [0, 15, 30],
        format: (n) => (n === 0 ? 'Nessuna' : `${n} min`),
    },
    {
        name: 'maxSessionsPerDay',
        field: 'max_sessions_per_day',
        label: 'Massimo sedute al giorno',
        options: [2, 3, 4, 5, 6, 7, 8, 10, null],
        format: String,
    },
    {
        name: 'freeCancellationHours',
        field: 'free_cancellation_hours',
        label: 'Cancellazione',
        options: [12, 24, 48],
        format: (n) => `Fino a ${n} ore prima`,
    },
];

type RulesValue = Omit<TrainerAvailability, 'hours'>;

type BookingRulesFieldsProps = RulesValue & {
    onChange: (changes: Partial<RulesValue>) => void;
    /** From the server, by field name (e.g. "notice_hours"). */
    errors?: Partial<Record<string, string>>;
};

/**
 * "Regole di prenotazione": the rules and the auto-confirm, used by step 5
 * of "Diventa trainer" and by "Disponibilità". The durations are chosen with
 * their prices in "Servizi e prezzi".
 */
export default function BookingRulesFields({
    rules: values,
    autoConfirm,
    onChange,
    errors = {},
}: BookingRulesFieldsProps) {
    const autoHintId = useId();

    return (
        <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-x-4 gap-y-4.5">
                {rules.map((rule) => (
                    <RuleField
                        key={rule.name}
                        rule={rule}
                        value={values[rule.name]}
                        error={errors[rule.field]}
                        onChange={(value) =>
                            onChange({
                                rules: { ...values, [rule.name]: value },
                            })
                        }
                    />
                ))}
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={autoConfirm}
                aria-describedby={autoHintId}
                onClick={() => onChange({ autoConfirm: !autoConfirm })}
                className={cn(
                    'flex w-full items-center justify-between gap-4 rounded-2xl border px-4.5 py-4 text-left transition-colors',
                    autoConfirm
                        ? 'border-foreground bg-foreground text-background'
                        : 'bg-secondary/60 hover:bg-secondary',
                )}
            >
                <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        Conferma automatica
                    </span>
                    <span
                        id={autoHintId}
                        className={cn(
                            'text-[13px] leading-4.5',
                            autoConfirm
                                ? 'text-sidebar-muted-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        Se attiva, le prenotazioni sono confermate da subito.
                        Altrimenti, hai 24 ore di tempo per rispondere.
                    </span>
                </span>
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex h-7 w-12 flex-none rounded-full p-0.75 transition-colors',
                        autoConfirm
                            ? 'justify-end bg-background'
                            : 'justify-start bg-input',
                    )}
                >
                    <span
                        className={cn(
                            'size-5.5 rounded-full shadow-sm',
                            autoConfirm ? 'bg-foreground' : 'bg-background',
                        )}
                    />
                </span>
            </button>
        </>
    );
}

/** A rule: label, menu with its options and the server's error. */
function RuleField({
    rule,
    value,
    error,
    onChange,
}: {
    rule: (typeof rules)[number];
    value: number | null;
    error?: string;
    onChange: (value: number | null) => void;
}) {
    const id = useId();
    const errorId = `${id}-error`;

    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="font-semibold">
                {rule.label}
            </Label>
            <Select
                value={String(value ?? NO_LIMIT)}
                onValueChange={(next) =>
                    onChange(next === NO_LIMIT ? null : Number(next))
                }
            >
                <SelectTrigger
                    id={id}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? true : undefined}
                    className="w-full rounded-xl bg-card px-3.5 text-[15px] font-medium tabular-nums shadow-none focus-visible:border-foreground focus-visible:ring-foreground/10 data-[size=default]:h-11.5 [&_svg:not([class*='text-'])]:text-foreground"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {rule.options.map((option) => (
                        <SelectItem
                            key={option ?? NO_LIMIT}
                            value={String(option ?? NO_LIMIT)}
                        >
                            {option === null
                                ? 'Nessun limite'
                                : rule.format(option)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && (
                <p id={errorId} className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
