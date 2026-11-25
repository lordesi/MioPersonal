import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Camera,
    Clock,
    MapPin,
    Mars,
    MessageCircle,
    Moon,
    Plus,
    Search,
    Sun,
    Venus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import PhotoCropDialog from '@/components/client/photo-crop-dialog';
import {
    BUDGET_MAX_CENTS,
    BUDGET_MIN_CENTS,
    BUDGET_START_CENTS,
    BUDGET_STEP_CENTS,
    BUDGET_TICKS_CENTS,
    budgetLabel,
    preferencesFormData,
    preferredTimes,
    usePhotoUpload,
} from '@/components/client/preferences-fields';
import type {
    BirthYears,
    PreferencesData,
    SavedPreferences,
} from '@/components/client/preferences-fields';
import { BrandMark } from '@/components/layout/brand-logo';
import ComboField from '@/components/mp/combo-field';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useLocateCity } from '@/hooks/use-locate-city';
import { formatPrice } from '@/lib/format';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import { home as clientHome } from '@/routes/client';
import { update } from '@/routes/client/complete-profile';
import type { CatalogOption, CityWithCoordinates } from '@/types';

type CompleteProfileProps = {
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityWithCoordinates[];
    /** Null until the client saves the page once. */
    preferences: SavedPreferences | null;
    birthYears: BirthYears;
};

/** The five steps of the design, in order. */
const STEPS = [
    'Foto profilo',
    'Dove e come',
    'Cosa cerchi',
    'Quando',
    'Su di te',
];

/** The icons of the times of the day (App\Enums\PreferredTime). */
const timeIcons: Record<string, LucideIcon> = {
    early_morning: Sun,
    morning: Sun,
    lunch: Clock,
    afternoon: Clock,
    evening: Moon,
    weekend: CalendarDays,
};

/** "Genere" (App\Enums\Sex), as in the design: two tiles. */
const sexes = [
    { value: 'male', label: 'Maschio', icon: Mars },
    { value: 'female', label: 'Femmina', icon: Venus },
];

/** App\Enums\TrainingExperience, with the short labels of the design. */
const experiences = [
    { value: 'never', label: 'Inizio ora' },
    { value: 'under_1', label: 'Meno di 1 anno' },
    { value: '1_3', label: '1–3 anni' },
    { value: '3_5', label: '3–5 anni' },
    { value: 'over_5', label: 'Più di 5 anni' },
];

/** App\Enums\FitnessLevel. */
const levels = [
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzato' },
];

/** App\Enums\ActivityLevel. */
const activities = [
    { value: 'sedentary', label: 'Sedentario' },
    { value: 'light', label: 'Poco attivo' },
    { value: 'active', label: 'Attivo' },
    { value: 'very_active', label: 'Molto attivo' },
];

/** As in ClientPreferencesRequest. */
const TRAINER_NOTE_MAX_LENGTH = 500;

/** "In presenza" and "Online" switched on → the mode (App\Enums\TrainingMode). */
function modeOf(inPerson: boolean, online: boolean): string | null {
    if (inPerson && online) {
        return 'both';
    }

    if (inPerson) {
        return 'in_person';
    }

    return online ? 'online' : null;
}

/** The filled turquoise "Continua" / "Salva profilo". */
const primaryButton =
    'flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-[17px] font-semibold text-black outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60';

/** "Indietro": text only. */
const ghostButton =
    'flex h-14 w-full items-center justify-center rounded-full text-[17px] font-semibold text-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring';

/**
 * "Completa il tuo profilo" right after the client sign-up (designs
 * "Completa profilo · 1–5 di 5"): photo, where and how, what, when, about
 * you. Everything is optional; the photo is saved as soon as it is chosen,
 * the rest with "Salva profilo". The same answers are changed later from
 * "Modifica profilo" (pages/client/edit-profile.tsx).
 */
