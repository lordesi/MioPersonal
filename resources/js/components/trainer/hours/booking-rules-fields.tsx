import ConsentCheckbox from '@/components/auth/consent-checkbox';
import FormField from '@/components/auth/form-field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BookingRules, TrainerAvailability } from '@/types';

const hoursLabel = (n: number) => (n === 1 ? '1 ora' : `${n} ore`);
const minutesLabel = (n: number) => (n === 0 ? 'Nessuna' : `${n} minuti`);

/** Radix Select doesn't accept null: "Nessun limite" uses this value. */
const NO_LIMIT = 'none';

/** The options are the same as TrainerProfileRequest::RULE_OPTIONS on the server. */
const rules: {
    name: keyof BookingRules;
    /** The name of the field on the server, for its error. */
    field: string;
    label: string;
    hint: string;
    /** null = "Nessun limite". */
    options: (number | null)[];
    format: (value: number) => string;
}[] = [
    {
        name: 'noticeHours',
        field: 'notice_hours',
        label: 'Preavviso minimo',
        hint: 'Niente prenotazioni all’ultimo minuto.',
        options: [2, 6, 12, 24, 48],
        format: hoursLabel,
    },
    {
        name: 'bookingWindowDays',
        field: 'booking_window_days',
        label: 'Prenotabile fino a',
        hint: 'Oltre, il calendario è chiuso.',
        options: [14, 30, 60, 90],
        format: (n) => `${n} giorni`,
    },
    {
        name: 'breakMinutes',
        field: 'break_minutes',
        label: 'Pausa tra due sedute',
        hint: 'Per rifiatare e preparare.',
        options: [0, 15, 30],
        format: minutesLabel,
    },
    {
        name: 'maxSessionsPerDay',
        field: 'max_sessions_per_day',
        label: 'Massimo sedute al giorno',
        hint: 'Poi il giorno risulta pieno.',
        options: [2, 3, 4, 5, 6, 7, 8, 10, null],
        format: String,
    },
    {
        name: 'freeCancellationHours',
        field: 'free_cancellation_hours',
        label: 'Cancellazione',
        hint: 'La vedono i clienti prima di prenotare.',
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
    return (
        <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
                {rules.map((rule) => (
                    <FormField
                        key={rule.name}
                        label={rule.label}
                        hint={rule.hint}
                        error={errors[rule.field]}
                    >
                        {({ id, describedBy }) => (
                            <Select
                                value={String(values[rule.name] ?? NO_LIMIT)}
                                onValueChange={(value) =>
                                    onChange({
                                        rules: {
                                            ...values,
                                            [rule.name]:
                                                value === NO_LIMIT
                                                    ? null
                                                    : Number(value),
                                        },
                                    })
                                }
                            >
                                <SelectTrigger
                                    id={id}
                                    aria-describedby={describedBy}
                                    className="h-10 w-full tabular-nums"
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
                        )}
                    </FormField>
                ))}
            </div>

            <div className="rounded-lg bg-muted p-3">
                <ConsentCheckbox
                    name="auto_confirm"
                    checked={autoConfirm}
                    onCheckedChange={(checked) =>
                        onChange({ autoConfirm: checked })
                    }
                >
                    <span className="flex flex-col">
                        <span className="font-semibold">
                            Conferma automatica
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Se attiva, le prenotazioni sono confermate subito.
                            Se no, hai 24 ore per rispondere.
                        </span>
                    </span>
                </ConsentCheckbox>
            </div>
        </>
    );
}
