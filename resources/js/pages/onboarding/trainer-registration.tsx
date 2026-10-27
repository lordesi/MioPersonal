import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { meetsPasswordRequirements } from '@/components/auth/password-requirements';
import type { AccountField } from '@/components/auth/account-fields';
import ExistingAccountDialog from '@/components/auth/existing-account-dialog';
import type { ExistingAccount } from '@/components/auth/existing-account-dialog';
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
import OnboardingShell, {
    HeaderPill,
    StepBar,
    StepHeader,
} from '@/components/onboarding/trainer/onboarding-shell';
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
import Submitted from '@/components/onboarding/trainer/submitted';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { home as clientHome } from '@/routes/client';
import { today } from '@/routes/trainer';
import { check, store } from '@/routes/trainer/register';
import type { CatalogOption, CityOption } from '@/types';

const LAST_STEP = 7;

/** The h1 of each step, as in the design (step 1 depends on the account). */
const titles: Record<number, string> = {
    2: 'Il tuo profilo',
    3: 'Discipline, obiettivi, luoghi e città',
    4: 'Servizi e prezzi',
    5: 'Orari e regole',
    6: 'Formazione e certificazioni',
    7: 'La tua candidatura',
};

type TrainerRegistrationProps = {
    /** True right after the account was created. */
    submitted: boolean;
    /** A logged-in client: they keep their account, step 1 only asks for the terms. */
    account: { name: string; email: string } | null;
    /** Options of step 3, from the catalog. */
    disciplines: CatalogOption[];
    cities: CityOption[];
    /** A trainer fixing the profile: no step 1, it starts from step 2. */
    editing: boolean;
    /** What the trainer already sent (null the first time). */
    draft: Omit<TrainerDraft, 'photo'> | null;
    /** What the team asked to fix ("Chiedi modifiche"). */
    changeRequest: { reasons: string[]; message: string | null } | null;
    /** The trainer's own profile, for "Vedi l'anteprima del profilo". */
    previewHref: string | null;
};

