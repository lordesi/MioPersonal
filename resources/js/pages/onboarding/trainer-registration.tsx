import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccountField } from '@/components/auth/account-fields';
import ExistingAccountDialog from '@/components/auth/existing-account-dialog';
import type { ExistingAccount } from '@/components/auth/existing-account-dialog';
import { meetsPasswordRequirements } from '@/components/auth/password-requirements';
import DarkShell, {
    ShellFooter,
    shellBackClassName,
    shellLinkClassName,
    shellNextClassName,
    shellSendClassName,
} from '@/components/onboarding/dark-shell';
import ChangeRequestNotice from '@/components/onboarding/trainer/change-request-notice';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    initialDraft,
    isCertificationValid,
    isFilled,
    isPricingComplete,
    isProfileComplete,
    stepOfField,
    toPayload,
    weeklyHours,
} from '@/components/onboarding/trainer/draft';
import {
    clearDraft,
    loadDraft,
    saveDraft,
} from '@/components/onboarding/trainer/saved-draft';
import StepAccount from '@/components/onboarding/trainer/step-account';
import StepCertifications from '@/components/onboarding/trainer/step-certifications';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import StepHours, {
    hoursSummary,
} from '@/components/onboarding/trainer/step-hours';
import StepPlaces, {
    placesChecks,
} from '@/components/onboarding/trainer/step-places';
import StepProfile, {
    profileStatus,
    usePhotoPreview,
} from '@/components/onboarding/trainer/step-profile';
import StepReview from '@/components/onboarding/trainer/step-review';
import StepServices, {
    servicesSummary,
} from '@/components/onboarding/trainer/step-services';
import Submitted, {
    submittedIntro,
} from '@/components/onboarding/trainer/submitted';
import type { GymOption } from '@/components/onboarding/trainer/draft';
import { Spinner } from '@/components/ui/spinner';
import { home, login } from '@/routes';
import { home as clientHome } from '@/routes/client';
import { today } from '@/routes/trainer';
import { check, store } from '@/routes/trainer/register';
import type { CatalogOption, CityOption } from '@/types';

const LAST_STEP = 7;

/** What the dark shell shows of "Diventa trainer". */
const trainerShell = {
    steps: [
        'Account',
        'Profilo',
        'Discipline',
        'Servizi',
        'Orari',
        'Certificazioni',
        'Riepilogo',
    ],
    eyebrow: 'Diventa trainer',
    heroImage: '/images/design/pro-trainer.webp',
    heroClassName: 'object-[50%_25%]',
};

/** Phones and desktop have their own words in the design. */
function title(phone: ReactNode, desktop: ReactNode) {
    return (
        <>
            <span className="md:hidden">{phone}</span>
            <span className="hidden md:inline">{desktop}</span>
        </>
    );
}

/** The titles of the design: light, with the key words in bold. */
const titles: Record<number, ReactNode> = {
    2: title(
        <>
            Il tuo <strong>profilo pubblico</strong>.
        </>,
        <>
            Il tuo <strong>profilo</strong>
        </>,
    ),
    3: title(
        <>
            Cosa insegni e <strong>dove alleni</strong>.
        </>,
        <>
            Discipline e <strong>luoghi</strong>
        </>,
    ),
    4: title(
        <>
            Le tue <strong>sedute</strong> e i <strong>prezzi</strong>.
        </>,
        <>
            Servizi e <strong>prezzi</strong>
        </>,
    ),
    5: title(
        <>
            Quando <strong>alleni</strong> e come <strong>prenotano</strong>.
        </>,
        <>
            Orari e <strong>regole</strong>
        </>,
    ),
    6: title(
        <>
            La tua <strong>formazione</strong>.
        </>,
        <>
            Formazione e <strong>certificazioni</strong>
        </>,
    ),
    7: title(
        <>
            Ci siamo: <strong>controlla e invia</strong>.
        </>,
        <>
            La tua <strong>candidatura</strong>
        </>,
    ),
};

