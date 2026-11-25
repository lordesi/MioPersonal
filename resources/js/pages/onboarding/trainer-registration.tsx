import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
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
import { AccountUsernameField } from '@/components/onboarding/account-step';
import ChangeRequestNotice from '@/components/onboarding/trainer/change-request-notice';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    BIO_MIN,
    initialDraft,
    isCertificationValid,
    isFilled,
    isPricingComplete,
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
import StepHours from '@/components/onboarding/trainer/step-hours';
import StepPlaces, {
    placesChecks,
} from '@/components/onboarding/trainer/step-places';
import StepProfile, {
    usePhotoPreview,
} from '@/components/onboarding/trainer/step-profile';
import StepReview from '@/components/onboarding/trainer/step-review';
import StepServices from '@/components/onboarding/trainer/step-services';
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

/** The screens of the design "Diventa trainer · N di 9". */
const SCREENS = [
    'Account',
    'Foto profilo',
    'Presentazione',
    'Discipline',
    'Dove alleni',
    'Servizi e prezzi',
    'Orari',
    'Certificazioni',
    'Riepilogo',
];

const LAST_STEP = SCREENS.length;

/**
 * The step the server checks for each screen (TrainerRegistrationStepRequest,
 * fieldSteps in draft.ts): photo and presentation are its step 2,
 * disciplines and places its step 3.
 */
const SERVER_STEP = [0, 1, 2, 2, 3, 3, 4, 5, 6, 7];

/** The screens that only show the first part of a server step. */
const FIRST_HALVES = [2, 4];

/** The screen of a field with an error. */
function screenOfField(field: string): number {
    const serverStep = stepOfField(field);

    if (serverStep === 2) {
        return field.startsWith('photo') ? 2 : 3;
    }

    if (serverStep === 3) {
        return field.startsWith('disciplines') || field.startsWith('goals')
            ? 4
            : 5;
    }

    return serverStep === 1 ? 1 : serverStep + 2;
}

