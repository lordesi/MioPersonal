import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import AccountFields from '@/components/auth/account-fields';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import ExistingAccountDialog from '@/components/auth/existing-account-dialog';
import type { ExistingAccount } from '@/components/auth/existing-account-dialog';
import SocialSignIn from '@/components/auth/social-sign-in';
import { DarkLogo } from '@/components/mp/dark-header';
import { BuildingIcon, DumbbellIcon } from '@/components/mp/icons';
import { Spinner } from '@/components/ui/spinner';
import { darkCheckboxClassName, darkFieldClassName } from '@/lib/dark-form';
import { useFeatures, withFeatures } from '@/lib/features';
import type { FeatureName } from '@/lib/features';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';
import { register as gymRegister } from '@/routes/gym';
import { privacy, terms } from '@/routes/legal';
import { store } from '@/routes/register';
import { register as trainerRegister } from '@/routes/trainer';

const TERMS_HREF = terms.url();
const PRIVACY_HREF = privacy.url();

type AccountType = 'cliente' | 'trainer' | 'palestra';

type IconComponent = ComponentType<{ className?: string }>;

const accountTypes: {
    value: AccountType;
    label: string;
    icon: IconComponent;
    /** Hidden while that part of the site is off (lib/features.ts). */
    feature?: FeatureName;
}[] = [
    { value: 'cliente', label: 'Sono un cliente', icon: Search },
    {
        value: 'trainer',
        label: 'Sono un personal trainer',
        icon: DumbbellIcon,
    },
    {
        value: 'palestra',
        label: 'Ho una palestra',
        icon: BuildingIcon,
        feature: 'gyms',
    },
];

const brandLink =
    'flex min-h-11 items-center text-[15px] font-semibold text-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * Sign-up of the dark design, in two steps. 1: "Come vuoi usare
 * MioPersonal?" (designs "TipoScelta" / "DkTipoSchede"): trainers and gyms go
 * to their own sign-up. 2, clients only: the account (designs
 * "RegistraFrase" / "DkRegistraPieno"), at ?tipo=cliente so "back" returns
 * to the choice.
 */
export default function Register({
    googleEnabled,
}: {
    googleEnabled: boolean;
}) {
    const page = usePage();
    const query = new URLSearchParams(page.url.split('?')[1] ?? '');
    // After a failed sign-up the errors belong to the form: stay on it.
    const hasErrors = Object.keys(page.props.errors ?? {}).length > 0;
    const step = query.get('tipo') === 'cliente' || hasErrors ? 2 : 1;

    return (
        <>
            <Head title="Crea il tuo account" />
            {step === 1 ? (
                <ChooseType />
            ) : (
                <ClientAccount googleEnabled={googleEnabled} />
            )}
        </>
    );
}

/** Logo on the left, "Hai già un account? Accedi" on the right. */
function Header({ className }: { className?: string }) {
    return (
        <header className={className}>
            <nav
                aria-label="Principale"
                className="mx-auto mt-2 flex h-13 max-w-300 items-center justify-between gap-6 px-4 md:mt-0 md:h-auto md:px-8 md:pt-6"
            >
                <DarkLogo />
                <p className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
                    <span className="hidden md:inline">
                        Hai già un account?
                    </span>
                    <Link href={login()} className={brandLink}>
                        Accedi
                    </Link>
                </p>
            </nav>
        </header>
    );
}

function ChooseType() {
    const [type, setType] = useState<AccountType>('cliente');
    const types = withFeatures(accountTypes, useFeatures());

    const next = () => {
        if (type === 'cliente') {
            router.get(register.url({ query: { tipo: 'cliente' } }));
        } else {
            router.visit(
                type === 'trainer' ? trainerRegister() : gymRegister(),
            );
        }
    };

    return (
        <div className="theme-dark flex min-h-dvh flex-col">
            <Header />
            <main className="flex flex-1 flex-col px-4 pb-6 md:items-center md:justify-center md:px-8 md:pb-16">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        next();
                    }}
                    className={cn(
                        'flex flex-1 flex-col md:flex-none md:items-center md:gap-10',
                        types.length > 2 ? 'md:w-240' : 'md:w-160',
                    )}
                >
                    <fieldset className="contents">
                        <legend className="mt-8 mb-6 text-[28px] leading-8.5 font-bold tracking-[-0.36px] md:mt-0 md:mb-10 md:text-center md:text-5xl md:leading-[1.1] md:font-light md:tracking-[-0.03em]">
                            Come vuoi usare{' '}
                            <span className="md:font-bold">MioPersonal</span>?
                        </legend>
                        <div
                            className={cn(
                                'flex flex-col gap-3 md:grid md:w-full md:gap-5',
                                types.length > 2
                                    ? 'md:grid-cols-3'
                                    : 'md:grid-cols-2',
                            )}
                        >
                            {types.map((option) => (
                                <TypeOption
                                    key={option.value}
                                    {...option}
                                    checked={type === option.value}
                                    onChange={() => setType(option.value)}
                                />
                            ))}
                        </div>
                    </fieldset>
                    <button
                        type="submit"
                        className="btn-brand mt-auto h-12.5 w-full text-[17px] md:mt-0 md:w-90"
                    >
                        Continua
                    </button>
                </form>
            </main>
        </div>
    );
}

