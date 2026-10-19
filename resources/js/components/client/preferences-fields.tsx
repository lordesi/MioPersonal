import { router, usePage } from '@inertiajs/react';
import { Navigation, Upload, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import CompleteProfileController from '@/actions/App/Http/Controllers/CompleteProfileController';
import FilterSelect from '@/components/search/filter-select';
import ChoiceChips from '@/components/shared/choice-chips';
import type { ChoiceOption } from '@/components/shared/choice-chips';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatPrice } from '@/lib/format';
import { closestCity, currentPosition } from '@/lib/geo';
import type { CatalogOption, CityWithCoordinates } from '@/types';

/** The values are the ones of App\Enums\TrainingMode. */
const modes: ChoiceOption<string>[] = [
    { value: 'in_person', label: 'In presenza' },
    { value: 'online', label: 'Online' },
    { value: 'both', label: 'Entrambe' },
];

/**
 * Training goals only: never ask about health (conditions, injuries…).
 * The values are the ones of App\Enums\TrainingGoal.
 */
const goals: ChoiceOption<string>[] = [
    { value: 'fitness', label: 'Rimettermi in forma' },
    { value: 'strength', label: 'Diventare più forte' },
    { value: 'posture', label: 'Migliorare postura e mobilità' },
    { value: 'sport', label: 'Prepararmi a una gara' },
    { value: 'wellbeing', label: 'Stare meglio' },
];

/** The values are the ones of App\Enums\PreferredTime. */
const times: ChoiceOption<string>[] = [
    { value: 'early_morning', label: 'Mattina presto' },
    { value: 'morning', label: 'In mattinata' },
    { value: 'lunch', label: 'Pausa pranzo' },
    { value: 'afternoon', label: 'Pomeriggio' },
    { value: 'evening', label: 'Sera' },
    { value: 'weekend', label: 'Weekend' },
];

/** As in ClientPreferencesRequest: from 20 € to 100 € ("100 € o più"), steps of 5 €. */
const BUDGET_MIN_CENTS = 2000;
const BUDGET_MAX_CENTS = 10000;
const BUDGET_STEP_CENTS = 500;
/** Where the slider starts while no budget is chosen. */
const BUDGET_START_CENTS = 4500;

/** As in CompleteProfileController::updatePhoto (max:5120). */
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TOO_BIG = 'La foto è troppo pesante: massimo 5 MB.';

const LOCATION_ERROR =
    'Non riusciamo a leggere la tua posizione: scegli la città dall’elenco.';

