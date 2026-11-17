import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccountField } from '@/components/auth/account-fields';
import ExistingAccountDialog from '@/components/auth/existing-account-dialog';
import type { ExistingAccount } from '@/components/auth/existing-account-dialog';
import { meetsPasswordRequirements } from '@/components/auth/password-requirements';
import type { GymDraft } from '@/components/onboarding/gym/draft';
import {
    initialGymDraft,
    isDetailsComplete,
    isServicesComplete,
    stepOfGymField,
    toGymPayload,
} from '@/components/onboarding/gym/draft';
import GymShell, {
    GymFooter,
    gymBackClassName,
    gymLinkClassName,
    gymNextClassName,
    gymSendClassName,
} from '@/components/onboarding/gym/gym-shell';
import {
    clearGymDraft,
    loadGymDraft,
    saveGymDraft,
} from '@/components/onboarding/gym/saved-draft';
import StepAccount from '@/components/onboarding/gym/step-account';
import StepDetails from '@/components/onboarding/gym/step-details';
import StepPhotos from '@/components/onboarding/gym/step-photos';
import StepSend from '@/components/onboarding/gym/step-send';
import StepServices, {
    servicesSummary,
} from '@/components/onboarding/gym/step-services';
import ChangeRequestNotice from '@/components/onboarding/trainer/change-request-notice';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import { Spinner } from '@/components/ui/spinner';
import { dashboard as areaHome, home, login } from '@/routes';
import { dashboard } from '@/routes/gym';
import { check, store, switchMethod } from '@/routes/gym/register';
import type { CatalogOption } from '@/types';

const LAST_STEP = 5;

/** The titles of the design: light, with the key words in bold. */
const titles: Record<number, ReactNode> = {
    1: (
        <>
            Porta la tua <strong>palestra</strong> su{' '}
            <strong>MioPersonal</strong>.
        </>
    ),
    2: (
        <>
            La tua <strong>palestra</strong>
        </>
    ),
    3: (
        <>
            <strong>Servizi</strong> e <strong>orari</strong>
        </>
    ),
    4: (
        <>
            Le <strong>foto</strong>
        </>
    ),
    5: (
        <>
            <strong>Contatti</strong> e <strong>invio</strong>
        </>
    ),
};

/** Desktop: why "Continua" is still off. */
const missing: Record<number, string> = {
    1: 'Compila i campi e accetta i termini',
    2: 'Nome, città, via e almeno 60 caratteri di descrizione',
    3: 'Almeno un servizio e orari in ordine',
    4: 'Scegli la foto di copertina',
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
    /** "miopersonal.it/palestra/": the public link, shown under the username. */
    usernameLinkPrefix: string;
};

/**
 * "Registra la tua palestra": 5 steps, then the team checks the profile.
 * "Continua" asks the server to check the fields of the step (nothing is
 * saved); "Invia per approvazione" creates the account and the profile.
 */
