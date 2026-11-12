import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Check,
    Clock,
    FileText,
    Lock,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import AccountFields from '@/components/auth/account-fields';
import type { AccountField } from '@/components/auth/account-fields';
import ExistingAccountDialog from '@/components/auth/existing-account-dialog';
import type { ExistingAccount } from '@/components/auth/existing-account-dialog';
import { meetsPasswordRequirements } from '@/components/auth/password-requirements';
import {
    GymContactsFields,
    GymDetailsFields,
    GymPhotosFields,
    GymServicesFields,
} from '@/components/gym/gym-form-fields';
import type { GymDraft } from '@/components/onboarding/gym/draft';
import {
    initialGymDraft,
    isDetailsComplete,
    isServicesComplete,
    stepOfGymField,
    toGymPayload,
} from '@/components/onboarding/gym/draft';
import ChangeRequestNotice from '@/components/onboarding/trainer/change-request-notice';
import OnboardingShell, {
    CheckRow,
    HeaderPill,
    StepBar,
    StepHeader,
} from '@/components/onboarding/trainer/onboarding-shell';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import NumberedSection from '@/components/trainer/area/numbered-section';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { dashboard as areaHome, home, login } from '@/routes';
import { dashboard } from '@/routes/gym';
import { check, store, switchMethod } from '@/routes/gym/register';
import { privacy, terms } from '@/routes/legal';
import type { CatalogOption } from '@/types';

const LAST_STEP = 5;

const gymSteps = [
    { label: 'Account' },
    { label: 'La palestra' },
    { label: 'Servizi e orari' },
    { label: 'Foto' },
    { label: 'Contatti e invio' },
];

const titles: Record<number, string> = {
    1: 'Crea l’account della palestra',
    2: 'La tua palestra',
    3: 'Servizi e orari',
    4: 'Le foto',
    5: 'Contatti e invio',
};

type GymRegistrationProps = {
    submitted: boolean;
    /** A client or trainer is logged in: the gym needs another account. */
    otherAccount: boolean;
    cities: CatalogOption[];
    amenities: CatalogOption[];
    /** A gym fixing the profile: no step 1. */
    editing: boolean;
    draft: Omit<GymDraft, 'cover' | 'gallery'> | null;
    changeRequest: { reasons: string[]; message: string | null } | null;
    previewHref: string | null;
};

