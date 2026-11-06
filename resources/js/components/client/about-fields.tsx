import { Check, Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import type {
    BirthYears,
    PreferencesData,
} from '@/components/client/preferences-fields';
import { Field, pillClassName } from '@/components/client/profile-field';
import NumberedSection from '@/components/trainer/area/numbered-section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

type Option = { value: string; label: string };

/** The values of App\Enums\Sex; no answer = "Preferisco non dirlo". */
const sexes: Option[] = [
    { value: 'female', label: 'Donna' },
    { value: 'male', label: 'Uomo' },
    { value: 'other', label: 'Altro' },
];

/** The values of App\Enums\FitnessLevel. */
const fitnessLevels: Option[] = [
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzato' },
];

/** The values of App\Enums\TrainingExperience. */
const trainingExperiences: Option[] = [
    { value: 'never', label: 'Non mi sono mai allenato' },
    { value: 'under_1', label: 'Meno di 1 anno' },
    { value: '1_3', label: 'Da 1 a 3 anni' },
    { value: '3_5', label: 'Da 3 a 5 anni' },
    { value: 'over_5', label: 'Più di 5 anni' },
];

/** The values of App\Enums\ActivityLevel. */
const activityLevels: Option[] = [
    { value: 'sedentary', label: 'Sedentario' },
    { value: 'light', label: 'Poco attivo' },
    { value: 'active', label: 'Attivo' },
    { value: 'very_active', label: 'Molto attivo' },
];

/** As in ClientPreferencesRequest. */
const SESSIONS_PER_WEEK = [1, 2, 3, 4, 5, 6, 7];
const SPORTS_MAX = 8;
const SPORT_MAX_LENGTH = 40;
const TRAINER_NOTE_MAX_LENGTH = 500;
const HEIGHT_MIN_CM = 120;
const HEIGHT_MAX_CM = 230;
const WEIGHT_MIN_KG = 35;
const WEIGHT_MAX_KG = 250;

/** Radix Select doesn't accept '' as a value, so "no answer" uses this one. */
const NONE = 'none';

type AboutFieldsProps = {
    step: number;
    data: PreferencesData;
    setData: <K extends keyof PreferencesData>(
        key: K,
        value: PreferencesData[K],
    ) => void;
    birthYears: BirthYears;
};

/**
 * "Su di te": what the trainers the client books read before the first
 * session (App\Support\ClientAbout). Everything optional; height and weight
 * only with their own consent, and unticking it deletes them.
 */
export default function AboutFields({
    step,
    data,
    setData,
    birthYears,
}: AboutFieldsProps) {
    const birthYearId = useId();
    const experienceId = useId();
    const noteId = useId();
    const noteHintId = useId();
    const consentId = useId();
    const heightId = useId();
    const weightId = useId();

    const years: number[] = [];

    for (let year = birthYears.from; year >= birthYears.to; year--) {
        years.push(year);
    }

    return (
        <NumberedSection
            step={step}
            title={
                <>
                    Su di te{' '}
                    <span className="text-sm font-medium text-muted-foreground">
                        · facoltativo
                    </span>
                </>
            }
            description="Lo leggono solo i trainer a cui chiedi una seduta: li aiuta a prepararla su misura per te."
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label htmlFor={birthYearId} className="font-semibold">
                        Anno di nascita
                    </Label>
                    <Select
                        value={
                            data.birth_year === null
                                ? NONE
                                : String(data.birth_year)
                        }
                        onValueChange={(year) =>
                            setData(
                                'birth_year',
                                year === NONE ? null : Number(year),
                            )
                        }
                    >
                        <SelectTrigger
                            id={birthYearId}
                            className="h-12! rounded-xl bg-card px-3.5 text-[15px] font-medium"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE}>Non indicato</SelectItem>
                            {years.map((year) => (
                                <SelectItem key={year} value={String(year)}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Field label="Sesso">
                    {(labelId) => (
                        <ToggleGroup
                            type="single"
                            aria-labelledby={labelId}
                            value={data.sex ?? ''}
                            // A second click on the chosen one takes the answer away.
                            onValueChange={(sex) =>
                                setData('sex', sex === '' ? null : sex)
                            }
                            className="flex-wrap gap-2"
                        >
                            {sexes.map((option) => (
                                <ToggleGroupItem
                                    key={option.value}
                                    value={option.value}
                                    className={pillClassName}
                                >
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    )}
                </Field>
            </div>

            <div aria-hidden="true" className="h-px bg-border" />

            <ChoicePills
                label="Il tuo livello"
                options={fitnessLevels}
                value={data.fitness_level}
                onChange={(level) => setData('fitness_level', level)}
            />

            <div className="flex flex-col gap-2">
                <Label htmlFor={experienceId} className="font-semibold">
                    Da quanto ti alleni
                </Label>
                <Select
                    value={data.training_experience ?? NONE}
                    onValueChange={(experience) =>
                        setData(
                            'training_experience',
                            experience === NONE ? null : experience,
                        )
                    }
                >
                    <SelectTrigger
                        id={experienceId}
                        className="h-12! rounded-xl bg-card px-3.5 text-[15px] font-medium"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE}>Non indicato</SelectItem>
                        {trainingExperiences.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <ChoicePills
                label="Quanto ti muovi oggi"
                options={activityLevels}
                value={data.activity_level}
                onChange={(level) => setData('activity_level', level)}
            />

            <ChoicePills
                label="Quante volte a settimana vorresti allenarti"
                options={SESSIONS_PER_WEEK.map((count) => ({
                    value: String(count),
                    label: String(count),
                }))}
                value={
                    data.sessions_per_week === null
                        ? null
                        : String(data.sessions_per_week)
                }
                onChange={(count) =>
                    setData(
                        'sessions_per_week',
                        count === null ? null : Number(count),
                    )
                }
                round
            />

            <div aria-hidden="true" className="h-px bg-border" />

            <SportsField
                sports={data.sports}
                onChange={(sports) => setData('sports', sports)}
            />

            <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor={noteId} className="font-semibold">
                        Cosa vorresti che il trainer sapesse
                    </Label>
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                        {data.trainer_note.length}/{TRAINER_NOTE_MAX_LENGTH}
                    </span>
                </div>
                <Textarea
                    id={noteId}
                    aria-describedby={noteHintId}
                    value={data.trainer_note}
                    maxLength={TRAINER_NOTE_MAX_LENGTH}
                    rows={3}
                    placeholder="Es. lavoro in ufficio tutto il giorno, voglio ripartire con calma e mi piace allenarmi all’aperto."
                    onChange={(event) =>
                        setData('trainer_note', event.target.value)
                    }
                    className="rounded-xl bg-card px-3.5 py-3 text-[15px]"
                />
                <p
                    id={noteHintId}
                    className="text-[13px] text-muted-foreground"
                >
                    Non scrivere dati sulla salute (malattie, infortuni,
                    farmaci): se serve, parlane direttamente con il trainer.
                </p>
            </div>

            <div aria-hidden="true" className="h-px bg-border" />

            <div className="flex flex-col gap-3.5">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id={consentId}
                        checked={data.body_data_consent}
                        onCheckedChange={(checked) => {
                            const consent = checked === true;
                            setData('body_data_consent', consent);

                            // Without the consent nothing is kept.
                            if (!consent) {
                                setData('height_cm', null);
                                setData('weight_kg', null);
                            }
                        }}
                        className="mt-0.5"
                    />
                    <Label
                        htmlFor={consentId}
                        className="flex flex-col items-start gap-1 leading-5"
                    >
                        <span className="font-semibold">
                            Voglio indicare altezza e peso
                        </span>
                        <span className="text-[13px] font-normal text-muted-foreground">
                            Acconsento a che MioPersonal li conservi e li mostri
                            solo ai trainer a cui chiedo una seduta. Posso
                            toglierli quando voglio: togliendo la spunta li
                            cancelliamo.
                        </span>
                    </Label>
                </div>

                {data.body_data_consent && (
                    <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                        <NumberInput
                            id={heightId}
                            label="Altezza"
                            unit="cm"
                            min={HEIGHT_MIN_CM}
                            max={HEIGHT_MAX_CM}
                            value={data.height_cm}
                            onChange={(cm) => setData('height_cm', cm)}
                        />
                        <NumberInput
                            id={weightId}
                            label="Peso"
                            unit="kg"
                            min={WEIGHT_MIN_KG}
                            max={WEIGHT_MAX_KG}
                            value={data.weight_kg}
                            onChange={(kg) => setData('weight_kg', kg)}
                        />
                    </div>
                )}
            </div>
        </NumberedSection>
    );
}

/** One answer among a few, as pills; a second click takes it away. */
function ChoicePills({
    label,
    options,
    value,
    onChange,
    round = false,
}: {
    label: string;
    options: Option[];
    value: string | null;
    onChange: (value: string | null) => void;
    /** Numbers: round pills of the same size. */
    round?: boolean;
}) {
    return (
        <Field label={label}>
            {(labelId) => (
                <ToggleGroup
                    type="single"
                    aria-labelledby={labelId}
                    value={value ?? ''}
                    onValueChange={(chosen) =>
                        onChange(chosen === '' ? null : chosen)
                    }
                    className="flex-wrap gap-2"
                >
                    {options.map((option) => (
                        <ToggleGroupItem
                            key={option.value}
                            value={option.value}
                            className={cn(
                                pillClassName,
                                round && 'w-10 justify-center px-0',
                            )}
                        >
                            {value === option.value && !round && (
                                <Check
                                    aria-hidden="true"
                                    strokeWidth={3}
                                    className="size-3.5"
                                />
                            )}
                            {option.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            )}
        </Field>
    );
}

/** "Sport praticati": written by the client, shown as chips with an X. */
function SportsField({
    sports,
    onChange,
}: {
    sports: string[];
    onChange: (sports: string[]) => void;
}) {
    const inputId = useId();
    const [draft, setDraft] = useState('');
    const full = sports.length >= SPORTS_MAX;

    const add = (event?: FormEvent | KeyboardEvent) => {
        event?.preventDefault();
        const sport = draft.trim().replace(/\s+/g, ' ');

        if (
            sport === '' ||
            full ||
            sports.some((item) => item.toLowerCase() === sport.toLowerCase())
        ) {
            setDraft('');

            return;
        }

        onChange([...sports, sport]);
        setDraft('');
    };

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={inputId} className="font-semibold">
                    Sport che pratichi o hai praticato
                </Label>
                <span className="text-[13px] text-muted-foreground tabular-nums">
                    {sports.length}/{SPORTS_MAX}
                </span>
            </div>
            <div className="flex gap-2">
                <Input
                    id={inputId}
                    value={draft}
                    maxLength={SPORT_MAX_LENGTH}
                    disabled={full}
                    placeholder={
                        full
                            ? 'Hai raggiunto il massimo'
                            : 'Es. calcio, nuoto, corsa'
                    }
                    onChange={(event) => setDraft(event.target.value)}
                    // Enter adds the sport instead of sending the whole form.
                    onKeyDown={(event) => event.key === 'Enter' && add(event)}
                    className="h-12 rounded-xl bg-card px-3.5 text-[15px]"
                />
                <Button
                    type="button"
                    variant="outline"
                    disabled={full || draft.trim() === ''}
                    onClick={() => add()}
                    className="h-12 rounded-xl px-4 font-semibold"
                >
                    <Plus aria-hidden="true" />
                    Aggiungi
                </Button>
            </div>
            {sports.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {sports.map((sport) => (
                        <li
                            key={sport}
                            className="inline-flex h-9 items-center gap-1 rounded-full bg-foreground pr-1 pl-3.5 text-sm font-medium text-background"
                        >
                            {sport}
                            <button
                                type="button"
                                aria-label={`Togli ${sport}`}
                                onClick={() =>
                                    onChange(
                                        sports.filter((item) => item !== sport),
                                    )
                                }
                                className="flex size-7 items-center justify-center rounded-full hover:bg-background/20"
                            >
                                <X aria-hidden="true" className="size-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/** A whole number with its unit on the right; empty = null. */
function NumberInput({
    id,
    label,
    unit,
    min,
    max,
    value,
    onChange,
}: {
    id: string;
    label: string;
    unit: string;
    min: number;
    max: number;
    value: number | null;
    onChange: (value: number | null) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id} className="font-semibold">
                {label}
                <span className="sr-only"> in {unit}</span>
            </Label>
            <div className="flex h-12 items-center rounded-xl border bg-card pr-3.5 focus-within:border-foreground focus-within:ring-[3px] focus-within:ring-foreground/10">
                <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    step={1}
                    value={value ?? ''}
                    onChange={(event) =>
                        onChange(
                            event.target.value === ''
                                ? null
                                : Math.round(Number(event.target.value)),
                        )
                    }
                    className="h-full w-full min-w-0 bg-transparent px-3.5 text-[15px] tabular-nums outline-none"
                />
                <span
                    aria-hidden="true"
                    className="text-sm text-muted-foreground"
                >
                    {unit}
                </span>
            </div>
        </div>
    );
}