/** A big radio: a row on phones, a tall card on desktop. */
function TypeOption({
    value,
    label,
    icon: Icon,
    checked,
    onChange,
}: {
    value: AccountType;
    label: string;
    icon: IconComponent;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label
            className={cn(
                'group relative flex min-h-19 cursor-pointer items-center gap-3.5 rounded-[20px] px-4 shadow-[inset_0_0_0_1px_var(--border)] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 md:min-h-50 md:flex-col md:items-start md:justify-between md:p-6',
                checked && 'shadow-[inset_0_0_0_2px_var(--brand)]',
            )}
        >
            <input
                type="radio"
                name="tipo"
                value={value}
                checked={checked}
                onChange={onChange}
                className="sr-only"
            />
            <span className="contents md:flex md:w-full md:items-center md:justify-between">
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-[14px]',
                        checked
                            ? 'bg-brand-soft text-brand md:bg-transparent md:shadow-[inset_0_0_0_1px_var(--brand)]'
                            : 'bg-secondary text-foreground',
                    )}
                >
                    <Icon className="size-6" />
                </span>
                <span
                    aria-hidden="true"
                    className={cn(
                        'order-last size-5.5 shrink-0 rounded-full md:order-none',
                        checked
                            ? 'border-[7px] border-brand'
                            : 'border-2 border-field',
                    )}
                />
            </span>
            <span className="flex-1 text-[17px] font-semibold md:flex-none md:text-xl md:leading-6.5">
                {label}
            </span>
        </label>
    );
}

function ClientAccount({ googleEnabled }: { googleEnabled: boolean }) {
    // An email or phone that already has an account: "Hai già un account?".
    const [existing, setExisting] = useState<ExistingAccount | null>(null);
    const features = useFeatures();

    return (
        <div className="theme-dark relative isolate flex min-h-dvh flex-col overflow-hidden">
            <img
                src="/images/design/register-desktop.webp"
                alt=""
                className="absolute inset-0 -z-10 hidden size-full object-cover object-[30%_50%] md:block"
            />
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 hidden bg-[linear-gradient(270deg,#0a0a0a_0%,rgba(10,10,10,0.92)_36%,rgba(10,10,10,0.15)_64%,rgba(10,10,10,0)_100%),linear-gradient(180deg,rgba(10,10,10,0.5)_0%,rgba(10,10,10,0)_16%)] md:block"
            />

            <Header className="md:absolute md:inset-x-0 md:top-0 md:z-10" />

            <main className="px-4 pt-5 pb-8 md:mx-auto md:flex md:min-h-dvh md:w-full md:max-w-300 md:items-center md:justify-end md:px-8 md:py-28">
                <div className="flex flex-col gap-3.5 md:w-110">
                    <h1
                        id="register-title"
                        className="mb-1 text-[28px] leading-8.5 font-bold tracking-[-0.36px] md:mb-2 md:text-4xl md:leading-[1.1] md:font-light md:tracking-[-0.03em] md:text-balance"
                    >
                        <span className="md:hidden">Crea il tuo account</span>
                        <span className="hidden md:inline">
                            Inizia ad allenarti con il trainer giusto.
                        </span>
                    </h1>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        disableWhileProcessing
                        aria-labelledby="register-title"
                        className="flex flex-col gap-4 md:gap-3.5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <AccountFields
                                    errors={errors}
                                    inputClassName={darkFieldClassName}
                                    compact
                                    onAccountExists={(field, value) =>
                                        setExisting({ field, value })
                                    }
                                />

                                <ConsentCheckbox
                                    name="terms"
                                    required
                                    checkboxClassName={darkCheckboxClassName}
                                    error={errors.terms}
                                >
                                    <span className="text-[15px] leading-5">
                                        Ho 18 anni o più e accetto{' '}
                                        <a
                                            href={TERMS_HREF}
                                            className="text-brand underline"
                                        >
                                            Termini
                                        </a>{' '}
                                        e{' '}
                                        <a
                                            href={PRIVACY_HREF}
                                            className="text-brand underline"
                                        >
                                            Privacy
                                        </a>
                                    </span>
                                </ConsentCheckbox>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="btn-brand h-12.5 text-[17px]"
                                >
                                    {processing && <Spinner />}
                                    Crea account
                                </button>
                            </>
                        )}
                    </Form>

                    {googleEnabled && (
                        <GoogleBelow>
                            <SocialSignIn
                                verb="Continua con"
                                googleEnabled
                                className="h-12.5 rounded-full text-[17px]"
                                dividerLabel="oppure"
                            />
                        </GoogleBelow>
                    )}

                    <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-[15px] text-muted-foreground">
                        {features.gyms
                            ? 'Sei un trainer o hai una palestra?'
                            : 'Sei un personal trainer?'}
                        <Link href={register()} className={brandLink}>
                            Cambia tipo di account
                        </Link>
                    </p>
                </div>

                {/* Outside the <Form>: its "Accedi" must not send the sign-up. */}
                <ExistingAccountDialog
                    account={existing}
                    onClose={() => setExisting(null)}
                    googleEnabled={googleEnabled}
                />
            </main>
        </div>
    );
}

/**
 * SocialSignIn puts the line under the button; here it goes above
 * ("oppure", then Google), as in the design.
 */
function GoogleBelow({ children }: { children: ReactNode }) {
    return <div className="flex flex-col-reverse gap-3.5">{children}</div>;
}
