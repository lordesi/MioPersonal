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
} from '@/components/onboarding/gym/gym-fields';
import { gymLinkClassName } from '@/components/onboarding/gym/gym-shell';
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
};

/**
 * Step 1, "Account": who runs the gym's profile, its link, the contacts of
 * the team, the password and the terms. The same fields and checks of the
 * other sign-ups (AccountFields), split in the sections of the design.
 */
export default function StepAccount({
    errors,
    bind,
    acceptedTerms,
    onTermsChange,
    onAccountExists,
    usernameLinkPrefix,
}: StepAccountProps) {
    const termsId = useId();
    const termsErrorId = `${termsId}-error`;
    const email = bind('email');
    const password = bind('password');
    const emailCheck = useAccountCheck('email', (value) =>
        onAccountExists('email', value),
    );
    // The answer of the check is newer than the error of the last submit.
    const emailError = emailCheck.error ?? errors.email;

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
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-14">
            <div className="flex flex-col gap-10 md:gap-9">
                <Section
                    title="Il referente"
                    description="Chi gestisce il profilo della palestra."
                >
                    <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                        {nameField('first_name')}
                        {nameField('last_name')}
                    </div>
                </Section>

                <Section
                    title="Il link della palestra"
                    description="L’indirizzo che condividi con i clienti."
                >
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
                </Section>

                <Section title="Contatti">
                    <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:items-start md:gap-3">
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

            <div className="flex flex-col gap-10 md:gap-9">
                <Section title="Password">
                    <div className="flex flex-col gap-3">
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

                <section className="flex flex-col gap-1 rounded-[26px] bg-card p-4 md:gap-1.5 md:rounded-[20px] md:bg-transparent md:p-5 md:shadow-[inset_0_0_0_1px_var(--border)]">
                    <label
                        htmlFor={termsId}
                        className="flex min-h-11 cursor-pointer items-center gap-3 text-[17px] leading-5.5 font-semibold"
                    >
                        <Checkbox
                            id={termsId}
                            checked={acceptedTerms}
                            onCheckedChange={(checked) =>
                                onTermsChange(checked === true)
                            }
                            aria-invalid={!!errors.terms}
                            aria-describedby={
                                errors.terms ? termsErrorId : undefined
                            }
                            className={darkCheckboxClassName}
                        />
                        Accetto i Termini e l’Informativa privacy
                    </label>
                    <div className="flex flex-wrap gap-x-5 pl-8.5">
                        <a
                            href={terms.url()}
                            target="_blank"
                            rel="noopener"
                            className={gymLinkClassName}
                        >
                            Leggi i Termini
                        </a>
                        <a
                            href={privacy.url()}
                            target="_blank"
                            rel="noopener"
                            className={gymLinkClassName}
                        >
                            Leggi l’Informativa
                        </a>
                    </div>
                    <DarkError id={termsErrorId} message={errors.terms} />
                </section>
            </div>
        </div>
    );
}