export default function GymRegistration({
    submitted,
    otherAccount,
    cities,
    amenities,
    editing,
    draft: savedDraft,
    changeRequest,
    previewHref,
    usernameLinkPrefix,
}: GymRegistrationProps) {
    const authUser = usePage().props.auth?.user;
    const userId = authUser?.id ?? null;
    const firstStep = editing ? 2 : 1;
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
    const [reached, setReached] = useState(savedDraft ? LAST_STEP : firstStep);
    const startingDraft: GymDraft = savedDraft
        ? { ...savedDraft, cover: null, gallery: [] }
        : initialGymDraft;
    const [draft, setDraft] = useState<GymDraft>(startingDraft);
    const [existing, setExisting] = useState<ExistingAccount | null>(null);
    // "Salva ed esci": the draft found in this browser.
    const [restored, setRestored] = useState(false);
    // The step reached in the saved draft. Step 1 (account and terms) is never
    // saved, so the later steps open again only after it: see goTo.
    const [restoredStep, setRestoredStep] = useState(0);

    // Read after the first render: the page is also rendered on the server
    // (SSR), where there is no localStorage.
    useEffect(() => {
        if (submitted || otherAccount) {
            return;
        }

        const local = loadGymDraft(userId);

        if (local) {
            setDraft(local.draft);
            setRestoredStep(Math.min(local.step, LAST_STEP));
            setRestored(true);
        }
    }, [submitted, otherAccount, userId]);

    if (otherAccount) {
        return (
            <>
                <Head title="Registra la tua palestra" />
                <GymShell
                    step={null}
                    title={
                        <>
                            La palestra ha bisogno di un suo{' '}
                            <strong>account</strong>
                        </>
                    }
                >
                    <Outcome icon={<Building2 aria-hidden="true" />}>
                        <p>
                            Sei collegato come {authUser?.name}. Per registrare
                            la palestra serve un account separato, con un’altra
                            email: il tuo account resta com’è e puoi rientrarci
                            quando vuoi.
                        </p>
                        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-6">
                            <Link
                                href={switchMethod()}
                                as="button"
                                onClick={() => router.flushAll()}
                                className={gymNextClassName}
                            >
                                Esci e registra la palestra
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                            </Link>
                            <Link
                                href={areaHome()}
                                className={gymBackClassName}
                            >
                                Torna alla tua area
                            </Link>
                        </div>
                    </Outcome>
                </GymShell>
            </>
        );
    }

    if (submitted) {
        return (
            <>
                <Head title="Profilo inviato" />
                <GymShell
                    step={null}
                    title={
                        <>
                            Profilo <strong>inviato</strong>
                        </>
                    }
                >
                    <Outcome
                        icon={<Check aria-hidden="true" strokeWidth={3} />}
                    >
                        <p>
                            Il nostro team controlla il profilo della palestra e
                            ti scrive appena è pubblicato. Intanto puoi
                            preparare abbonamenti e promozioni nella tua area.
                            {!authUser?.email_verified_at &&
                                ' Prima conferma la tua email: ti abbiamo mandato un link.'}
                        </p>
                        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-6">
                            <Link
                                href={dashboard()}
                                className={gymNextClassName}
                            >
                                Vai all’area palestra
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4.5"
                                />
                            </Link>
                            {previewHref && (
                                <Link
                                    href={previewHref}
                                    className={gymBackClassName}
                                >
                                    Vedi l’anteprima del profilo
                                </Link>
                            )}
                        </div>
                    </Outcome>
                </GymShell>
            </>
        );
    }

    const update = (changes: Partial<GymDraft>) =>
        setDraft((current) => ({ ...current, ...changes }));

    const canContinue: Record<number, boolean> = {
        1:
            form.data.first_name.trim() !== '' &&
            form.data.last_name.trim() !== '' &&
            form.data.username.trim() !== '' &&
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
        // Past the first step, the steps of a restored draft open again.
        setReached(
            Math.max(reached, next, next > firstStep ? restoredStep : 0),
        );
        window.scrollTo({ top: 0 });
    };

    const saveAndExit = () => {
        saveGymDraft(userId, draft, Math.max(step, reached));
        router.visit(editing ? dashboard.url() : home.url());
    };

    const startOver = () => {
        clearGymDraft(userId);
        setDraft(startingDraft);
        setReached(savedDraft ? LAST_STEP : firstStep);
        setStep(firstStep);
        setRestored(false);
        setRestoredStep(0);
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
            onSuccess: () => clearGymDraft(userId),
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

    const guestStart = step === 1;
    const saveLink =
        step > 1 ? (
            <button
                type="button"
                onClick={saveAndExit}
                className={gymLinkClassName}
            >
                Salva ed esci
            </button>
        ) : (
            <p className="hidden items-center gap-2 text-[15px] text-muted-foreground md:flex">
                Hai già registrato la palestra?
                <Link href={login()} className={gymLinkClassName}>
                    Accedi
                </Link>
            </p>
        );

    const back =
        step === firstStep ? (
            <Link
                href={editing ? dashboard.url() : home.url()}
                className={gymBackClassName}
            >
                Annulla
            </Link>
        ) : (
            <button
                type="button"
                onClick={() => goTo(step - 1)}
                className={gymBackClassName}
            >
                Indietro
            </button>
        );

    return (
        <>
            <Head title="Registra la tua palestra" />

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
                <GymShell
                    step={step}
                    reached={reached}
                    firstStep={firstStep}
                    onSelect={goTo}
                    onBack={step > firstStep ? () => goTo(step - 1) : undefined}
                    hero={guestStart}
                    title={titles[step]}
                    intro={
                        step === LAST_STEP ? (
                            <span className="hidden md:inline">
                                Ultimo passo: poi il nostro team controlla il
                                profilo.
                            </span>
                        ) : undefined
                    }
                    topRight={saveLink}
                    footer={
                        <GymFooter
                            back={back}
                            status={
                                !canContinue[step] ? missing[step] : undefined
                            }
                            noteAbove={
                                step === 3 ? servicesSummary(draft) : undefined
                            }
                            noteBelow={
                                guestStart ? (
                                    <>
                                        Hai già registrato la palestra?{' '}
                                        <Link
                                            href={login()}
                                            className="font-semibold text-brand"
                                        >
                                            Accedi
                                        </Link>
                                    </>
                                ) : undefined
                            }
                        >
                            <button
                                type="submit"
                                disabled={!canContinue[step] || form.processing}
                                className={
                                    step === LAST_STEP
                                        ? gymSendClassName
                                        : gymNextClassName
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
                        </GymFooter>
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
                                        {editing
                                            ? 'Le foto nuove vanno ricaricate.'
                                            : 'Ricompila l’account; le foto vanno ricaricate.'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={startOver}
                                        className={gymLinkClassName}
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
                            errors={form.errors}
                            bind={bind}
                            acceptedTerms={form.data.terms}
                            onTermsChange={(accepted) =>
                                form.setData('terms', accepted)
                            }
                            onAccountExists={(field, value) =>
                                setExisting({ field, value })
                            }
                            usernameLinkPrefix={usernameLinkPrefix}
                        />
                    )}
                    {step === 2 && (
                        <StepDetails
                            draft={draft}
                            update={update}
                            errors={errors}
                            cities={cities}
                        />
                    )}
                    {step === 3 && (
                        <StepServices
                            draft={draft}
                            update={update}
                            errors={errors}
                            amenities={amenities}
                        />
                    )}
                    {step === 4 && (
                        <StepPhotos
                            draft={draft}
                            update={update}
                            errors={errors}
                        />
                    )}
                    {step === 5 && (
                        <StepSend
                            draft={draft}
                            update={update}
                            errors={errors}
                            steps={[1, 2, 3, 4].filter(
                                (item) => item >= firstStep,
                            )}
                            complete={(item) => canContinue[item]}
                            onEdit={goTo}
                        />
                    )}
                </GymShell>
            </form>

            <ExistingAccountDialog
                account={existing}
                onClose={() => setExisting(null)}
            />
        </>
    );
}

/** "Profilo inviato", "serve un altro account": an icon, a text and the links. */
function Outcome({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <section className="flex max-w-150 flex-col gap-6 text-[17px] leading-6 text-muted-foreground">
            <span className="flex size-14 items-center justify-center rounded-full border border-brand text-brand [&_svg]:size-6.5">
                {icon}
            </span>
            {children}
        </section>
    );
}
