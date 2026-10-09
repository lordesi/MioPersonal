import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import AccountFields from '@/components/auth/account-fields';
import type { AccountField } from '@/components/auth/account-fields';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import MinimalHeader from '@/components/layout/minimal-header';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import { initialDraft } from '@/components/onboarding/trainer/draft';
import StepCertifications from '@/components/onboarding/trainer/step-certifications';
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

const TERMS_HREF = terms.url();
const PRIVACY_HREF = privacy.url();

const LAST_STEP = 7;

type TrainerRegistrationProps = {
    /** True right after the account was created. */
    submitted: boolean;
    /** A logged-in client: they keep their account, step 1 only asks for the terms. */
    account: { name: string; email: string } | null;
};

export default function TrainerRegistration({
    submitted,
    account,
}: TrainerRegistrationProps) {
    // Step 1 is the only part sent to the server today.
    const form = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        terms: false,
    });
    const [step, setStep] = useState(1);
    const [reached, setReached] = useState(1);
    const [draft, setDraft] = useState<TrainerDraft>(initialDraft);
    const [confirmed, setConfirmed] = useState(false);

    const update = (changes: Partial<TrainerDraft>) =>
        setDraft({ ...draft, ...changes });

    const fullName =
        account?.name ??
        `${form.data.first_name} ${form.data.last_name}`.trim();

    const canContinue: Record<number, boolean> = {
        1: account
            ? form.data.terms
            : form.data.first_name.trim() !== '' &&
              form.data.last_name.trim() !== '' &&
              form.data.email.trim() !== '' &&
              form.data.password.length >= 8 &&
              form.data.terms,
        3: draft.disciplines.length > 0 && draft.places.length > 0,
        4: draft.services.some(
            (service) =>
                service.name.trim() !== '' && (service.priceCents ?? 0) > 0,
        ),
        7: confirmed,
    };

    const goTo = (next: number) => {
        setStep(next);
        setReached(Math.max(reached, next));
        window.scrollTo({ top: 0 });
    };

    const submit = () => {
        // A client already has name, email and password: only the terms are sent.
        form.transform((data) => (account ? { terms: data.terms } : data));
        form.post(store.url(), {
            // Account errors (e.g. email already used) are shown in step 1.
            onError: () => goTo(1),
        });
    };

    const bind = (field: AccountField) => ({
        value: form.data[field],
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            form.setData(field, event.target.value),
    });

    return (
        <div className="flex min-h-screen flex-col bg-secondary">
            <Head title="Diventa trainer" />

            <MinimalHeader badge="Per i trainer">
                {!submitted && !account && (
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
                        <Submitted />
                    </div>
                ) : (
                    <>
                        <StepNav
                            step={step}
                            reached={reached}
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
                                    {step === 1 && (
                                        <>
                                            <StepTitle
                                                title={
                                                    account
                                                        ? 'Diventa trainer con il tuo account'
                                                        : 'Crea il tuo account trainer'
                                                }
                                                description="Servono circa 10 minuti. Puoi salvare e finire più tardi."
                                            />
                                            {account ? (
                                                <CurrentAccount {...account} />
                                            ) : (
                                                <AccountFields
                                                    errors={form.errors}
                                                    emailHint="Qui ricevi le richieste dei clienti. Ti mandiamo un link per verificarla."
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
                                            onEdit={goTo}
                                            confirmed={confirmed}
                                            onConfirmedChange={setConfirmed}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t p-4 md:px-8">
                                    {step > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11"
                                            onClick={() => goTo(step - 1)}
                                        >
                                            Indietro
                                        </Button>
                                    )}
                                    {/* TODO: save the draft and send a link to finish later. */}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-11 text-muted-foreground"
                                    >
                                        Salva e continua dopo
                                    </Button>
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
