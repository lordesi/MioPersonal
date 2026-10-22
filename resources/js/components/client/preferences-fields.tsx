import { router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    Clock,
    MapPin,
    Moon,
    Navigation,
    Sun,
    Sunrise,
    Target,
    Upload,
    User,
    UtensilsCrossed,
    Video,
} from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import CompleteProfileController from '@/actions/App/Http/Controllers/CompleteProfileController';
import NumberedSection from '@/components/trainer/area/numbered-section';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useInitials } from '@/hooks/use-initials';
import { formatPrice } from '@/lib/format';
import { closestCity, currentPosition } from '@/lib/geo';
import { trainingGoals } from '@/lib/goals';
import { cn } from '@/lib/utils';
import type { CatalogOption, CityWithCoordinates } from '@/types';

type Option = { value: string; label: string; icon: typeof User };

/** The values are the ones of App\Enums\TrainingMode. */
export const trainingModes: Option[] = [
    { value: 'in_person', label: 'In presenza', icon: User },
    { value: 'online', label: 'Online', icon: Video },
    { value: 'both', label: 'Entrambe', icon: Check },
];

/** The values are the ones of App\Enums\PreferredTime. */
export const preferredTimes: Option[] = [
    { value: 'early_morning', label: 'Mattina presto', icon: Sunrise },
    { value: 'morning', label: 'In mattinata', icon: Sun },
    { value: 'lunch', label: 'Pausa pranzo', icon: UtensilsCrossed },
    { value: 'afternoon', label: 'Pomeriggio', icon: Clock },
    { value: 'evening', label: 'Sera', icon: Moon },
    { value: 'weekend', label: 'Weekend', icon: CalendarDays },
];

/** As in ClientPreferencesRequest: from 20 € to 100 € ("Nessun limite"), steps of 5 €. */
const BUDGET_MIN_CENTS = 2000;
const BUDGET_MAX_CENTS = 10000;
const BUDGET_STEP_CENTS = 500;
/** Where the slider starts while no budget is chosen. */
const BUDGET_START_CENTS = 4500;
/** The scale under the slider. */
const BUDGET_TICKS_CENTS = [2000, 4000, 6000, 8000, 10000];

/** As in CompleteProfileController::updatePhoto (max:5120). */
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TOO_BIG = 'La foto è troppo pesante: massimo 5 MB.';

const LOCATION_ERROR =
    'Non riusciamo a leggere la tua posizione: scegli la città dall’elenco.';

/** Radix Select doesn't accept '' as a value, so "no city" uses this one. */
const NO_CITY = 'none';

export function budgetLabel(cents: number | null): string {
    if (cents === null) {
        return 'Non indicato';
    }

    return cents >= BUDGET_MAX_CENTS
        ? 'Nessun limite'
        : `Fino a ${formatPrice(cents)}`;
}

/** "Anche più di una" until something is chosen, then "2 scelte". */
function countHint(count: number, none: string, one: string, many: string) {
    if (count === 0) {
        return none;
    }

    return `${count} ${count === 1 ? one : many}`;
}

/** The answers saved last time, as sent by CompleteProfileController. */
export type SavedPreferences = {
    city: string | null;
    mode: string | null;
    goal: string | null;
    disciplines: string[];
    times: string[];
    budgetMaxCents: number | null;
};

/** The form data, with the names ClientPreferencesRequest expects. */
export type PreferencesData = {
    city: string | null;
    mode: string | null;
    goal: string | null;
    disciplines: string[];
    times: string[];
    budget_max_cents: number | null;
};

/** Starting values of the form: the saved answers, or all empty. */
export function preferencesFormData(
    preferences: SavedPreferences | null,
): PreferencesData {
    return {
        city: preferences?.city ?? null,
        mode: preferences?.mode ?? null,
        goal: preferences?.goal ?? null,
        disciplines: preferences?.disciplines ?? [],
        times: preferences?.times ?? [],
        budget_max_cents: preferences?.budgetMaxCents ?? null,
    };
}

type PreferencesFieldsProps = {
    data: PreferencesData;
    setData: <K extends keyof PreferencesData>(
        key: K,
        value: PreferencesData[K],
    ) => void;
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityWithCoordinates[];
};

/** Pill of "Il tuo obiettivo" and "Discipline": black when chosen. */
const pillClassName =
    'h-10 min-w-0 gap-1.5 rounded-full border bg-card px-3.5 text-sm font-medium text-foreground first:rounded-full last:rounded-full hover:bg-secondary hover:text-foreground data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:hover:bg-foreground/90';

