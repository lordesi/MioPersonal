import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import AccountFields from '@/components/auth/account-fields';
import { meetsPasswordRequirements } from '@/components/auth/password-requirements';
import type { AccountField } from '@/components/auth/account-fields';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import MinimalHeader from '@/components/layout/minimal-header';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import {
    initialDraft,
    isPricingComplete,
    isProfileComplete,
    isCertificationValid,
    needsCity,
    stepOfField,
    toPayload,
} from '@/components/onboarding/trainer/draft';
import {
    clearDraft,
    loadDraft,
    saveDraft,
} from '@/components/onboarding/trainer/saved-draft';
import ChangeRequestNotice from '@/components/onboarding/trainer/change-request-notice';
import StepCertifications from '@/components/onboarding/trainer/step-certifications';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import StepHours from '@/components/onboarding/trainer/step-hours';
import StepNav from '@/components/onboarding/trainer/step-nav';
import StepPlaces from '@/components/onboarding/trainer/step-places';
import StepProfile from '@/components/onboarding/trainer/step-profile';
import StepReview from '@/components/onboarding/trainer/step-review';
import StepServices from '@/components/onboarding/trainer/step-services';
import StepTitle from '@/components/onboarding/trainer/step-title';
import Submitted from '@/components/onboarding/trainer/submitted';
import UserAvatar from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { privacy, terms } from '@/routes/legal';
import { store } from '@/routes/trainer/register';
import type { CatalogOption, CityOption } from '@/types';

const TERMS_HREF = terms.url();
const PRIVACY_HREF = privacy.url();

