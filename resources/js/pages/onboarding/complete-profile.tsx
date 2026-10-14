import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Check, Navigation, Upload } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import CompleteProfileController from '@/actions/App/Http/Controllers/CompleteProfileController';
import MinimalHeader from '@/components/layout/minimal-header';
import FilterSelect from '@/components/search/filter-select';
import ChoiceChips from '@/components/shared/choice-chips';
import type { ChoiceOption } from '@/components/shared/choice-chips';
import ProgressBar from '@/components/shared/progress-bar';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatPrice } from '@/lib/format';
import { closestCity, currentPosition } from '@/lib/geo';
import { bookings } from '@/routes/client';
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
type SavedPreferences = {
    city: string | null;
    mode: string | null;
    goal: string | null;
    disciplines: string[];
    times: string[];
    budgetMaxCents: number | null;
};

type CompleteProfileProps = {
    /** From the catalog. */
    disciplines: CatalogOption[];
    cities: CityWithCoordinates[];
    /** Null until the client saves the page once. */
    preferences: SavedPreferences | null;
};

/**
 * Optional page right after the client sign-up, and from Account later on.
 * Saved in `client_preferences`; the photo is saved as soon as it is chosen.
 */
export default function CompleteProfile({
    disciplines,
    cities,
    preferences,
}: CompleteProfileProps) {
    const { auth } = usePage().props;

    const form = useForm({
        city: preferences?.city ?? null,
        mode: preferences?.mode ?? null,
        goal: preferences?.goal ?? null,
        disciplines: preferences?.disciplines ?? [],
        times: preferences?.times ?? [],
        budget_max_cents: preferences?.budgetMaxCents ?? null,
    });
    const { data, setData } = form;

    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Account and name count as already done, as in the design.
    const filled =
        2 +
        Number(data.goal !== null) +
        Number(data.disciplines.length > 0) +
        Number(data.times.length > 0) +
        Number(data.budget_max_cents !== null) +
        Number(data.city !== null);
    const percent = Math.round((filled / 7) * 100);

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

    const save = (event: FormEvent) => {
        event.preventDefault();
        form.put(CompleteProfileController.update.url());
    };

    // Only possible if someone changes the page by hand: one line is enough.
    const firstError = Object.values(form.errors)[0];

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Completa il tuo profilo" />

            <MinimalHeader logoLinksHome={false}>
                <Link href={bookings()} className="font-medium text-foreground">
                    Salta per ora
                </Link>
            </MinimalHeader>

            <form
                onSubmit={save}
                className="mx-auto flex w-full max-w-190 flex-col gap-5 px-4 pt-5 pb-10 md:px-8 md:pt-10 md:pb-16"
            >
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm tabular-nums">
                            <span className="font-medium">
                                Profilo completo al {percent}%
                            </span>
                            <span className="text-muted-foreground">
                                Facoltativo
                            </span>
                        </div>
                        <ProgressBar
                            value={percent}
                            label="Completamento del profilo"
                        />
                    </div>
                    <span className="inline-flex h-6.5 items-center gap-1.5 self-start rounded-full bg-primary px-2.5 text-xs font-semibold text-primary-foreground">
                        <Check aria-hidden="true" className="size-3.5" />
                        Account creato
                    </span>
                    <h1 className="text-[28px] leading-8.5 font-bold tracking-tight md:text-4xl">
                        Completa il tuo profilo
                    </h1>
                    <p className="text-muted-foreground">
                        Un minuto in più ci aiuta a suggerirti i trainer e gli
                        orari giusti.
                    </p>
                </div>

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
                                        data.budget_max_cents ??
                                            BUDGET_START_CENTS,
                                    ]}
                                    onValueChange={([cents]) =>
                                        setData('budget_max_cents', cents)
                                    }
                                    thumbLabel="Budget indicativo a seduta"
                                    valueText={budgetLabel(
                                        data.budget_max_cents,
                                    )}
                                    className="py-2"
                                />
                                <div
                                    aria-hidden="true"
                                    className="flex justify-between text-xs text-muted-foreground tabular-nums"
                                >
                                    <span>{formatPrice(BUDGET_MIN_CENTS)}</span>
                                    <span>
                                        {formatPrice(BUDGET_MAX_CENTS)}+
                                    </span>
                                </div>
                            </div>
                        )}
                    </Choice>
                </Card>

                {firstError && (
                    <p role="alert" className="text-sm text-destructive">
                        {firstError}
                    </p>
                )}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="h-12 flex-[1_1_220px] text-base font-semibold"
                    >
                        Salva e continua
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-12 flex-[1_1_220px] text-base"
                    >
                        <Link href={bookings()}>Salta per ora</Link>
                    </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                    Puoi completare o cambiare tutto quando vuoi da Account. Non
                    ti chiediamo dati sulla salute.
                </p>
            </form>
        </div>
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
    const [error, setError] = useState<string | null>(null);

    const upload = (event: ChangeEvent<HTMLInputElement>) => {
        const photo = event.target.files?.[0];
        // Lets the same file be chosen again after an error.
        event.target.value = '';

        if (!photo) {
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

    return (
        <div className="flex items-center gap-4">
            <UserAvatar name={name} src={src} size="xl" className="size-16" />
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