type TrainerRegistrationProps = {
    /** True right after the account was created. */
    submitted: boolean;
    /** A logged-in client: they keep their account, step 1 only asks for the terms. */
    account: { name: string; email: string } | null;
    /** Options of step 3, from the catalog. */
    disciplines: CatalogOption[];
    cities: CityOption[];
    /** "In palestra": the approved gyms of MioPersonal. */
    gyms: GymOption[];
    /** A trainer fixing the profile: no step 1, it starts from step 2. */
    editing: boolean;
    /** What the trainer already sent (null the first time). */
    draft: Omit<TrainerDraft, 'photo'> | null;
    /** What the team asked to fix ("Chiedi modifiche"). */
    changeRequest: { reasons: string[]; message: string | null } | null;
    /** The trainer's own profile, for "Vedi l'anteprima del profilo". */
    previewHref: string | null;
    /** "miopersonal.it/trainer/": the public link, shown under the username. */
    usernameLinkPrefix: string;
};

/**
 * "Diventa trainer": 7 steps, then the team checks the profile. "Continua"
 * asks the server to check the fields of the step (nothing is saved);
 * "Invia per approvazione" creates the account and the profile.
 */
export default function TrainerRegistration({
    submitted,
    account,
    disciplines,
    cities,
    gyms,
    editing,
    draft: savedDraft,
    changeRequest,
    previewHref,
    usernameLinkPrefix,
}: TrainerRegistrationProps) {
    const authUser = usePage().props.auth?.user;
    // The draft of "Salva ed esci" is kept per account in this browser.
    const userId = authUser?.id ?? null;
    const firstStep = editing ? 2 : 1;
    // Step 1: the account. The other steps are in `draft` and sent at the end.
    const form = useForm({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        terms: false,
    });
    const [step, setStep] = useState(firstStep);
    // A profile already sent can be opened at any step.
    const [reached, setReached] = useState(savedDraft ? LAST_STEP : firstStep);
    const startingDraft: TrainerDraft = savedDraft
        ? { ...savedDraft, photo: null }
        : initialDraft;
    const [draft, setDraft] = useState<TrainerDraft>(startingDraft);
    const photo = usePhotoPreview(draft);
    const [confirmed, setConfirmed] = useState(false);
    const [restored, setRestored] = useState(false);
    // The step reached in the saved draft. Step 1 (account and terms) is never
    // saved, so the later steps open again only after it: see goTo.
    const [restoredStep, setRestoredStep] = useState(0);
    // Step 1: an email or phone that already has an account opens "Hai già un account?".
    const [existing, setExisting] = useState<ExistingAccount | null>(null);

    // Read after the first render: the page is also rendered on the server
    // (SSR), where there is no localStorage.
    useEffect(() => {
        if (submitted) {
            return;
        }

        const local = loadDraft(userId);

        if (local) {
            setDraft(local.draft);
            setRestoredStep(Math.min(local.step, LAST_STEP));
            setRestored(true);
        }
    }, [submitted, userId]);

    if (submitted) {
        return (
            <>
                <Head title="Profilo inviato" />
                <DarkShell
                    {...trainerShell}
                    step={null}
                    hero
                    icon={<Check aria-hidden="true" strokeWidth={2.5} />}
                    title={
                        <>
                            Profilo <strong>inviato</strong>.
                        </>
                    }
                    intro={submittedIntro(authUser?.name)}
                >
                    <Submitted previewHref={previewHref} />
                </DarkShell>
            </>
        );
    }

    // "Annulla" and "Salva ed esci" go back to where the user came from.
    let exitHref = home.url();

    if (editing) {
        exitHref = today.url();
    } else if (account) {
        exitHref = clientHome.url();
    }

    const saveAndExit = () => {
        saveDraft(userId, draft, Math.max(step, reached));
        router.visit(exitHref);
    };

    const startOver = () => {
        clearDraft(userId);
        setDraft(startingDraft);
        setReached(savedDraft ? LAST_STEP : firstStep);
        setStep(firstStep);
        setRestored(false);
        setRestoredStep(0);
    };

    const update = (changes: Partial<TrainerDraft>) =>
        setDraft((current) => ({ ...current, ...changes }));

    const fullName = editing
        ? (authUser?.name ?? '')
        : (account?.name ??
          `${form.data.first_name} ${form.data.last_name}`.trim());
    const email = editing
        ? (authUser?.email ?? '')
        : (account?.email ?? form.data.email);
    const firstSession = draft.pricing.firstSession;
    const certificationsDone = draft.certifications.filter(isFilled);
    const missingPlaces = placesChecks(draft).filter((item) => !item.done);

    const canContinue: Record<number, boolean> = {
        1: account
            ? form.data.terms
            : form.data.first_name.trim() !== '' &&
              form.data.last_name.trim() !== '' &&
              form.data.username.trim() !== '' &&
              form.data.email.trim() !== '' &&
              form.data.phone.trim() !== '' &&
              meetsPasswordRequirements(form.data.password) &&
              form.data.terms,
        // Step 2: everything is required (photo, headline, bio, experience).
        2: isProfileComplete(draft),
        3: missingPlaces.length === 0,
        // Step 4: a price for each duration, and every optional part complete.
        // "Ridotta" is at least 1 €: 0 is "Gratuita".
        4:
            isPricingComplete(draft) &&
            (!firstSession.enabled ||
                firstSession.priceCents === 0 ||
                (firstSession.priceCents ?? 0) >= 100),
        // At least one hour open in the week, or nobody can book.
        5: weeklyHours(draft.hours) > 0,
        // Optional, but a started certification needs title, issuer and a real year.
        6: draft.certifications.every(isCertificationValid),
        7: confirmed,
    };

    // The line next to "Continua" (desktop) or above it (phones).
    const ready = 'Tutto pronto per questo passo';
    const statuses: Record<number, string> = {
        1: canContinue[1]
            ? ready
            : account
              ? 'Accetta i termini per continuare'
              : 'Compila i campi e accetta i termini per continuare',
        2: profileStatus(draft, photo !== null),
        3:
            missingPlaces.length === 0
                ? ready
                : `Scegli almeno ${missingPlaces.map((item) => item.label).join(', ')}`,
        4: canContinue[4]
            ? servicesSummary(draft)
            : 'Scrivi un prezzo per ogni durata',
        5:
            weeklyHours(draft.hours) > 0
                ? hoursSummary(draft.hours)
                : 'Accendi almeno un giorno',
        6: canContinue[6]
            ? certificationsDone.length === 0
                ? 'Facoltativo: puoi saltarlo'
                : ready
            : 'Completa titolo, ente e anno',
        7: confirmed
            ? `${LAST_STEP - firstStep} passi completati: pronto per l’invio`
            : 'Spunta la conferma per inviare',
    };

    const goTo = (next: number) => {
        setStep(next);
        // Past the first step, the steps of a restored draft open again.
        setReached(
            Math.max(reached, next, next > firstStep ? restoredStep : 0),
        );
        window.scrollTo({ top: 0 });
    };

    // A client already has name, email and password: only the terms are
    // sent. A trainer fixing the profile sends only the profile.
    const payload = (data: typeof form.data) => ({
        ...(editing ? {} : account ? { terms: data.terms } : data),
        ...toPayload(draft),
    });

    // "Continua": the server checks the fields of this step now, so its
    // errors show up here and not after "Invia per approvazione".
    const checkStep = () => {
        form.transform((data) =>
            Object.fromEntries(
                Object.entries(payload(data)).filter(
                    ([field]) => stepOfField(field) === step,
                ),
            ),
        );
        form.post(check.url(step), {
            queryStringArrayFormat: 'indices',
            // The draft stays, and no extra entries in the browser history.
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => goTo(step + 1),
            // Up to "Da sistemare in questo passo:".
            onError: () => window.scrollTo({ top: 0 }),
        });
    };

    const submit = () => {
        form.transform(payload);
        form.post(store.url(), {
            // With files the data goes as FormData: lists of objects need indices.
            queryStringArrayFormat: 'indices',
            // Sent: the draft of this browser is not needed any more.
            onSuccess: () => clearDraft(userId),
            // Open the first step with an error.
            onError: (errors) =>
                goTo(
                    Math.max(
                        firstStep,
                        Math.min(...Object.keys(errors).map(stepOfField)),
                    ),
                ),
        });
    };

    const stepErrors = Object.entries(form.errors)
        .filter(([field]) => step > 1 && stepOfField(field) === step)
        .map(([, message]) => message);

    const bind = (field: AccountField) => ({
        value: form.data[field],
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            form.setData(field, event.target.value),
    });

    const guestStart = step === 1 && !account;
    const topRight =
        step > 1 ? (
            <button
                type="button"
                onClick={saveAndExit}
                className="flex h-11 items-center rounded-full bg-[rgba(10,10,10,0.55)] px-4.5 text-[15px] font-semibold shadow-[inset_0_0_0_1.5px_var(--foreground)] outline-none hover:bg-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 md:h-auto md:bg-transparent md:px-0 md:text-brand md:shadow-none md:hover:bg-transparent md:hover:underline"
            >
                Salva ed esci
            </button>
        ) : guestStart ? (
            <p className="hidden items-center gap-2 text-[15px] text-muted-foreground md:flex">
                Hai già un account?
                <Link href={login()} className={shellLinkClassName}>
                    Accedi
                </Link>
            </p>
        ) : undefined;

    const back =
        step === firstStep ? (
            <Link href={exitHref} className={shellBackClassName}>
                Annulla
            </Link>
        ) : (
            <button
                type="button"
                onClick={() => goTo(step - 1)}
                className={shellBackClassName}
            >
                Indietro
            </button>
        );

    // Step 6 without certifications: "Salta questo passo" next to "Continua".
    const canSkip = step === 6 && certificationsDone.length === 0;

    return (
        <>
            <Head title="Diventa trainer" />

            {/* A real form: Enter goes to the next step and password managers work. */}
            <form
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();

                    if (!canContinue[step] || form.processing) {
                        return;
                    }

                    if (step === LAST_STEP) {
                        submit();
                    } else {
                        checkStep();
                    }
                }}
            >
                <DarkShell
                    {...trainerShell}
                    step={step}
                    reached={reached}
                    firstStep={firstStep}
                    onSelect={goTo}
                    onBack={step > firstStep ? () => goTo(step - 1) : undefined}
                    hero={step === 1}
                    title={
                        step === 1 ? (
                            account ? (
                                <>
                                    Diventa <strong>trainer</strong>.
                                </>
                            ) : (
                                <>
                                    Crea il tuo <strong>account trainer</strong>
                                    .
                                </>
                            )
                        ) : (
                            <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <span>{titles[step]}</span>
                                {step === 6 && (
                                    <span className="rounded-full px-3 py-1 text-[13px] font-semibold tracking-normal text-muted-foreground shadow-[inset_0_0_0_1px_var(--field)]">
                                        Facoltativo
                                    </span>
                                )}
                            </span>
                        )
                    }
                    intro={
                        step === 2 ? (
                            <span className="md:hidden">
                                È la prima cosa che vede chi ti cerca.
                            </span>
                        ) : step === LAST_STEP ? (
                            <span className="hidden md:inline">
                                Dai un’ultima occhiata. Dopo l’invio il nostro
                                team controlla il profilo prima di pubblicarlo.
                            </span>
                        ) : undefined
                    }
                    topRight={topRight}
                    footer={
                        <ShellFooter
                            back={back}
                            status={statuses[step]}
                            noteAbove={statuses[step]}
                            noteBelow={
                                guestStart ? (
                                    <>
                                        Hai già un account?{' '}
                                        <Link
                                            href={login()}
                                            className="font-semibold text-brand"
                                        >
                                            Accedi
                                        </Link>
                                    </>
                                ) : canSkip ? (
                                    <button
                                        type="button"
                                        onClick={() => goTo(step + 1)}
                                        className="min-h-11 font-semibold text-foreground underline underline-offset-3"
                                    >
                                        Salta questo passo
                                    </button>
                                ) : step === LAST_STEP && previewHref ? (
                                    <Link
                                        href={previewHref}
                                        className="font-semibold text-brand"
                                    >
                                        Vedi l’anteprima del profilo
                                    </Link>
                                ) : undefined
                            }
                        >
                            {/* Desktop: the extra link before the button. */}
                            {canSkip && (
                                <button
                                    type="button"
                                    onClick={() => goTo(step + 1)}
                                    className={`${shellBackClassName} hidden md:flex`}
                                >
                                    Salta questo passo
                                </button>
                            )}
                            {step === LAST_STEP && previewHref && (
                                <Link
                                    href={previewHref}
                                    className={`${shellLinkClassName} hidden md:flex`}
                                >
                                    Vedi l’anteprima del profilo
                                </Link>
                            )}
                            <button
                                type="submit"
                                disabled={!canContinue[step] || form.processing}
                                className={
                                    step === LAST_STEP
                                        ? shellSendClassName
                                        : shellNextClassName
                                }
                            >
                                {form.processing && <Spinner />}
                                {step === LAST_STEP
                                    ? 'Invia per approvazione'
                                    : 'Continua'}
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4.5 md:hidden"
                                />
                            </button>
                        </ShellFooter>
                    }
                >
                    {(changeRequest && step === firstStep) ||
                    (restored && step === firstStep) ||
                    stepErrors.length > 0 ? (
                        <div className="-mt-4 flex flex-col gap-3">
                            {changeRequest && step === firstStep && (
                                <ChangeRequestNotice {...changeRequest} />
                            )}
                            {restored && step === firstStep && (
                                <div
                                    role="status"
                                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[20px] bg-card px-4 py-3 text-[15px]"
                                >
                                    <span>
                                        Abbiamo ripreso la bozza salvata.{' '}
                                        {editing || account
                                            ? 'Foto e attestati vanno ricaricati.'
                                            : 'Ricompila l’account; foto e attestati vanno ricaricati.'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={startOver}
                                        className={shellLinkClassName}
                                    >
                                        Ricomincia da capo
                                    </button>
                                </div>
                            )}
                            <StepErrors errors={stepErrors} />
                        </div>
                    ) : null}

                    {step === 1 && (
                        <StepAccount
                            account={account}
                            fields={{
                                errors: form.errors,
                                bind,
                                acceptedTerms: form.data.terms,
                                onTermsChange: (accepted) =>
                                    form.setData('terms', accepted),
                                onAccountExists: (field, value) =>
                                    setExisting({ field, value }),
                                usernameLinkPrefix,
                            }}
                        />
                    )}
                    {step === 2 && (
                        <StepProfile
                            draft={draft}
                            update={update}
                            name={fullName}
                            photo={photo}
                        />
                    )}
                    {step === 3 && (
                        <StepPlaces
                            draft={draft}
                            update={update}
                            disciplines={disciplines}
                            cities={cities}
                            gymOptions={gyms}
                        />
                    )}
                    {step === 4 && (
                        <StepServices draft={draft} update={update} />
                    )}
                    {step === 5 && <StepHours draft={draft} update={update} />}
                    {step === 6 && (
                        <StepCertifications draft={draft} update={update} />
                    )}
                    {step === 7 && (
                        <StepReview
                            draft={draft}
                            name={fullName}
                            email={email}
                            editing={editing}
                            disciplines={disciplines}
                            cities={cities}
                            confirmed={confirmed}
                            onConfirmedChange={setConfirmed}
                            onEdit={goTo}
                        />
                    )}
                </DarkShell>
            </form>

            {/* Outside the <form>: its "Accedi" must not go to the next step. */}
            <ExistingAccountDialog
                account={existing}
                onClose={() => setExisting(null)}
            />
        </>
    );
}