function budgetLabel(cents: number | null): string {
    if (cents === null) {
        return 'Non indicato';
    }

    return cents >= BUDGET_MAX_CENTS
        ? `${formatPrice(BUDGET_MAX_CENTS)} o più`
        : `Fino a ${formatPrice(cents)}`;
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

/**
 * The cards of "Completa il tuo profilo" (after the sign-up) and
 * "Modifica il mio profilo" (client area): photo, city, mode, goal,
 * disciplines, times and budget. The page adds its title and buttons.
 */
export default function PreferencesFields({
    data,
    setData,
    disciplines,
    cities,
}: PreferencesFieldsProps) {
    const { auth } = usePage().props;
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    const locate = () => {
        setLocating(true);
        setLocationError(null);

        currentPosition()
            .then((position) => {
                const city = closestCity(cities, position);

                if (city) {
                    setData('city', city.value);
                } else {
                    setLocationError(LOCATION_ERROR);
                }
            })
            .catch(() => setLocationError(LOCATION_ERROR))
            .finally(() => setLocating(false));
    };

    return (
        <>
            <Card>
                <PhotoUpload
                    name={auth?.user?.name ?? ''}
                    src={auth?.user?.avatar}
                />
            </Card>

            <Card>
                <div className="flex flex-col gap-2">
                    <FilterSelect
                        id="profile-city"
                        label="In che città ti alleni"
                        noneLabel="Scegli la città"
                        options={cities}
                        value={data.city}
                        onChange={(city) => setData('city', city)}
                        highlight={false}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={locating}
                        onClick={locate}
                        className="self-start px-0 hover:bg-transparent hover:underline"
                    >
                        <Navigation aria-hidden="true" />
                        {locating
                            ? 'Cerco la tua posizione…'
                            : 'Usa la mia posizione attuale'}
                    </Button>
                    {locationError && (
                        <p
                            role="status"
                            className="text-sm text-muted-foreground"
                        >
                            {locationError}
                        </p>
                    )}
                </div>
                <Choice legend="Come preferisci allenarti">
                    {(labelId) => (
                        <ChoiceChips
                            aria-labelledby={labelId}
                            options={modes}
                            value={data.mode}
                            onChange={(mode) => setData('mode', mode)}
                        />
                    )}
                </Choice>
            </Card>

            <Card>
                <Choice legend="Il tuo obiettivo">
                    {(labelId) => (
                        <ChoiceChips
                            aria-labelledby={labelId}
                            options={goals}
                            value={data.goal}
                            onChange={(goal) => setData('goal', goal)}
                        />
                    )}
                </Choice>
                <Choice
                    legend="Discipline che ti interessano"
                    note="anche più di una"
                >
                    {(labelId) => (
                        <ChoiceChips
                            multiple
                            aria-labelledby={labelId}
                            options={disciplines}
                            value={data.disciplines}
                            onChange={(chosen) =>
                                setData('disciplines', chosen)
                            }
                        />
                    )}
                </Choice>
                <Choice
                    legend="Quando preferisci allenarti"
                    note="anche più di una"
                >
                    {(labelId) => (
                        <ChoiceChips
                            multiple
                            aria-labelledby={labelId}
                            options={times}
                            value={data.times}
                            onChange={(chosen) => setData('times', chosen)}
                        />
                    )}
                </Choice>
                <Choice
                    legend="Budget indicativo a seduta"
                    note={budgetLabel(data.budget_max_cents)}
                >
                    {() => (
                        <div className="flex flex-col gap-2 pt-1">
                            <Slider
                                min={BUDGET_MIN_CENTS}
                                max={BUDGET_MAX_CENTS}
                                step={BUDGET_STEP_CENTS}
                                value={[
                                    data.budget_max_cents ?? BUDGET_START_CENTS,
                                ]}
                                onValueChange={([cents]) =>
                                    setData('budget_max_cents', cents)
                                }
                                thumbLabel="Budget indicativo a seduta"
                                valueText={budgetLabel(data.budget_max_cents)}
                                className="py-2"
                            />
                            <div
                                aria-hidden="true"
                                className="flex justify-between text-xs text-muted-foreground tabular-nums"
                            >
                                <span>{formatPrice(BUDGET_MIN_CENTS)}</span>
                                <span>{formatPrice(BUDGET_MAX_CENTS)}+</span>
                            </div>
                        </div>
                    )}
                </Choice>
            </Card>
        </>
    );
}

/**
 * "Carica una foto": the file input is hidden, the button opens it. The photo
 * is saved right away, then the new auth.user.avatar comes back with the page.
 */
function PhotoUpload({ name, src }: { name: string; src?: string | null }) {
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

    // The X, as on the trainer's "Modifica profilo": deleted right away.
    const remove = () => {
        setError(null);
        router.delete(CompleteProfileController.destroyPhoto.url(), {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setRemoving(true),
            onFinish: () => setRemoving(false),
        });
    };

    return (
        <div className="flex items-center gap-4">
            <div className="relative flex-none">
                <UserAvatar
                    name={name}
                    src={src}
                    size="xl"
                    className="size-16"
                />
                {src && (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Rimuovi la foto"
                        disabled={removing || uploading}
                        onClick={remove}
                        className="absolute -top-1 -right-1 size-7 rounded-full shadow-sm"
                    >
                        <X className="size-4" />
                    </Button>
                )}
            </div>
            <div className="flex flex-col items-start gap-1.5">
                <span className="text-[15px] font-semibold">Foto profilo</span>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={upload}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    aria-describedby={error ? errorId : undefined}
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload aria-hidden="true" />
                    {uploading
                        ? 'Caricamento…'
                        : src
                          ? 'Cambia foto'
                          : 'Carica una foto'}
                </Button>
                {error ? (
                    <span id={errorId} className="text-xs text-destructive">
                        {error}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        Facoltativa. La vedono solo i trainer a cui chiedi una
                        seduta. JPG o PNG, massimo 5 MB.
                    </span>
                )}
            </div>
        </div>
    );
}

function Card({ children }: { children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-6">
            {children}
        </section>
    );
}

/** A group of chips with its title, read as one question by screen readers. */
function Choice({
    legend,
    note,
    children,
}: {
    legend: string;
    note?: string;
    children: (labelId: string) => ReactNode;
}) {
    const labelId = useId();

    return (
        <div className="flex flex-col gap-2.5">
            <span id={labelId} className="text-[15px] font-semibold">
                {legend}
                {note && (
                    <span className="font-normal text-muted-foreground">
                        {' '}
                        · {note}
                    </span>
                )}
            </span>
            {children(labelId)}
        </div>
    );
}
