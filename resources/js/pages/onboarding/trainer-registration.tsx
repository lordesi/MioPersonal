import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { meetsPasswordRequirements } from '@/components/auth/password-requirements';
import type { AccountField } from '@/components/auth/account-fields';
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
import StepCertifications, {
    wrongYear,
} from '@/components/onboarding/trainer/step-certifications';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import StepHours from '@/components/onboarding/trainer/step-hours';
import StepPlaces, {
    placesChecks,
    studiosComplete,
} from '@/components/onboarding/trainer/step-places';
import StepProfile, {
    profileChecks,
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
import { store } from '@/routes/trainer/register';
import type { CatalogOption, CityOption } from '@/types';

const LAST_STEP = 7;

/** The h1 of each step, as in the design (step 1 depends on the account). */
const titles: Record<number, string> = {
    2: 'Il tuo profilo pubblico',
    3: 'Discipline, obiettivi, luoghi e città',
    4: 'Servizi e prezzi',
    5: 'Orari e regole',
    6: 'Formazione e certificazioni',
    7: 'Controlla e invia',
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
    // "Salva e continua dopo": the message after saving, and the one after reopening.
    const [saveResult, setSaveResult] = useState<'saved' | 'failed' | null>(
        null,
    );
    const [restored, setRestored] = useState(false);
    // The step reached in the saved draft. Step 1 (account and terms) is never
    // saved, so the later steps open again only after it: see goTo.
    const [restoredStep, setRestoredStep] = useState(0);

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
        setSaveResult(
            saveDraft(userId, draft, Math.max(step, reached))
                ? 'saved'
                : 'failed',
        );

    const startOver = () => {
        clearDraft(userId);
        setDraft(startingDraft);
        setReached(savedDraft ? LAST_STEP : firstStep);
        setStep(firstStep);
        setRestored(false);
        setRestoredStep(0);
        setSaveResult(null);
    };

    // A change after "Salva e continua dopo" is not in the saved draft any more.
    const update = (changes: Partial<TrainerDraft>) => {
        setDraft({ ...draft, ...changes });
        setSaveResult(null);
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
        setSaveResult(null);
        // Past the first step, the steps of a restored draft open again.
        setReached(
            Math.max(reached, next, next > firstStep ? restoredStep : 0),
        );
        window.scrollTo({ top: 0 });
    };

    const submit = () => {
        // A client already has name, email and password: only the terms are
        // sent. A trainer fixing the profile sends only the profile.
        form.transform((data) => ({
            ...(editing ? {} : account ? { terms: data.terms } : data),
            ...toPayload(draft),
        }));
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

    let hint = stepHint(step, canContinue[step], draft, {
        account: account !== null,
        photo: photo !== null,
        confirmed,
    });

    if (saveResult === 'saved') {
        hint = 'Bozza salvata su questo dispositivo';
    } else if (saveResult === 'failed') {
        hint = 'Non siamo riusciti a salvare la bozza in questo browser';
    }

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
                            goTo(step + 1);
                        }
                    }}
                >
                    <StepHeader
                        step={step}
                        title={
                            titles[step] ??
                            (account
                                ? 'Diventa trainer con il tuo account'
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
                            fields={{ errors: form.errors, bind }}
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
                            onEdit={goTo}
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
                            {/* On phones only for screen readers: the bar stays on one line. */}
                            <span
                                role="status"
                                className="sr-only text-[13px] leading-4.5 text-muted-foreground md:not-sr-only md:mr-1"
                            >
                                {hint}
                            </span>
                            {/* Not on step 1: the account isn't saved in the draft. */}
                            {step > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-11 rounded-xl px-2.5 font-semibold md:px-3.5"
                                    onClick={saveLater}
                                >
                                    {saveResult === 'saved' && (
                                        <Check
                                            aria-hidden="true"
                                            strokeWidth={2.5}
                                        />
                                    )}
                                    {saveResult === 'saved' ? (
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
            </OnboardingShell>
        </>
    );
}

/**
 * The message next to "Continua": "Tutto pronto" or what is still missing
 * in the step, as in the design.
 */
function stepHint(
    step: number,
    ready: boolean,
    draft: TrainerDraft,
    state: { account: boolean; photo: boolean; confirmed: boolean },
): string {
    switch (step) {
        case 1:
            if (ready) {
                return 'Tutto pronto';
            }

            return state.account
                ? 'Accetta i termini per continuare'
                : 'Completa i tuoi dati e accetta i termini';
        case 2: {
            const missing = profileChecks(draft, state.photo)
                .filter((check) => !check.done)
                .map((check) => check.short);

            return missing.length > 0
                ? `Manca: ${missing.join(', ')}`
                : 'Tutto pronto';
        }
        case 3: {
            const missing = placesChecks(draft)
                .filter((check) => !check.done)
                .map((check) => check.short);

            if (missing.length === 0) {
                return 'Tutto pronto';
            }

            return studiosComplete(draft) || missing.length > 1
                ? `Scegli almeno ${missing.filter((item) => !item.startsWith('nome')).join(', ')}`
                : 'Completa nome e indirizzo degli studi';
        }
        case 4: {
            const { sessions, firstSession } = draft.pricing;
            const anyPrice = sessions.some((session) =>
                session.prices.some((price) => price.priceCents !== null),
            );

            if (ready) {
                return 'Tutto pronto';
            }

            if (!anyPrice) {
                return 'Inserisci almeno un prezzo nel listino';
            }

            if (firstSession.enabled && firstSession.priceCents === null) {
                return 'Inserisci il prezzo della prima seduta';
            }

            return 'Completa i nomi e i prezzi dei servizi';
        }
        case 5:
            return ready
                ? 'Tutto pronto'
                : 'Apri almeno un’ora nella settimana';
        case 6: {
            if (draft.certifications.some(wrongYear)) {
                return 'Controlla l’anno delle certificazioni';
            }

            if (!ready) {
                return 'Completa titolo, ente e anno o elimina la certificazione';
            }

            return draft.certifications.some(isFilled)
                ? 'Tutto pronto'
                : 'Questo passo è facoltativo';
        }
        default:
            return state.confirmed
                ? 'Pronto per l’invio'
                : 'Conferma le informazioni per inviare';
    }
}