export default function CompleteProfile({
    disciplines,
    cities,
    preferences,
    birthYears,
}: CompleteProfileProps) {
    const form = useForm(preferencesFormData(preferences));
    const { data, setData } = form;
    const [step, setStep] = useState(1);
    const topRef = useRef<HTMLDivElement>(null);

    // A new step starts from the top.
    useEffect(() => {
        topRef.current?.scrollIntoView({ block: 'start' });
    }, [step]);

    const save = (event: FormEvent) => {
        event.preventDefault();

        if (step < STEPS.length) {
            setStep(step + 1);

            return;
        }

        form.put(update.url());
    };

    // Only possible if someone changes the page by hand: one line is enough.
    const firstError = Object.values(form.errors)[0];

    const titles: Record<number, { title: ReactNode; intro: string }> = {
        1: {
            title: (
                <>
                    Aggiungi una <b>foto</b>
                </>
            ),
            intro: 'Ai trainer piace sapere chi incontreranno. Puoi aggiungerla anche dopo.',
        },
        2: {
            title: (
                <>
                    Dove ti <b>alleni</b>?
                </>
            ),
            intro: 'Ti mostriamo prima i trainer vicini e nel modo che preferisci.',
        },
        3: {
            title: (
                <>
                    Cosa <b>cerchi</b>?
                </>
            ),
            intro: 'Scegli un obiettivo e le discipline che ti interessano.',
        },
        4: {
            title: (
                <>
                    Quando sei <b>libero</b>?
                </>
            ),
            intro: 'Ti suggeriamo i trainer con orari compatibili e nel tuo budget.',
        },
        5: {
            title: (
                <>
                    Raccontaci <b>di te</b>
                </>
            ),
            intro: 'Lo leggono solo i trainer a cui chiedi una seduta: li aiuta a prepararla su misura per te.',
        },
    };

    return (
        <div
            ref={topRef}
            className="theme-dark flex min-h-dvh scroll-mt-0 flex-col"
        >
            <Head title="Completa il tuo profilo" />

            <header className="md:border-b md:border-separator">
                <div className="mx-auto flex min-h-16 max-w-320 items-center justify-between gap-4 px-4 pt-2.5 md:px-8 md:py-4.5">
                    <span className="flex min-h-11 items-center gap-2.5 text-[19px] font-bold tracking-[-0.03em] md:text-[22px]">
                        <BrandMark className="h-5 w-8 md:h-5.5 md:w-8.75" />
                        MioPersonal
                    </span>
                    <Link
                        href={clientHome()}
                        className="flex h-9 items-center rounded-full px-3.5 text-[15px] font-semibold text-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Salta per ora
                    </Link>
                </div>
            </header>

            <form
                onSubmit={save}
                className="mx-auto flex w-full max-w-160 flex-col gap-8 px-4 pt-5 pb-10 md:gap-9 md:px-8 md:pt-14 md:pb-20"
            >
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-baseline justify-between text-[13px] font-semibold">
                        <span className="text-brand">
                            Passo {step} di {STEPS.length} · {STEPS[step - 1]}
                        </span>
                        {step > 1 && (
                            <span className="text-muted-foreground">
                                Facoltativo
                            </span>
                        )}
                    </div>
                    <div
                        role="progressbar"
                        aria-label="Completamento del profilo"
                        aria-valuemin={1}
                        aria-valuemax={STEPS.length}
                        aria-valuenow={step}
                        className="flex gap-1"
                    >
                        {STEPS.map((name, index) => (
                            <span
                                key={name}
                                className={cn(
                                    'h-1 flex-1 rounded-full',
                                    index < step ? 'bg-brand' : 'bg-secondary',
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    <h1 className="text-[34px] leading-[1.06] font-bold tracking-[-0.03em] md:text-[44px] [&_b]:font-bold">
                        {titles[step].title}
                    </h1>
                    <p className="text-[17px] leading-[1.4] text-muted-foreground">
                        {titles[step].intro}
                    </p>
                </div>

                {step === 1 && <PhotoStep />}
                {step === 2 && (
                    <WhereStep data={data} setData={setData} cities={cities} />
                )}
                {step === 3 && (
                    <WhatStep
                        data={data}
                        setData={setData}
                        disciplines={disciplines}
                    />
                )}
                {step === 4 && <WhenStep data={data} setData={setData} />}
                {step === 5 && (
                    <AboutStep
                        data={data}
                        setData={setData}
                        birthYears={birthYears}
                    />
                )}

                {firstError && (
                    <p role="alert" className="text-sm text-destructive">
                        {firstError}
                    </p>
                )}

                <div className="flex flex-col gap-2">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className={primaryButton}
                    >
                        {form.processing && <Spinner />}
                        {step < STEPS.length ? 'Continua' : 'Salva profilo'}
                    </button>
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className={ghostButton}
                        >
                            Indietro
                        </button>
                    )}
                    {step > 2 && (
                        <p className="mt-1 text-center text-[13px] text-muted-foreground">
                            Puoi cambiare tutto quando vuoi da «Modifica
                            profilo».
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}

type StepProps = {
    data: PreferencesData;
    setData: <K extends keyof PreferencesData>(
        key: K,
        value: PreferencesData[K],
    ) => void;
};

/** A group of choices: the title, a hint on the right, the choices. */
function Group({
    title,
    hint,
    children,
}: {
    title: string;
    hint?: string;
    children: ReactNode;
}) {
    const id = useId();

    return (
        <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
                <span
                    id={id}
                    className="text-[17px] font-semibold tracking-[-0.01em]"
                >
                    {title}
                </span>
                {hint && (
                    <span className="text-[13px] text-muted-foreground">
                        {hint}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

/** A round choice: grey outline, filled turquoise when chosen. */
function Pill({
    pressed,
    onClick,
    className,
    children,
}: {
    pressed: boolean;
    onClick: () => void;
    className?: string;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className={cn(
                'h-11 rounded-full px-4.5 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                pressed
                    ? 'bg-brand text-black'
                    : 'text-foreground shadow-[inset_0_0_0_1px_var(--input)] hover:bg-foreground/6',
                className,
            )}
        >
            {children}
        </button>
    );
}

/** Step 1: the round photo, "Scegli dalla galleria", "Scatta una foto". */
function PhotoStep() {
    const photo = usePhotoUpload();
    const cameraRef = useRef<HTMLInputElement>(null);
    const errorId = useId();
    // The shared props: the new avatar comes back after the upload.
    const avatar = usePage().props.auth?.user?.avatar ?? null;

    return (
        <div className="flex flex-col items-center gap-5 py-2">
            <button
                type="button"
                aria-label={avatar ? 'Cambia la foto' : 'Carica una foto'}
                aria-describedby={photo.error ? errorId : undefined}
                disabled={photo.uploading}
                onClick={() => photo.inputRef.current?.click()}
                className="relative flex size-44 items-center justify-center rounded-full border-[1.5px] border-border-strong text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
                {avatar ? (
                    <img
                        src={avatar}
                        alt=""
                        className="size-full rounded-full object-cover"
                    />
                ) : (
                    <Camera
                        aria-hidden="true"
                        className="size-12"
                        strokeWidth={1.5}
                    />
                )}
                <span
                    aria-hidden="true"
                    className="absolute right-1.75 bottom-1.75 flex size-11 items-center justify-center rounded-full bg-brand text-black shadow-[0_0_0_4px_var(--background)]"
                >
                    {photo.uploading ? (
                        <Spinner />
                    ) : (
                        <Plus className="size-5" strokeWidth={2.4} />
                    )}
                </span>
            </button>

            <input
                ref={photo.inputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={photo.choose}
            />
            <input
                ref={cameraRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="user"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={photo.choose}
            />
            <PhotoCropDialog
                src={photo.cropSrc}
                onCancel={photo.closeCrop}
                onConfirm={photo.upload}
            />

            <div className="flex flex-wrap justify-center gap-2">
                <button
                    type="button"
                    disabled={photo.uploading}
                    onClick={() => photo.inputRef.current?.click()}
                    className="h-11 rounded-full border border-input px-5 text-[15px] font-semibold outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Scegli dalla galleria
                </button>
                <button
                    type="button"
                    disabled={photo.uploading}
                    onClick={() => cameraRef.current?.click()}
                    className="h-11 rounded-full px-5 text-[15px] font-semibold outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Scatta una foto
                </button>
                {avatar && (
                    <button
                        type="button"
                        disabled={photo.removing || photo.uploading}
                        onClick={photo.remove}
                        className="h-11 rounded-full px-5 text-[15px] font-semibold text-muted-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Rimuovi
                    </button>
                )}
            </div>
            {photo.error ? (
                <p
                    id={errorId}
                    role="alert"
                    className="text-sm text-destructive"
                >
                    {photo.error}
                </p>
            ) : (
                <p className="text-[13px] text-muted-foreground">
                    JPG o PNG, massimo 5 MB.
                </p>
            )}
        </div>
    );
}

/** Step 2: the city (or the position) and how to train. */
function WhereStep({
    data,
    setData,
    cities,
}: StepProps & { cities: CityWithCoordinates[] }) {
    const cityName = (slug: string | null) =>
        cities.find((city) => city.value === slug)?.label ?? '';
    const [text, setText] = useState(cityName(data.city));
    const located = useLocateCity(cities, (city) => {
        setData('city', city.value);
        setText(city.label);
    });
    const inPerson = data.mode === 'in_person' || data.mode === 'both';
    const online = data.mode === 'online' || data.mode === 'both';

    const modes = [
        {
            label: 'In presenza',
            sub: 'In palestra, all’aperto o a casa tua',
            icon: MapPin,
            on: inPerson,
            set: (on: boolean) => setData('mode', modeOf(on, online)),
        },
        {
            label: 'Online',
            sub: 'In videochiamata, ovunque tu sia',
            icon: MessageCircle,
            on: online,
            set: (on: boolean) => setData('mode', modeOf(inPerson, on)),
        },
    ];

    return (
        <>
            <div className="flex flex-col gap-2.5">
                <span className="text-[15px] font-semibold">
                    In che città ti alleni
                </span>
                <ComboField
                    label="In che città ti alleni"
                    icon={Search}
                    placeholder="Es. Milano"
                    options={cities}
                    text={text}
                    onTextChange={(value) => {
                        setText(value);

                        if (value.trim() === '') {
                            setData('city', null);
                        }
                    }}
                    onSelect={(option) => {
                        setText(option.label);
                        setData('city', option.value);
                    }}
                    autoComplete="address-level2"
                    tone="field"
                />
                <button
                    type="button"
                    onClick={located.locate}
                    disabled={located.locating}
                    className="flex min-h-9 items-center gap-2 self-start text-[15px] font-semibold text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {located.locating && <Spinner />}
                    {located.locating
                        ? 'Cerco la tua posizione…'
                        : 'Usa la mia posizione attuale'}
                </button>
                {located.error && (
                    <p role="alert" className="text-sm text-destructive">
                        {located.error}
                    </p>
                )}
            </div>

            <div className="flex flex-col">
                <span className="text-[17px] font-semibold tracking-[-0.01em]">
                    Come preferisci allenarti
                </span>
                <span className="mt-1 text-[13px] text-muted-foreground">
                    Puoi attivarle entrambe.
                </span>
                <div className="mt-1 flex flex-col">
                    {modes.map((mode) => (
                        <label
                            key={mode.label}
                            className="flex min-h-16 cursor-pointer items-center gap-3.5 border-b border-separator"
                        >
                            <span
                                aria-hidden="true"
                                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"
                            >
                                <mode.icon className="size-5" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="text-[17px] font-medium">
                                    {mode.label}
                                </span>
                                <span className="text-[13px] text-muted-foreground">
                                    {mode.sub}
                                </span>
                            </span>
                            <Switch
                                checked={mode.on}
                                onCheckedChange={mode.set}
                            />
                        </label>
                    ))}
                </div>
            </div>
        </>
    );
}

/** Step 3: one goal and the disciplines. */
function WhatStep({
    data,
    setData,
    disciplines,
}: StepProps & { disciplines: CatalogOption[] }) {
    return (
        <>
            <Group title="Il tuo obiettivo" hint="Scegline uno">
                <div className="flex flex-wrap gap-2">
                    {trainingGoals.map((goal) => (
                        <Pill
                            key={goal.value}
                            pressed={data.goal === goal.value}
                            onClick={() =>
                                setData(
                                    'goal',
                                    data.goal === goal.value
                                        ? null
                                        : goal.value,
                                )
                            }
                        >
                            {goal.label}
                        </Pill>
                    ))}
                </div>
            </Group>
            <Group
                title="Discipline che ti interessano"
                hint="Anche più di una"
            >
                <div className="flex flex-wrap gap-2">
                    {disciplines.map((discipline) => {
                        const on = data.disciplines.includes(discipline.value);

                        return (
                            <Pill
                                key={discipline.value}
                                pressed={on}
                                onClick={() =>
                                    setData(
                                        'disciplines',
                                        on
                                            ? data.disciplines.filter(
                                                  (slug) =>
                                                      slug !== discipline.value,
                                              )
                                            : [
                                                  ...data.disciplines,
                                                  discipline.value,
                                              ],
                                    )
                                }
                            >
                                {discipline.label}
                            </Pill>
                        );
                    })}
                </div>
            </Group>
        </>
    );
}

/** Step 4: the times of the day and the budget. */
function WhenStep({ data, setData }: StepProps) {
    const budgetId = useId();

    return (
        <>
            <Group title="Quando preferisci allenarti" hint="Anche più di una">
                <div className="grid grid-cols-2 gap-2">
                    {preferredTimes.map((time) => {
                        const on = data.times.includes(time.value);
                        const Icon = timeIcons[time.value] ?? Clock;

                        return (
                            <button
                                key={time.value}
                                type="button"
                                aria-pressed={on}
                                onClick={() =>
                                    setData(
                                        'times',
                                        on
                                            ? data.times.filter(
                                                  (value) =>
                                                      value !== time.value,
                                              )
                                            : [...data.times, time.value],
                                    )
                                }
                                className={cn(
                                    'flex min-h-14 w-full items-center gap-2.5 rounded-2xl px-3.5 text-left text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    on
                                        ? 'border-[1.5px] border-brand'
                                        : 'border border-border',
                                )}
                            >
                                <Icon
                                    aria-hidden="true"
                                    className={cn(
                                        'size-5 shrink-0',
                                        on
                                            ? 'text-brand'
                                            : 'text-muted-foreground',
                                    )}
                                />
                                <span className="flex-1">{time.label}</span>
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'size-5 shrink-0 rounded-full',
                                        on
                                            ? 'border-[7px] border-brand'
                                            : 'border-2 border-input',
                                    )}
                                />
                            </button>
                        );
                    })}
                </div>
            </Group>

            <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                    <span
                        id={budgetId}
                        className="text-[17px] font-semibold tracking-[-0.01em]"
                    >
                        Budget per seduta
                    </span>
                    <span className="text-[17px] font-bold text-brand tabular-nums">
                        {budgetLabel(data.budget_max_cents)}
                    </span>
                </div>
                <Slider
                    min={BUDGET_MIN_CENTS}
                    max={BUDGET_MAX_CENTS}
                    step={BUDGET_STEP_CENTS}
                    value={[data.budget_max_cents ?? BUDGET_START_CENTS]}
                    onValueChange={([cents]) =>
                        setData('budget_max_cents', cents)
                    }
                    thumbLabel="Budget per seduta"
                    valueText={budgetLabel(data.budget_max_cents)}
                    className="py-3"
                />
                <div
                    aria-hidden="true"
                    className="flex justify-between text-[13px] text-muted-foreground tabular-nums"
                >
                    {BUDGET_TICKS_CENTS.map((cents) => (
                        <span key={cents}>
                            {formatPrice(cents)}
                            {cents === BUDGET_MAX_CENTS && '+'}
                        </span>
                    ))}
                </div>
            </div>
        </>
    );
}

/** Step 5: what the trainers read before a session. */
function AboutStep({
    data,
    setData,
    birthYears,
}: StepProps & { birthYears: BirthYears }) {
    const yearId = useId();
    const noteId = useId();
    const noteHintId = useId();
    const [yearText, setYearText] = useState(
        data.birth_year === null ? '' : String(data.birth_year),
    );

    const single = <
        K extends 'training_experience' | 'fitness_level' | 'activity_level',
    >(
        key: K,
        options: { value: string; label: string }[],
    ) => (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <Pill
                    key={option.value}
                    pressed={data[key] === option.value}
                    onClick={() =>
                        setData(
                            key,
                            data[key] === option.value ? null : option.value,
                        )
                    }
                >
                    {option.label}
                </Pill>
            ))}
        </div>
    );

    return (
        <>
            <Group title="Genere">
                <div className="grid grid-cols-2 gap-2">
                    {sexes.map((sex) => {
                        const on = data.sex === sex.value;

                        return (
                            <button
                                key={sex.value}
                                type="button"
                                aria-pressed={on}
                                onClick={() =>
                                    setData('sex', on ? null : sex.value)
                                }
                                className={cn(
                                    'flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                    on
                                        ? 'bg-brand text-black'
                                        : 'shadow-[inset_0_0_0_1px_var(--input)] hover:bg-foreground/6',
                                )}
                            >
                                <sex.icon
                                    aria-hidden="true"
                                    className="size-6"
                                />
                                {sex.label}
                            </button>
                        );
                    })}
                </div>
            </Group>

            <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor={yearId}
                        className="text-[15px] font-semibold"
                    >
                        Anno di nascita
                    </label>
                    <input
                        id={yearId}
                        inputMode="numeric"
                        autoComplete="bday-year"
                        maxLength={4}
                        placeholder="Es. 1995"
                        value={yearText}
                        onChange={(event) => {
                            const value = event.target.value.replace(/\D/g, '');
                            const year = Number(value);
                            setYearText(value);
                            setData(
                                'birth_year',
                                value.length === 4 &&
                                    year >= birthYears.from &&
                                    year <= birthYears.to
                                    ? year
                                    : null,
                            );
                        }}
                        className="h-14 rounded-[14px] border border-input bg-card px-4 text-[17px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-brand"
                    />
                    {yearText.length === 4 && data.birth_year === null && (
                        <p className="text-[13px] text-destructive">
                            Scrivi un anno tra {birthYears.from} e{' '}
                            {birthYears.to}.
                        </p>
                    )}
                </div>
            </div>

            <Group title="Da quanto ti alleni">
                {single('training_experience', experiences)}
            </Group>
            <Group title="Il tuo livello">
                {single('fitness_level', levels)}
            </Group>
            <Group title="Quanto ti muovi oggi">
                {single('activity_level', activities)}
            </Group>
            <Group title="Quante volte a settimana vorresti allenarti">
                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                        <Pill
                            key={count}
                            pressed={data.sessions_per_week === count}
                            onClick={() =>
                                setData(
                                    'sessions_per_week',
                                    data.sessions_per_week === count
                                        ? null
                                        : count,
                                )
                            }
                            className="w-11 rounded-xl px-0"
                        >
                            {count}
                        </Pill>
                    ))}
                </div>
            </Group>

            <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                    <label
                        htmlFor={noteId}
                        className="text-[15px] font-semibold"
                    >
                        Cosa vorresti che il trainer sapesse
                    </label>
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                        {data.trainer_note.length}/{TRAINER_NOTE_MAX_LENGTH}
                    </span>
                </div>
                <textarea
                    id={noteId}
                    rows={4}
                    maxLength={TRAINER_NOTE_MAX_LENGTH}
                    aria-describedby={noteHintId}
                    value={data.trainer_note}
                    onChange={(event) =>
                        setData('trainer_note', event.target.value)
                    }
                    placeholder="Es. lavoro in ufficio tutto il giorno, voglio ripartire con calma e mi piace allenarmi all’aperto."
                    className="min-h-28 resize-y rounded-[14px] border border-input bg-card px-4 py-3.5 text-[17px] leading-5.5 text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-brand"
                />
                <span
                    id={noteHintId}
                    className="text-[13px] leading-4.5 text-muted-foreground"
                >
                    Non scrivere dati sulla salute (malattie, infortuni,
                    farmaci): se serve, parlane direttamente con il trainer.
                </span>
            </div>
        </>
    );
}