/** "Registra la tua palestra": 5 steps, then the team checks the profile. */
export default function GymRegistration({
    submitted,
    otherAccount,
    cities,
    amenities,
    editing,
    draft: savedDraft,
    changeRequest,
    previewHref,
}: GymRegistrationProps) {
    const authUser = usePage().props.auth?.user;
    const firstStep = editing ? 2 : 1;
    const form = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        terms: false,
    });
    const [step, setStep] = useState(firstStep);
    const [reached, setReached] = useState(savedDraft ? LAST_STEP : firstStep);
    const [draft, setDraft] = useState<GymDraft>(
        savedDraft
            ? { ...savedDraft, cover: null, gallery: [] }
            : initialGymDraft,
    );
    const [existing, setExisting] = useState<ExistingAccount | null>(null);

    if (otherAccount) {
        return (
            <>
                <Head title="Registra la tua palestra" />
                <OnboardingShell
                    step={1}
                    reached={1}
                    firstStep={1}
                    onSelect={() => {}}
                    user={null}
                    stepItems={gymSteps}
                    eyebrow="REGISTRA LA PALESTRA"
                >
                    <section className="flex flex-col gap-4 rounded-[28px] bg-sidebar p-6 text-sidebar-foreground md:p-10">
                        <span className="flex size-14 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                            <Building2
                                aria-hidden="true"
                                className="size-6.5"
                            />
                        </span>
                        <h1 className="text-[34px] leading-10 font-bold tracking-[-0.03em]">
                            La palestra ha bisogno di un suo account
                        </h1>
                        <p className="max-w-130 text-base text-sidebar-foreground/85">
                            Sei collegato come {authUser?.name}. Per registrare
                            la palestra serve un account separato, con un’altra
                            email: il tuo account resta com’è e puoi rientrarci
                            quando vuoi.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2.5">
                            <Button
                                asChild
                                className="h-11.5 rounded-xl bg-sidebar-primary px-5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                            >
                                <Link
                                    href={switchMethod()}
                                    as="button"
                                    onClick={() => router.flushAll()}
                                >
                                    Esci e registra la palestra
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="h-11.5 rounded-xl border-sidebar-border bg-transparent px-4.5 font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            >
                                <Link href={areaHome()}>
                                    Torna alla tua area
                                </Link>
                            </Button>
                        </div>
                    </section>
                </OnboardingShell>
            </>
        );
    }

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
                    stepItems={gymSteps}
                    eyebrow="REGISTRA LA PALESTRA"
                >
                    <section className="flex flex-col gap-4 rounded-[28px] bg-sidebar p-6 text-sidebar-foreground md:p-10">
                        <span className="flex size-14 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                            <Check
                                aria-hidden="true"
                                strokeWidth={3}
                                className="size-6.5"
                            />
                        </span>
                        <h1 className="text-[34px] leading-10 font-bold tracking-[-0.03em]">
                            Profilo inviato
                        </h1>
                        <p className="max-w-130 text-base text-sidebar-foreground/85">
                            Il nostro team controlla il profilo della palestra e
                            ti scrive appena è pubblicato. Intanto puoi
                            preparare abbonamenti e promozioni nella tua area.
                            {!authUser?.email_verified_at &&
                                ' Prima conferma la tua email: ti abbiamo mandato un link.'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2.5">
                            <Button
                                asChild
                                className="h-11.5 rounded-xl bg-sidebar-primary px-5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                            >
                                <Link href={dashboard()}>
                                    Vai all’area palestra
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                            {previewHref && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11.5 rounded-xl border-sidebar-border bg-transparent px-4.5 font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                >
                                    <Link href={previewHref}>
                                        Vedi l’anteprima del profilo
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </section>
                </OnboardingShell>
            </>
        );
    }

    const update = (changes: Partial<GymDraft>) =>
        setDraft((current) => ({ ...current, ...changes }));

    const fullName = editing
        ? (authUser?.name ?? '')
        : `${form.data.first_name} ${form.data.last_name}`.trim();
    const email = editing ? (authUser?.email ?? '') : form.data.email;

    const canContinue: Record<number, boolean> = {
        1:
            form.data.first_name.trim() !== '' &&
            form.data.last_name.trim() !== '' &&
            form.data.email.trim() !== '' &&
            form.data.phone.trim() !== '' &&
            meetsPasswordRequirements(form.data.password) &&
            form.data.terms,
        2: isDetailsComplete(draft),
        3: isServicesComplete(draft),
        4: draft.cover !== null || draft.coverUrl !== null,
        5: true,
    };

    const goTo = (next: number) => {
        setStep(next);
        setReached(Math.max(reached, next));
        window.scrollTo({ top: 0 });
    };

    const payload = (data: typeof form.data) => ({
        ...(editing ? {} : data),
        ...toGymPayload(draft, true),
    });

    const checkStep = () => {
        form.transform((data) =>
            Object.fromEntries(
                Object.entries(payload(data)).filter(
                    ([field]) => stepOfGymField(field) === step,
                ),
            ),
        );
        form.post(check.url(step), {
            queryStringArrayFormat: 'indices',
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => goTo(step + 1),
            onError: () => window.scrollTo({ top: 0 }),
        });
    };

    const submit = () => {
        form.transform(payload);
        form.post(store.url(), {
            queryStringArrayFormat: 'indices',
            onError: (errors) =>
                goTo(
                    Math.max(
                        firstStep,
                        Math.min(...Object.keys(errors).map(stepOfGymField)),
                    ),
                ),
        });
    };

    const errors = form.errors as Partial<Record<string, string>>;
    const stepErrors = Object.entries(errors)
        .filter(([field]) => step > 1 && stepOfGymField(field) === step)
        .map(([, message]) => message as string);

    const bind = (field: AccountField) => ({
        value: form.data[field],
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            form.setData(field, event.target.value),
    });

    return (
        <>
            <Head title="Registra la tua palestra" />

            <OnboardingShell
                step={step}
                reached={reached}
                firstStep={firstStep}
                onSelect={goTo}
                user={fullName ? { name: fullName, email } : null}
                stepItems={gymSteps}
                eyebrow="REGISTRA LA PALESTRA"
            >
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
                        title={titles[step]}
                        stepItems={gymSteps}
                        pill={
                            <HeaderPill icon={<Clock aria-hidden="true" />}>
                                Circa 5 minuti
                            </HeaderPill>
                        }
                    />

                    {changeRequest && step === firstStep && (
                        <ChangeRequestNotice {...changeRequest} />
                    )}
                    <StepErrors errors={stepErrors} />

                    <div className="flex max-w-200 flex-col gap-4">
                        {step === 1 && (
                            <>
                                <NumberedSection
                                    step={<UserRound aria-hidden="true" />}
                                    title="Il referente della palestra"
                                    description="Un account solo per la palestra: se sei già cliente o trainer usa un’altra email."
                                >
                                    <AccountFields
                                        errors={form.errors}
                                        bind={bind}
                                        onAccountExists={(field, value) =>
                                            setExisting({ field, value })
                                        }
                                        emailHint="Qui ricevi le richieste dei trainer e le comunicazioni del team."
                                        phoneHint="Solo per il nostro team: non è pubblico."
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Hai già registrato la palestra?{' '}
                                        <Link
                                            href={login()}
                                            className="font-medium text-foreground underline underline-offset-4"
                                        >
                                            Accedi
                                        </Link>
                                    </p>
                                </NumberedSection>
                                <NumberedSection
                                    step={<Lock aria-hidden="true" />}
                                    title="Termini e privacy"
                                >
                                    <p className="flex flex-wrap gap-3 text-sm">
                                        <a
                                            href={terms.url()}
                                            target="_blank"
                                            rel="noopener"
                                            className="inline-flex items-center gap-1.5 underline underline-offset-4"
                                        >
                                            <FileText
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Termini e condizioni
                                        </a>
                                        <a
                                            href={privacy.url()}
                                            target="_blank"
                                            rel="noopener"
                                            className="inline-flex items-center gap-1.5 underline underline-offset-4"
                                        >
                                            <Lock
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Informativa privacy
                                        </a>
                                    </p>
                                    <CheckRow
                                        checked={form.data.terms}
                                        onCheckedChange={(accepted) =>
                                            form.setData('terms', accepted)
                                        }
                                        error={form.errors.terms}
                                    >
                                        <span className="text-[15px] leading-5.5 font-semibold">
                                            Accetto i Termini e l’Informativa
                                            privacy
                                        </span>
                                    </CheckRow>
                                </NumberedSection>
                            </>
                        )}
                        {step === 2 && (
                            <GymDetailsFields
                                draft={draft}
                                update={update}
                                errors={errors}
                                cities={cities}
                            />
                        )}
                        {step === 3 && (
                            <GymServicesFields
                                draft={draft}
                                update={update}
                                errors={errors}
                                amenities={amenities}
                                step={1}
                            />
                        )}
                        {step === 4 && (
                            <GymPhotosFields
                                draft={draft}
                                update={update}
                                errors={errors}
                                withGallery
                                step={1}
                            />
                        )}
                        {step === 5 && (
                            <>
                                <GymContactsFields
                                    draft={draft}
                                    update={update}
                                    errors={errors}
                                />
                                <p className="rounded-2xl border bg-card px-4 py-3.5 text-sm text-muted-foreground">
                                    Con “Invia per approvazione” il nostro team
                                    controlla il profilo. Dopo l’approvazione la
                                    palestra compare nella ricerca e puoi
                                    aggiungere abbonamenti, promozioni e i tuoi
                                    trainer.
                                </p>
                            </>
                        )}
                    </div>

                    <StepBar>
                        {step === firstStep ? (
                            <Button
                                asChild
                                variant="outline"
                                className="h-11 rounded-xl border-input px-4 font-semibold"
                            >
                                <Link
                                    href={
                                        editing ? dashboard.url() : home.url()
                                    }
                                >
                                    Annulla
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-xl border-input px-4 font-semibold"
                                onClick={() => goTo(step - 1)}
                            >
                                <ArrowLeft aria-hidden="true" />
                                Indietro
                            </Button>
                        )}
                        <Button
                            type="submit"
                            className="ml-auto h-11 rounded-xl px-5 font-semibold"
                            disabled={!canContinue[step] || form.processing}
                        >
                            {form.processing && <Spinner />}
                            {step === LAST_STEP
                                ? 'Invia per approvazione'
                                : 'Continua'}
                            <ArrowRight aria-hidden="true" />
                        </Button>
                    </StepBar>
                </form>

                <ExistingAccountDialog
                    account={existing}
                    onClose={() => setExisting(null)}
                />
            </OnboardingShell>
        </>
    );
}