/** The titles of the design, the key word in bold, and the line under them. */
const titles: Record<number, { title: ReactNode; intro?: ReactNode }> = {
    2: {
        title: (
            <>
                Aggiungi una <strong>foto</strong>
            </>
        ),
        intro: 'È la prima cosa che vedono i clienti quando ti cercano.',
    },
    3: {
        title: (
            <>
                Presentati ai <strong>clienti</strong>
            </>
        ),
        intro: 'Poche righe su chi sei e come lavori.',
    },
    4: {
        title: (
            <>
                Cosa <strong>insegni</strong>?
            </>
        ),
        intro: 'Scegli le discipline e gli obiettivi con cui aiuti i clienti.',
    },
    5: {
        title: (
            <>
                Dove <strong>alleni</strong>?
            </>
        ),
        intro: 'Puoi sceglierne più di uno.',
    },
    6: {
        title: (
            <>
                Quanto costa una <strong>seduta</strong>?
            </>
        ),
        intro: 'Scegli le durate, scrivi i prezzi, aggiungi gli extra se vuoi.',
    },
    7: {
        title: (
            <>
                Quando <strong>lavori</strong>?
            </>
        ),
        intro: 'I clienti potranno prenotare solo in questi orari.',
    },
    8: {
        title: (
            <>
                La tua <strong>formazione</strong>
            </>
        ),
        intro: 'Titolo, ente e anno compaiono sul profilo. Gli attestati li vede solo il nostro team.',
    },
    9: {
        title: (
            <>
                Controlla e <strong>invia</strong>
            </>
        ),
        intro: 'Il nostro team verifica il profilo prima di pubblicarlo.',
    },
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
 * "Diventa trainer": 9 screens, then the team checks the profile. "Continua"
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
                    steps={SCREENS}
                    step={null}
                    icon={<Check aria-hidden="true" strokeWidth={2.5} />}
                    title={
                        <>
                            Profilo <strong>inviato</strong>
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

    const missing = (labels: string[]) =>
        missingPlaces.some((item) => labels.includes(item.label));

    const canContinue: Record<number, boolean> = {
        1: account
            ? form.data.terms
            : form.data.first_name.trim() !== '' &&
              form.data.last_name.trim() !== '' &&
              form.data.email.trim() !== '' &&
              form.data.phone.trim() !== '' &&
              meetsPasswordRequirements(form.data.password) &&
              form.data.terms,
        2: photo !== null,
        // Headline, bio and experience; a guest also chooses the username.
        3:
            draft.headline.trim() !== '' &&
            draft.bio.trim().length >= BIO_MIN &&
            draft.experience !== '' &&
            (editing || account !== null || form.data.username.trim() !== ''),
        4: !missing(['una disciplina', 'un obiettivo']),
        5: missingPlaces.length === 0,
        // A price for each duration, and every optional part complete.
        // "Ridotta" is at least 1 €: 0 is "Gratuita".
        6:
            isPricingComplete(draft) &&
            (!firstSession.enabled ||
                firstSession.priceCents === 0 ||
                (firstSession.priceCents ?? 0) >= 100),
        // At least one hour open in the week, or nobody can book.
        7: weeklyHours(draft.hours) > 0,
        // Optional, but a started certification needs title, issuer and a real year.
        8: draft.certifications.every(isCertificationValid),
        9: confirmed,
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
    // errors show up here and not after "Invia per approvazione". The first
    // half of a server step (photo, disciplines) is checked with the second.
    const checkStep = () => {
        if (FIRST_HALVES.includes(step)) {
            goTo(step + 1);

            return;
        }

        const serverStep = SERVER_STEP[step];

        form.transform((data) =>
            Object.fromEntries(
                Object.entries(payload(data)).filter(
                    ([field]) => stepOfField(field) === serverStep,
                ),
            ),
        );
        form.post(check.url(serverStep), {
            queryStringArrayFormat: 'indices',
            // The draft stays, and no extra entries in the browser history.
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => goTo(step + 1),
            // An error of the screen before (the photo, the disciplines): back there.
            onError: (errors) => {
                const first = Math.min(
                    ...Object.keys(errors).map(screenOfField),
                );

                if (first < step) {
                    goTo(first);
                } else {
                    window.scrollTo({ top: 0 });
                }
            },
        });
    };

    const submit = () => {
        form.transform(payload);
        form.post(store.url(), {
            // With files the data goes as FormData: lists of objects need indices.
            queryStringArrayFormat: 'indices',
            // Sent: the draft of this browser is not needed any more.
            onSuccess: () => clearDraft(userId),
            // Open the first screen with an error.
            onError: (errors) =>
                goTo(
                    Math.max(
                        firstStep,
                        Math.min(...Object.keys(errors).map(screenOfField)),
                    ),
                ),
        });
    };

    const stepErrors = Object.entries(form.errors)
        .filter(([field]) => step > 1 && screenOfField(field) === step)
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
                className="flex h-9 items-center rounded-full px-3.5 text-[15px] font-semibold text-foreground outline-none hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-ring"
            >
                Salva ed esci
            </button>
        ) : undefined;

    // Step 8 without certifications: "Salta questo passo" instead of "Indietro".
    const canSkip = step === 8 && certificationsDone.length === 0;
    const back = canSkip ? (
        <button
            type="button"
            onClick={() => goTo(step + 1)}
            className={shellBackClassName}
        >
            Salta questo passo
        </button>
    ) : step > firstStep ? (
        <button
            type="button"
            onClick={() => goTo(step - 1)}
            className={shellBackClassName}
        >
            Indietro
        </button>
    ) : undefined;

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
                    steps={SCREENS}
                    step={step}
                    optional={step === 8}
                    title={
                        step === 1 ? (
                            account ? (
                                <>
                                    Diventa <strong>trainer</strong>
                                </>
                            ) : (
                                <>
                                    Crea il tuo <strong>account</strong>
                                </>
                            )
                        ) : (
                            titles[step].title
                        )
                    }
                    intro={
                        step === 1
                            ? account
                                ? 'Il tuo account resta lo stesso: accetta i termini per i trainer.'
                                : 'Bastano due minuti. Poi ti chiediamo come lavori.'
                            : titles[step].intro
                    }
                    topRight={topRight}
                    footer={
                        <ShellFooter
                            back={back}
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
                    {(step === 2 || step === 3) && (
                        <StepProfile
                            part={step === 2 ? 'photo' : 'about'}
                            draft={draft}
                            update={update}
                            name={fullName}
                            photo={photo}
                            username={
                                !editing && !account ? (
                                    <AccountUsernameField
                                        errors={form.errors}
                                        bind={bind}
                                        usernameLinkPrefix={usernameLinkPrefix}
                                    />
                                ) : undefined
                            }
                        />
                    )}
                    {(step === 4 || step === 5) && (
                        <StepPlaces
                            part={step === 4 ? 'disciplines' : 'places'}
                            draft={draft}
                            update={update}
                            disciplines={disciplines}
                            cities={cities}
                            gymOptions={gyms}
                        />
                    )}
                    {step === 6 && (
                        <StepServices draft={draft} update={update} />
                    )}
                    {step === 7 && <StepHours draft={draft} update={update} />}
                    {step === 8 && (
                        <StepCertifications draft={draft} update={update} />
                    )}
                    {step === 9 && (
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
                            hasPhoto={photo !== null}
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
