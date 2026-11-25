import { useId } from 'react';
import type { ChangeEvent } from 'react';
import type { AccountField } from '@/components/auth/account-fields';
import {
    EMAIL_MESSAGE,
    EMAIL_PATTERN,
    PhoneFields,
} from '@/components/auth/account-fields';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import PasswordRequirements, {
    PASSWORD_PATTERN,
    PASSWORD_PATTERN_MESSAGE,
} from '@/components/auth/password-requirements';
import UsernameField, {
    usernameFromName,
} from '@/components/auth/username-field';
import {
    DarkError,
    fieldLabelClassName,
    pillFieldClassName,
    Section,
} from '@/components/onboarding/dark-fields';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAccountCheck } from '@/hooks/use-account-check';
import type { CheckedField } from '@/hooks/use-account-check';
import { darkCheckboxClassName } from '@/lib/dark-form';
import { privacy, terms } from '@/routes/legal';

type Bind = (field: AccountField) => {
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type StepAccountProps = {
    errors: Partial<Record<AccountField | 'terms', string>>;
    bind: Bind;
    acceptedTerms: boolean;
    onTermsChange: (accepted: boolean) => void;
    onAccountExists: (field: CheckedField, value: string) => void;
    usernameLinkPrefix: string;
    /** The words of the sign-up: gym or trainer. */
    copy?: AccountStepCopy;
};

export type AccountStepCopy = {
    /** "Il referente" (gym), "Chi sei" (trainer). */
    whoTitle: string;
    whoDescription?: string;
    /** "Il link della palestra"; without it the username is under "Chi sei". */
    linkTitle?: string;
    linkDescription?: string;
    /** The words of the terms: "Termini" and "Informativa" are the links. */
    terms: { before: string; terms: string; middle: string; privacy: string };
    /** "Diventa trainer": the username is asked later, in "Presentazione". */
    usernameLater?: boolean;
};

/** The words of "Registra la palestra". */
export const gymAccountCopy: AccountStepCopy = {
    whoTitle: 'Il referente',
    whoDescription: 'Chi gestisce il profilo della palestra.',
    linkTitle: 'Il link della palestra',
    linkDescription: 'L’indirizzo che condividi con i clienti.',
    terms: {
        before: 'Accetto i ',
        terms: 'Termini',
        middle: ' e l’',
        privacy: 'Informativa privacy',
    },
};

/**
 * Step 1, "Account", of the dark sign-ups (gym, trainer): who you are, the
 * link, the contacts, the password and the terms. The same fields and checks
 * of the other sign-ups (AccountFields), split in the sections of the design.
 */
export default function StepAccount({
    errors,
    bind,
    acceptedTerms,
    onTermsChange,
    onAccountExists,
    usernameLinkPrefix,
    copy = gymAccountCopy,
}: StepAccountProps) {
    const email = bind('email');
    const password = bind('password');
    const emailCheck = useAccountCheck('email', (value) =>
        onAccountExists('email', value),
    );
    // The answer of the check is newer than the error of the last submit.
    const emailError = emailCheck.error ?? errors.email;

    const username = copy.usernameLater ? null : (
        <UsernameField
            dark
            error={errors.username}
            linkPrefix={usernameLinkPrefix}
            suggestion={usernameFromName(
                bind('first_name').value,
                bind('last_name').value,
            )}
            bind={bind('username')}
            inputClassName={pillFieldClassName}
        />
    );

    const nameField = (field: 'first_name' | 'last_name') => (
        <FormField
            label={field === 'first_name' ? 'Nome' : 'Cognome'}
            error={errors[field]}
            labelClassName={fieldLabelClassName}
        >
            {({ id, describedBy }) => (
                <Input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={!!errors[field]}
                    name={field}
                    required
                    maxLength={100}
                    autoComplete={
                        field === 'first_name' ? 'given-name' : 'family-name'
                    }
                    className={pillFieldClassName}
                    {...bind(field)}
                />
            )}
        </FormField>
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8">
                <Section
                    title={copy.whoTitle}
                    description={copy.whoDescription}
                    hideTitle={copy.usernameLater}
                >
                    <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                        {nameField('first_name')}
                        {nameField('last_name')}
                    </div>
                    {!copy.linkTitle && username}
                </Section>

                {copy.linkTitle && (
                    <Section
                        title={copy.linkTitle}
                        description={copy.linkDescription}
                    >
                        {username}
                    </Section>
                )}

                <Section title="Contatti" hideTitle={copy.usernameLater}>
                    <div className="flex flex-col gap-4">
                        <FormField
                            label="Email"
                            error={emailError}
                            labelClassName={fieldLabelClassName}
                        >
                            {({ id, describedBy }) => (
                                <Input
                                    id={id}
                                    aria-describedby={describedBy}
                                    aria-invalid={!!emailError}
                                    type="email"
                                    name="email"
                                    inputMode="email"
                                    required
                                    maxLength={255}
                                    pattern={EMAIL_PATTERN}
                                    data-pattern-message={EMAIL_MESSAGE}
                                    autoComplete="email"
                                    placeholder="nome@esempio.it"
                                    className={pillFieldClassName}
                                    {...email}
                                    onChange={(event) => {
                                        email.onChange(event);
                                        emailCheck.onChange(event.target);
                                    }}
                                    onBlur={(event) =>
                                        emailCheck.onBlur(event.target)
                                    }
                                />
                            )}
                        </FormField>
                        <PhoneFields
                            compact
                            errors={errors}
                            bind={bind}
                            inputClassName={pillFieldClassName}
                            labelClassName={fieldLabelClassName}
                            onAccountExists={(value) =>
                                onAccountExists('phone', value)
                            }
                        />
                    </div>
                </Section>
            </div>

            <div className="flex flex-col gap-8">
                <Section title="Password" hideTitle={copy.usernameLater}>
                    <div className="flex flex-col gap-3">
                        {copy.usernameLater && (
                            <span className={fieldLabelClassName}>
                                Password
                            </span>
                        )}
                        <PasswordField
                            aria-label="Password"
                            aria-invalid={!!errors.password}
                            name="password"
                            required
                            pattern={PASSWORD_PATTERN}
                            data-pattern-message={PASSWORD_PATTERN_MESSAGE}
                            autoComplete="new-password"
                            className={`${pillFieldClassName} pr-24`}
                            toggleClassName="top-1/2 right-1.5 h-11 -translate-y-1/2 rounded-full px-3.5 text-[15px] font-semibold text-brand hover:bg-brand/12 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                            {...password}
                        />
                        <DarkError message={errors.password} />
                        <PasswordRequirements
                            value={password.value}
                            variant="dark"
                        />
                    </div>
                </Section>

                <TermsCard
                    label={copy.terms}
                    accepted={acceptedTerms}
                    onChange={onTermsChange}
                    error={errors.terms}
                />
            </div>
        </div>
    );
}

/** "Accetto i Termini…": the checkbox and the links to read them. */
export function TermsCard({
    label,
    accepted,
    onChange,
    error,
}: {
    label: AccountStepCopy['terms'];
    accepted: boolean;
    onChange: (accepted: boolean) => void;
    error?: string;
}) {
    const termsId = useId();
    const termsErrorId = `${termsId}-error`;
    const link = 'font-semibold text-brand hover:text-brand-hover';

    return (
        <div className="flex flex-col gap-1">
            <div className="flex min-h-14 items-center gap-3.5 py-2">
                <Checkbox
                    id={termsId}
                    checked={accepted}
                    onCheckedChange={(checked) => onChange(checked === true)}
                    aria-invalid={!!error}
                    aria-describedby={error ? termsErrorId : undefined}
                    className={darkCheckboxClassName}
                />
                <label
                    htmlFor={termsId}
                    className="flex-1 cursor-pointer text-[15px] leading-5.25 font-medium"
                >
                    {label.before}
                    <a
                        href={terms.url()}
                        target="_blank"
                        rel="noopener"
                        className={link}
                    >
                        {label.terms}
                    </a>
                    {label.middle}
                    <a
                        href={privacy.url()}
                        target="_blank"
                        rel="noopener"
                        className={link}
                    >
                        {label.privacy}
                    </a>
                </label>
            </div>
            <DarkError id={termsErrorId} message={error} />
        </div>
    );
}

/**
 * The username of a guest on its own: "Diventa trainer" asks it in
 * "Presentazione" (step 3), with the link the profile will have.
 */
export function AccountUsernameField({
    errors,
    bind,
    usernameLinkPrefix,
}: Pick<StepAccountProps, 'errors' | 'bind' | 'usernameLinkPrefix'>) {
    return (
        <UsernameField
            dark
            error={errors.username}
            linkPrefix={usernameLinkPrefix}
            suggestion={usernameFromName(
                bind('first_name').value,
                bind('last_name').value,
            )}
            bind={bind('username')}
            inputClassName={pillFieldClassName}
        />
    );
}