const LAST_STEP = 7;

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
    const authName = authUser?.name ?? '';
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

    const update = (changes: Partial<TrainerDraft>) =>
        setDraft({ ...draft, ...changes });

    const fullName = editing
        ? authName
        : (account?.name ??
          `${form.data.first_name} ${form.data.last_name}`.trim());

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
        3:
            draft.disciplines.length > 0 &&
            draft.places.length > 0 &&
            (!needsCity(draft) || draft.city !== ''),
        // Step 4: a price for each duration, and every optional part complete.
        4: isPricingComplete(draft),
        5: true,
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

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Diventa trainer" />

            <MinimalHeader badge="Per i trainer">
                {!submitted && !account && !editing && (
                    <>
                        <span className="hidden sm:inline">
                            Hai già un account?
                        </span>
                        <Link
                            href={login()}
                            className="font-medium text-foreground underline"
                        >
                            Accedi
                        </Link>
                    </>
                )}
            </MinimalHeader>

            <div className="mx-auto flex w-full max-w-300 flex-1 flex-wrap items-start gap-5 px-4 pt-5 pb-10 md:gap-8 md:px-8 md:pt-10 md:pb-20">
                {submitted ? (
                    <div className="w-full">
                        <Submitted previewHref={previewHref} />
                    </div>
                ) : (
                    <>
                        <StepNav
                            step={step}
                            reached={reached}
                            firstStep={firstStep}
                            onSelect={goTo}
                        />

                        <main className="min-w-0 flex-[999_1_560px] rounded-xl border bg-card">
                            {/* A real form: Enter goes to the next step and password managers work. */}
                            <form
                                noValidate
                                className="flex flex-col"
                                onSubmit={(event) => {
                                    event.preventDefault();

                                    if (canContinue[step] === false) {
                                        return;
                                    }

                                    if (step === LAST_STEP) {
                                        submit();
                                    } else {
                                        goTo(step + 1);
                                    }
                                }}
                            >
                                <div className="flex flex-col gap-5 p-4 md:p-8">
                                    {changeRequest && step === firstStep && (
                                        <ChangeRequestNotice
                                            {...changeRequest}
                                        />
                                    )}
                                    {restored && step === firstStep && (
                                        <div
                                            role="status"
                                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3.5 py-3 text-sm"
                                        >
                                            <span>
                                                Abbiamo ripreso la bozza
                                                salvata. Foto e attestati vanno
                                                ricaricati.
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
                                        <>
                                            <StepTitle
                                                title={
                                                    account
                                                        ? 'Diventa trainer con il tuo account'
                                                        : 'Crea il tuo account trainer'
                                                }
                                                description="Servono circa 10 minuti. Dal passo 2 puoi salvare e finire più tardi."
                                            />
                                            {account ? (
                                                <CurrentAccount {...account} />
                                            ) : (
                                                <AccountFields
                                                    errors={form.errors}
                                                    emailHint="Qui ricevi le richieste dei clienti. Ti mandiamo un link per verificarla."
                                                    phoneHint="I clienti lo vedono solo dopo che hai confermato la prenotazione."
                                                    bind={bind}
                                                />
                                            )}
                                            <ConsentCheckbox
                                                name="terms"
                                                error={form.errors.terms}
                                                checked={form.data.terms}
                                                onCheckedChange={(checked) =>
                                                    form.setData(
                                                        'terms',
                                                        checked,
                                                    )
                                                }
                                            >
                                                Accetto i{' '}
                                                <a
                                                    href={TERMS_HREF}
                                                    className="underline"
                                                >
                                                    Termini per i trainer
                                                </a>{' '}
                                                e l'
                                                <a
                                                    href={PRIVACY_HREF}
                                                    className="underline"
                                                >
                                                    Informativa privacy
                                                </a>
                                                .
                                            </ConsentCheckbox>
                                        </>
                                    )}
                                    {step === 2 && (
                                        <StepProfile
                                            draft={draft}
                                            update={update}
                                        />
                                    )}
                                    {step === 3 && (
                                        <StepPlaces
                                            draft={draft}
                                            update={update}
                                            disciplines={disciplines}
                                            cities={cities}
                                        />
                                    )}
                                    {step === 4 && (
                                        <StepServices
                                            draft={draft}
                                            update={update}
                                        />
                                    )}
                                    {step === 5 && (
                                        <StepHours
                                            draft={draft}
                                            update={update}
                                        />
                                    )}
                                    {step === 6 && (
                                        <StepCertifications
                                            draft={draft}
                                            update={update}
                                        />
                                    )}
                                    {step === 7 && (
                                        <StepReview
                                            draft={draft}
                                            fullName={fullName}
                                            editing={editing}
                                            disciplines={disciplines}
                                            cities={cities}
                                            onEdit={goTo}
                                            confirmed={confirmed}
                                            onConfirmedChange={setConfirmed}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t p-4 md:px-8">
                                    {step > firstStep && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11"
                                            onClick={() => goTo(step - 1)}
                                        >
                                            Indietro
                                        </Button>
                                    )}
                                    {/* Not on step 1: the account doesn't exist yet. */}
                                    {step > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="h-11 text-muted-foreground"
                                            onClick={saveLater}
                                        >
                                            Salva e continua dopo
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        className="ml-auto h-11"
                                        disabled={
                                            canContinue[step] === false ||
                                            form.processing
                                        }
                                    >
                                        {form.processing && <Spinner />}
                                        {step === LAST_STEP
                                            ? 'Invia per approvazione'
                                            : 'Continua'}
                                        <ArrowRight aria-hidden="true" />
                                    </Button>
                                    {saveResult && (
                                        <p
                                            role="status"
                                            className="w-full text-sm text-muted-foreground"
                                        >
                                            {saveResult === 'saved'
                                                ? 'Bozza salvata su questo dispositivo. Riapri «Diventa trainer» per continuare.'
                                                : 'Non siamo riusciti a salvare la bozza in questo browser.'}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </main>
                    </>
                )}
            </div>
        </div>
    );
}

/** Step 1 for a logged-in client: the account that becomes a trainer one. */
function CurrentAccount({ name, email }: { name: string; email: string }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 rounded-lg border p-3.5">
                <UserAvatar name={name} size="md" />
                <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="truncate text-sm text-muted-foreground">
                        {email}
                    </span>
                </span>
            </div>
            <p className="text-sm text-muted-foreground">
                Userai questo account anche da trainer, con la stessa email e
                password. Da trainer avrai la tua area: le pagine cliente
                (prenotazioni e preferiti) non saranno più disponibili.
            </p>
        </div>
    );
}
