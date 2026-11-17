import { Form, Head, Link } from '@inertiajs/react';
import { PhoneFields } from '@/components/auth/account-fields';
import AuthPhotoShell, {
    AuthIntro,
    authButtonClassName,
    authLinkClassName,
} from '@/components/auth/auth-photo-shell';
import ConsentCheckbox from '@/components/auth/consent-checkbox';
import FormField from '@/components/auth/form-field';
import UsernameField from '@/components/auth/username-field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { darkCheckboxClassName, darkFieldClassName } from '@/lib/dark-form';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { store } from '@/routes/google/register';
import { privacy, terms } from '@/routes/legal';

type Props = {
    /** From Google: it can't be changed here. */
    email: string;
    firstName: string;
    lastName: string;
    /** A free username from the name: the user can change it before "Crea account". */
    suggestedUsername: string;
};

const TERMS_HREF = terms.url();
const PRIVACY_HREF = privacy.url();

/**
 * "Registrati con Google", last step: Google gave name and email, the user
 * accepts the Terms (as in the normal sign-up) and adds the phone (required).
 * See App\Http\Controllers\Auth\GoogleAuthController.
 */
export default function GoogleSignUp({
    email,
    firstName,
    lastName,
    suggestedUsername,
}: Props) {
    const toLogin = (
        <>
            Hai già un account?
            <Link href={login()} className={authLinkClassName}>
                Accedi
            </Link>
        </>
    );

    return (
        <>
            <Head title="Completa la registrazione" />

            <AuthPhotoShell
                titleId="google-sign-up-title"
                title="Ci sei quasi."
                desktopTitle={
                    <>
                        Ci sei <strong>quasi</strong>.
                    </>
                }
                aside={toLogin}
            >
                <Form
                    {...store.form()}
                    disableWhileProcessing
                    aria-labelledby="google-sign-up-title"
                    className="flex flex-col gap-3 md:gap-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            <AuthIntro>
                                Controlla i tuoi dati e accetta i Termini per
                                creare l’account.
                            </AuthIntro>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    label="Nome"
                                    error={errors.first_name}
                                >
                                    {({ id, describedBy }) => (
                                        <Input
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={!!errors.first_name}
                                            name="first_name"
                                            defaultValue={firstName}
                                            required
                                            maxLength={100}
                                            autoComplete="given-name"
                                            className={darkFieldClassName}
                                        />
                                    )}
                                </FormField>
                                <FormField
                                    label="Cognome"
                                    error={errors.last_name}
                                >
                                    {({ id, describedBy }) => (
                                        <Input
                                            id={id}
                                            aria-describedby={describedBy}
                                            aria-invalid={!!errors.last_name}
                                            name="last_name"
                                            defaultValue={lastName}
                                            required
                                            maxLength={100}
                                            autoComplete="family-name"
                                            className={darkFieldClassName}
                                        />
                                    )}
                                </FormField>
                            </div>

                            <UsernameField
                                dark
                                error={errors.username}
                                defaultValue={suggestedUsername}
                                inputClassName={darkFieldClassName}
                            />

                            <FormField label="Email">
                                {({ id }) => (
                                    <Input
                                        id={id}
                                        type="email"
                                        value={email}
                                        readOnly
                                        className={cn(
                                            darkFieldClassName,
                                            'text-muted-foreground',
                                        )}
                                    />
                                )}
                            </FormField>

                            <PhoneFields
                                compact
                                errors={errors}
                                inputClassName={darkFieldClassName}
                            />

                            <div className="pt-1 text-[15px] leading-5.25 [&_label]:text-[15px]">
                                <ConsentCheckbox
                                    name="terms"
                                    required
                                    error={errors.terms}
                                    checkboxClassName={darkCheckboxClassName}
                                >
                                    Ho almeno 18 anni e accetto i{' '}
                                    <a
                                        href={TERMS_HREF}
                                        className="text-brand underline"
                                    >
                                        Termini
                                    </a>{' '}
                                    e l'
                                    <a
                                        href={PRIVACY_HREF}
                                        className="text-brand underline"
                                    >
                                        Informativa privacy
                                    </a>
                                    .
                                </ConsentCheckbox>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className={authButtonClassName}
                            >
                                {processing && <Spinner />}
                                Crea account
                            </button>

                            <p className="flex items-center justify-center gap-1.5 text-[15px] md:hidden">
                                {toLogin}
                            </p>
                        </>
                    )}
                </Form>
            </AuthPhotoShell>
        </>
    );
}