export default function TrainerRegistration({
    submitted,
    account,
    disciplines,
    cities,
    editing,
    draft: savedDraft,
    changeRequest,
    previewHref,
}: TrainerRegistrationProps) {
    const authUser = usePage().props.auth?.user;
    // The draft of "Salva e continua dopo" is kept per account in this browser.
    const userId = authUser?.id ?? null;
    const firstStep = editing ? 2 : 1;
    // Step 1: the account. The other steps are in `draft` and sent at the end.
    const form = useForm({
        first_name: '',
        last_name: '',
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
    // "Salva e continua dopo": the button says "Bozza salvata" after saving.
    const [saved, setSaved] = useState(false);
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
                <OnboardingShell
                    step={LAST_STEP + 1}
                    reached={LAST_STEP}
                    firstStep={LAST_STEP + 1}
                    onSelect={() => {}}
                    user={
                        authUser
                            ? { name: authUser.name, email: authUser.email }
                            : null
                    }
                >
                    <Submitted previewHref={previewHref} />
                </OnboardingShell>
            </>
        );
    }

    const saveLater = () =>
        setSaved(saveDraft(userId, draft, Math.max(step, reached)));

    const startOver = () => {
        clearDraft(userId);
        setDraft(startingDraft);
        setReached(savedDraft ? LAST_STEP : firstStep);
        setStep(firstStep);
        setRestored(false);
        setRestoredStep(0);
        setSaved(false);
    };

    // A change after "Salva e continua dopo" is not in the saved draft any more.
    const update = (changes: Partial<TrainerDraft>) => {
        setDraft({ ...draft, ...changes });
        setSaved(false);
    };

    const fullName = editing
        ? (authUser?.name ?? '')
        : (account?.name ??
          `${form.data.first_name} ${form.data.last_name}`.trim());
    const email = editing
        ? (authUser?.email ?? '')
        : (account?.email ?? form.data.email);
    const firstSession = draft.pricing.firstSession;
    const certificationsDone = draft.certifications.filter(isFilled);

    const canContinue: Record<number, boolean> = {
        1: account
            ? form.data.terms
            : form.data.first_name.trim() !== '' &&
              form.data.last_name.trim() !== '' &&
              form.data.email.trim() !== '' &&
              form.data.phone.trim() !== '' &&
              meetsPasswordRequirements(form.data.password) &&
              form.data.terms,
        // Step 2: everything is required (photo, headline, bio, experience).
        2: isProfileComplete(draft),
        3: placesChecks(draft).every((check) => check.done),
        // Step 4: a price for each duration, and every optional part complete.
        // "A prezzo ridotto" is at least 1 €: 0 is "Gratuita".
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

    const goTo = (next: number) => {
        setStep(next);
        setSaved(false);
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

    let nextLabel = 'Continua';

    if (step === LAST_STEP) {
        nextLabel = 'Invia per approvazione';
    } else if (step === 6 && certificationsDone.length === 0) {
        nextLabel = 'Salta e continua';
    }

    // "Annulla" on the first step goes back to where the user came from.
    let cancelHref = home.url();

    if (editing) {
        cancelHref = today.url();
    } else if (account) {
        cancelHref = clientHome.url();
    }

    return (
        <>
            <Head title="Diventa trainer" />

            <OnboardingShell
                step={step}
                reached={reached}
                firstStep={firstStep}
                onSelect={goTo}
                user={fullName ? { name: fullName, email } : null}
            >
                {/* A real form: Enter goes to the next step and password managers work. */}
                <form
                    noValidate
                    className="flex flex-col gap-6"
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
                    <StepHeader
                        step={step}
                        title={
                            titles[step] ??
                            (account
                                ? 'Diventa trainer'
                                : 'Crea il tuo account trainer')
                        }
                        pill={
                            step === LAST_STEP ? (
                                <HeaderPill
                                    dark
                                    icon={
                                        <Check
                                            aria-hidden="true"
                                            strokeWidth={3}
                                        />
                                    }
                                >
                                    {LAST_STEP - firstStep} passi completati
                                </HeaderPill>
                            ) : (
                                <HeaderPill icon={<Clock aria-hidden="true" />}>
                                    Circa 10 minuti
                                </HeaderPill>
                            )
                        }
                    />

                    {changeRequest && step === firstStep && (
                        <ChangeRequestNotice {...changeRequest} />
                    )}
                    {restored && step === firstStep && (
                        <div
                            role="status"
                            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card px-4 py-3 text-sm"
                        >
                            <span>
                                Abbiamo ripreso la bozza salvata. Foto e
                                attestati vanno ricaricati.
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-9 px-2 underline"
                                onClick={startOver}
                            >
                                Ricomincia da capo
                            </Button>
                        </div>
                    )}
                    <StepErrors errors={stepErrors} />

                    {step === 1 && (
                        <StepAccount
                            account={account}
                            fields={{
                                errors: form.errors,
                                bind,
                                onAccountExists: (field, value) =>
                                    setExisting({ field, value }),
                            }}
                            termsAccepted={form.data.terms}
                            onTermsChange={(accepted) =>
                                form.setData('terms', accepted)
                            }
                            termsError={form.errors.terms}
                        />
                    )}
                    {step === 2 && (
                        <StepProfile
                            draft={draft}
                            update={update}
                            name={fullName}
                            photo={photo}
                            disciplines={disciplines}
                            cities={cities}
                        />
                    )}
                    {step === 3 && (
                        <StepPlaces
                            draft={draft}
                            update={update}
                            name={fullName}
                            photo={photo}
                            disciplines={disciplines}
                            cities={cities}
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
                            photo={photo}
                            editing={editing}
                            disciplines={disciplines}
                            cities={cities}
                            confirmed={confirmed}
                            onConfirmedChange={setConfirmed}
                        />
                    )}

                    <StepBar>
                        {step === firstStep ? (
                            <Button
                                asChild
                                variant="outline"
                                className="h-11 rounded-xl border-input px-4 font-semibold"
                            >
                                <Link href={cancelHref}>Annulla</Link>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-xl border-input px-4 font-semibold"
                                onClick={() => goTo(step - 1)}
                            >
                                <ArrowLeft
                                    aria-hidden="true"
                                    strokeWidth={2.5}
                                />
                                Indietro
                            </Button>
                        )}
                        <div className="ml-auto flex flex-wrap items-center justify-end gap-1 md:gap-2">
                            {/* Not on step 1: the account isn't saved in the draft. */}
                            {step > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-11 rounded-xl px-2.5 font-semibold md:px-3.5"
                                    onClick={saveLater}
                                >
                                    {saved && (
                                        <Check
                                            aria-hidden="true"
                                            strokeWidth={2.5}
                                        />
                                    )}
                                    {saved ? (
                                        'Bozza salvata'
                                    ) : (
                                        <>
                                            <span className="md:hidden">
                                                Salva
                                            </span>
                                            <span className="hidden md:inline">
                                                Salva e continua dopo
                                            </span>
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                className="h-11 rounded-xl px-5 font-semibold"
                                disabled={!canContinue[step] || form.processing}
                            >
                                {form.processing && <Spinner />}
                                {nextLabel}
                                <ArrowRight
                                    aria-hidden="true"
                                    strokeWidth={2.5}
                                />
                            </Button>
                        </div>
                    </StepBar>
                </form>

                {/* Outside the <form>: its "Accedi" must not go to the next step. */}
                <ExistingAccountDialog
                    account={existing}
                    onClose={() => setExisting(null)}
                />
            </OnboardingShell>
        </>
    );
}