/**
 * The four numbered sections of "Completa il tuo profilo" (after the sign-up)
 * and "Modifica il mio profilo" (client area): photo, where and how, goal and
 * disciplines, when and budget. The page adds its title and buttons.
 */
export default function PreferencesFields({
    data,
    setData,
    disciplines,
    cities,
}: PreferencesFieldsProps) {
    const { auth } = usePage().props;
    const cityId = useId();
    const [locating, setLocating] = useState(false);
    // "Uso la tua posizione" until the city is changed by hand.
    const [located, setLocated] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    const locate = () => {
        setLocating(true);
        setLocationError(null);

        currentPosition()
            .then((position) => {
                const city = closestCity(cities, position);

                if (city) {
                    setData('city', city.value);
                    setLocated(true);
                } else {
                    setLocationError(LOCATION_ERROR);
                }
            })
            .catch(() => setLocationError(LOCATION_ERROR))
            .finally(() => setLocating(false));
    };

    let locateLabel = 'Usa la mia posizione attuale';

    if (locating) {
        locateLabel = 'Cerco la tua posizione…';
    } else if (located) {
        locateLabel = 'Uso la tua posizione';
    }

    return (
        <>
            <NumberedSection
                step={1}
                title={
                    <>
                        Foto profilo{' '}
                        <span className="text-sm font-medium text-muted-foreground">
                            · facoltativa
                        </span>
                    </>
                }
                description="La vedono solo i trainer a cui chiedi una seduta."
            >
                <PhotoUpload
                    name={auth?.user?.name ?? ''}
                    src={auth?.user?.avatar}
                />
            </NumberedSection>

            <NumberedSection
                step={2}
                title="Dove e come ti alleni"
                description="Ti mostriamo prima i trainer della tua città."
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor={cityId} className="font-semibold">
                        In che città ti alleni
                    </Label>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Select
                            value={data.city ?? NO_CITY}
                            onValueChange={(city) => {
                                setData('city', city === NO_CITY ? null : city);
                                setLocated(false);
                            }}
                        >
                            <SelectTrigger
                                id={cityId}
                                className="h-12! min-w-0 flex-[1_1_260px] rounded-xl bg-card px-3.5 text-[15px] font-medium"
                            >
                                <span className="flex min-w-0 items-center gap-2.5">
                                    <MapPin
                                        aria-hidden="true"
                                        className="text-foreground"
                                    />
                                    <SelectValue />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_CITY}>
                                    Scegli la città
                                </SelectItem>
                                {cities.map((city) => (
                                    <SelectItem
                                        key={city.value}
                                        value={city.value}
                                    >
                                        {city.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={locating}
                            onClick={locate}
                            className={cn(
                                'h-12 rounded-xl px-4 font-semibold',
                                located &&
                                    'border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background',
                            )}
                        >
                            {located ? (
                                <Check aria-hidden="true" />
                            ) : (
                                <Navigation aria-hidden="true" />
                            )}
                            {locateLabel}
                        </Button>
                    </div>
                    {locationError && (
                        <p
                            role="status"
                            className="text-sm text-muted-foreground"
                        >
                            {locationError}
                        </p>
                    )}
                </div>

                <Field label="Come preferisci allenarti">
                    {(labelId) => (
                        <ToggleGroup
                            type="single"
                            aria-labelledby={labelId}
                            value={data.mode ?? ''}
                            // A second click on the chosen one gives '': it stays chosen.
                            onValueChange={(mode) =>
                                mode !== '' && setData('mode', mode)
                            }
                            className="grid grid-cols-3 gap-1 rounded-[14px] bg-secondary p-1"
                        >
                            {trainingModes.map(
                                ({ value, label, icon: Icon }) => (
                                    <ToggleGroupItem
                                        key={value}
                                        value={value}
                                        className="h-10.5 rounded-[10px] px-2.5 text-muted-foreground first:rounded-[10px] last:rounded-[10px] hover:bg-transparent hover:text-foreground data-[state=on]:bg-foreground data-[state=on]:font-semibold data-[state=on]:text-background"
                                    >
                                        <Icon aria-hidden="true" />
                                        {label}
                                    </ToggleGroupItem>
                                ),
                            )}
                        </ToggleGroup>
                    )}
                </Field>
            </NumberedSection>

            <NumberedSection
                step={3}
                title="Cosa cerchi"
                description="L’obiettivo è cosa vuoi ottenere, le discipline sono come ti piace allenarti."
            >
                <Field label="Il tuo obiettivo" hint="Scegline uno">
                    {(labelId) => (
                        <ToggleGroup
                            type="single"
                            aria-labelledby={labelId}
                            value={data.goal ?? ''}
                            onValueChange={(goal) =>
                                goal !== '' && setData('goal', goal)
                            }
                            className="flex-wrap gap-2"
                        >
                            {trainingGoals.map((goal) => (
                                <ToggleGroupItem
                                    key={goal.value}
                                    value={goal.value}
                                    className={cn(
                                        pillClassName,
                                        'border-dashed border-muted-foreground/60 data-[state=on]:border-solid',
                                    )}
                                >
                                    {data.goal === goal.value ? (
                                        <Check
                                            aria-hidden="true"
                                            strokeWidth={3}
                                            className="size-3.5"
                                        />
                                    ) : (
                                        <Target
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                    )}
                                    {goal.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    )}
                </Field>

                <div aria-hidden="true" className="h-px bg-border" />

                <Field
                    label="Discipline che ti interessano"
                    hint={countHint(
                        data.disciplines.length,
                        'Anche più di una',
                        'scelta',
                        'scelte',
                    )}
                >
                    {(labelId) => (
                        <ToggleGroup
                            type="multiple"
                            aria-labelledby={labelId}
                            value={data.disciplines}
                            onValueChange={(chosen) =>
                                setData('disciplines', chosen)
                            }
                            className="flex-wrap gap-2"
                        >
                            {disciplines.map((discipline) => (
                                <ToggleGroupItem
                                    key={discipline.value}
                                    value={discipline.value}
                                    className={pillClassName}
                                >
                                    {data.disciplines.includes(
                                        discipline.value,
                                    ) && (
                                        <Check
                                            aria-hidden="true"
                                            strokeWidth={3}
                                            className="size-3.5"
                                        />
                                    )}
                                    {discipline.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    )}
                </Field>
            </NumberedSection>

            <NumberedSection
                step={4}
                title="Quando e quanto"
                description="Ti suggeriamo prima gli orari liberi che ti vanno bene."
            >
                <Field
                    label="Quando preferisci allenarti"
                    hint={countHint(
                        data.times.length,
                        'Anche più di uno',
                        'scelto',
                        'scelti',
                    )}
                >
                    {(labelId) => (
                        <ToggleGroup
                            type="multiple"
                            aria-labelledby={labelId}
                            value={data.times}
                            onValueChange={(chosen) => setData('times', chosen)}
                            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-2"
                        >
                            {preferredTimes.map(
                                ({ value, label, icon: Icon }) => {
                                    const chosen = data.times.includes(value);

                                    return (
                                        <ToggleGroupItem
                                            key={value}
                                            value={value}
                                            className="h-12 justify-start gap-2.5 rounded-[14px] border bg-card pr-3 pl-3.5 text-foreground first:rounded-[14px] last:rounded-[14px] hover:bg-secondary hover:text-foreground data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:hover:bg-foreground/90"
                                        >
                                            <Icon aria-hidden="true" />
                                            <span className="flex-1 text-left">
                                                {label}
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    'flex size-4.5 flex-none items-center justify-center rounded-md',
                                                    chosen
                                                        ? 'bg-background text-foreground'
                                                        : 'border-[1.5px] border-input text-transparent',
                                                )}
                                            >
                                                <Check
                                                    strokeWidth={4}
                                                    className="size-2.5!"
                                                />
                                            </span>
                                        </ToggleGroupItem>
                                    );
                                },
                            )}
                        </ToggleGroup>
                    )}
                </Field>

                <div aria-hidden="true" className="h-px bg-border" />

                <BudgetField
                    value={data.budget_max_cents}
                    onChange={(cents) => setData('budget_max_cents', cents)}
                />
            </NumberedSection>
        </>
    );
}

/** "Budget indicativo a seduta": the big value, the slider and its scale. */
function BudgetField({
    value,
    onChange,
}: {
    value: number | null;
    onChange: (cents: number) => void;
}) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span id={labelId} className="text-sm font-semibold">
                    Budget indicativo a seduta
                </span>
                <span className="text-[22px] leading-7 font-bold tracking-[-0.02em] tabular-nums">
                    {budgetLabel(value)}
                </span>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border bg-secondary/50 px-4 pt-3.5 pb-2.5">
                <Slider
                    min={BUDGET_MIN_CENTS}
                    max={BUDGET_MAX_CENTS}
                    step={BUDGET_STEP_CENTS}
                    value={[value ?? BUDGET_START_CENTS]}
                    onValueChange={([cents]) => onChange(cents)}
                    thumbLabel="Budget indicativo a seduta"
                    valueText={budgetLabel(value)}
                    className="py-2"
                />
                <div
                    aria-hidden="true"
                    className="flex justify-between text-xs font-medium text-muted-foreground tabular-nums"
                >
                    {BUDGET_TICKS_CENTS.map((cents) => (
                        <span key={cents}>
                            {formatPrice(cents)}
                            {cents === BUDGET_MAX_CENTS && '+'}
                        </span>
                    ))}
                </div>
            </div>
            <p className="text-[13px] leading-4.5 text-muted-foreground">
                È solo un’indicazione: i trainer sopra il tuo budget restano
                visibili, più in basso.
            </p>
        </div>
    );
}

/**
 * "Carica una foto": the file input is hidden, the button opens it. The photo
 * is saved right away, then the new auth.user.avatar comes back with the page.
 */
function PhotoUpload({ name, src }: { name: string; src?: string | null }) {
    const getInitials = useInitials();
    const inputRef = useRef<HTMLInputElement>(null);
    const errorId = useId();
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = (event: ChangeEvent<HTMLInputElement>) => {
        const photo = event.target.files?.[0];
        // Lets the same file be chosen again after an error.
        event.target.value = '';

        if (!photo) {
            return;
        }

        // Checked here too: a heavier file would only fail after the upload.
        if (photo.size > PHOTO_MAX_BYTES) {
            setError(PHOTO_TOO_BIG);

            return;
        }

        setError(null);
        router.post(
            CompleteProfileController.updatePhoto.url(),
            { photo },
            {
                forceFormData: true,
                preserveScroll: true,
                // Only the photo: the answers being filled in stay as they are.
                preserveState: true,
                onStart: () => setUploading(true),
                onFinish: () => setUploading(false),
                onError: (errors) =>
                    setError(
                        errors.photo ??
                            'Non siamo riusciti a caricare la foto: riprova.',
                    ),
            },
        );
    };

    // Deleted right away, the avatars show the initials again.
    const remove = () => {
        setError(null);
        router.delete(CompleteProfileController.destroyPhoto.url(), {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setRemoving(true),
            onFinish: () => setRemoving(false),
        });
    };

    let uploadLabel = 'Carica una foto';

    if (uploading) {
        uploadLabel = 'Caricamento…';
    } else if (src) {
        uploadLabel = 'Cambia foto';
    }

    return (
        <div className="flex flex-wrap items-center gap-4.5 rounded-[18px] border bg-secondary/50 p-4">
            {src ? (
                <UserAvatar
                    name={name}
                    src={src}
                    label="Foto profilo caricata"
                    className="size-20 text-[26px] ring-4 ring-card"
                />
            ) : (
                <span
                    aria-hidden="true"
                    className="flex size-20 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-muted-foreground/60 bg-card text-2xl font-bold text-muted-foreground"
                >
                    {getInitials(name)}
                </span>
            )}
            <div className="flex min-w-55 flex-1 flex-col gap-2.5">
                {error ? (
                    <span id={errorId} className="text-[13px] text-destructive">
                        {error}
                    </span>
                ) : (
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        JPG o PNG, massimo 5 MB.
                    </span>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={upload}
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        disabled={uploading}
                        aria-describedby={error ? errorId : undefined}
                        onClick={() => inputRef.current?.click()}
                        className="h-10 rounded-[10px] px-3.5 font-semibold"
                    >
                        <Upload aria-hidden="true" />
                        {uploadLabel}
                    </Button>
                    {src && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={removing || uploading}
                            onClick={remove}
                            className="h-10 rounded-[10px] px-3.5"
                        >
                            Rimuovi
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/** A group of choices with its title and a hint on the right, read as one question. */
function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: (labelId: string) => ReactNode;
}) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-2">
                <span id={labelId} className="text-sm font-semibold">
                    {label}
                </span>
                {hint && (
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                        {hint}
                    </span>
                )}
            </div>
            {children(labelId)}
        </div>
    );
}
