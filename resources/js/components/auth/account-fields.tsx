import { useState } from 'react';
import type { ChangeEvent } from 'react';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import PasswordRequirements, {
    PASSWORD_PATTERN,
    PASSWORD_PATTERN_MESSAGE,
} from '@/components/auth/password-requirements';
import UsernameField, {
    usernameFromName,
} from '@/components/auth/username-field';
import { Input } from '@/components/ui/input';
import { useAccountCheck } from '@/hooks/use-account-check';
import type { CheckedField } from '@/hooks/use-account-check';
import { cn } from '@/lib/utils';

export type AccountField =
    | 'first_name'
    | 'last_name'
    | 'username'
    | 'email'
    | 'phone'
    | 'password';

type Bind = (field: AccountField) => {
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type AccountFieldsProps = {
    errors: Partial<Record<AccountField, string>>;
    /** Optional help under the email, e.g. for trainers. */
    emailHint?: string;
    /** Optional help under the phone, e.g. who sees it. */
    phoneHint?: string;
    /**
     * Pass it to control the inputs (trainer wizard keeps values across steps).
     * Leave it out inside an Inertia <Form>, which reads the inputs by name.
     */
    bind?: Bind;
    /**
     * Sign-ups pass it: email and phone are checked while typed, and this
     * runs when they already belong to an account (to open the login pop-up).
     */
    onAccountExists?: (field: CheckedField, value: string) => void;
    /** Trainers and gyms: "miopersonal.it/trainer/", their public link under the username. */
    usernameLinkPrefix?: string | null;
    /** Added to every input: the dark sign-up page (lib/dark-form.ts). */
    inputClassName?: string;
    /**
     * The clients' dark sign-up (design "RegistraFrase" / "DkRegistraPieno"):
     * name and surname always side by side with an example, then email,
     * password and phone.
     */
    compact?: boolean;
};

const inputClass = 'h-11 text-base md:text-base';

/** The domain must have a dot: "nome@esempio" is refused, as on the server. */
const EMAIL_PATTERN = '[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}';
const EMAIL_MESSAGE = 'Inserisci un’email valida, es. nome@esempio.it.';

/** Name, surname, username, email, phone and password (all required): the account part of the sign-ups. */
export default function AccountFields({
    errors,
    emailHint,
    phoneHint,
    bind,
    onAccountExists,
    usernameLinkPrefix,
    inputClassName,
    compact = false,
}: AccountFieldsProps) {
    const fieldClass = cn(inputClass, inputClassName);
    // Inside a <Form> the names are not in React state: the username example needs them.
    const [typedNames, setTypedNames] = useState({ first: '', last: '' });
    const firstName = bind?.('first_name').value ?? typedNames.first;
    const lastName = bind?.('last_name').value ?? typedNames.last;
    // Inside a <Form> the password is not in React state: the criteria list
    // needs it, so it is copied here as you type.
    const [typedPassword, setTypedPassword] = useState('');
    const passwordBinding = bind?.('password');
    const password = passwordBinding?.value ?? typedPassword;
    const emailBinding = bind?.('email');
    const emailCheck = useAccountCheck(
        'email',
        onAccountExists && ((value) => onAccountExists('email', value)),
    );
    // The answer of the check is newer than the error of the last submit.
    const emailError = emailCheck.error ?? errors.email;

    const phoneFields = (
        <PhoneFields
            errors={errors}
            hint={phoneHint}
            bind={bind}
            inputClassName={inputClassName}
            compact={compact}
            onAccountExists={
                onAccountExists && ((value) => onAccountExists('phone', value))
            }
        />
    );

    const passwordField = (
        <FormField
            label="Password"
            hint={<PasswordRequirements value={password} />}
            error={errors.password}
        >
            {({ id, describedBy }) => (
                <PasswordField
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={!!errors.password}
                    name="password"
                    required
                    pattern={PASSWORD_PATTERN}
                    data-pattern-message={PASSWORD_PATTERN_MESSAGE}
                    autoComplete="new-password"
                    placeholder={compact ? 'Almeno 8 caratteri' : undefined}
                    className={inputClassName}
                    {...passwordBinding}
                    onChange={(event) => {
                        setTypedPassword(event.target.value);
                        passwordBinding?.onChange(event);
                    }}
                />
            )}
        </FormField>
    );

    return (
        <>
            <div
                className={cn(
                    'grid gap-4',
                    compact ? 'grid-cols-2 gap-x-4.5' : 'sm:grid-cols-2',
                )}
            >
                <FormField label="Nome" error={errors.first_name}>
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={!!errors.first_name}
                            name="first_name"
                            required
                            maxLength={100}
                            autoComplete="given-name"
                            placeholder={compact ? 'Giulia' : undefined}
                            className={fieldClass}
                            {...bind?.('first_name')}
                            onChange={(event) => {
                                bind?.('first_name').onChange(event);
                                setTypedNames((names) => ({
                                    ...names,
                                    first: event.target.value,
                                }));
                            }}
                        />
                    )}
                </FormField>
                <FormField label="Cognome" error={errors.last_name}>
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={!!errors.last_name}
                            name="last_name"
                            required
                            maxLength={100}
                            autoComplete="family-name"
                            placeholder={compact ? 'Rossi' : undefined}
                            className={fieldClass}
                            {...bind?.('last_name')}
                            onChange={(event) => {
                                bind?.('last_name').onChange(event);
                                setTypedNames((names) => ({
                                    ...names,
                                    last: event.target.value,
                                }));
                            }}
                        />
                    )}
                </FormField>
            </div>

            <UsernameField
                error={errors.username}
                linkPrefix={usernameLinkPrefix}
                suggestion={usernameFromName(firstName, lastName)}
                bind={bind?.('username')}
                inputClassName={inputClassName}
            />

            <FormField label="Email" hint={emailHint} error={emailError}>
                {({ id, describedBy }) => (
                    <Input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={!!emailError}
                        type="email"
                        name="email"
                        required
                        maxLength={255}
                        pattern={EMAIL_PATTERN}
                        data-pattern-message={EMAIL_MESSAGE}
                        autoComplete="email"
                        placeholder="nome@esempio.it"
                        className={fieldClass}
                        {...emailBinding}
                        onChange={(event) => {
                            emailBinding?.onChange(event);
                            emailCheck.onChange(event.target);
                        }}
                        onBlur={(event) => emailCheck.onBlur(event.target)}
                    />
                )}
            </FormField>

            {compact ? (
                <>
                    {passwordField}
                    {phoneFields}
                </>
            ) : (
                <>
                    {phoneFields}
                    {passwordField}
                </>
            )}
        </>
    );
}

/** Italian mobiles: always +39 and 10 digits, as on the server. */
const PHONE_PREFIX = '+39';
const PHONE_DIGITS = 10;

/**
 * Only the digits, at most 10. A leading +39 or 0039 is dropped first, e.g.
 * when the browser autofills or someone pastes the full number.
 */
export function cleanPhone(value: string): string {
    return value
        .trim()
        .replace(/^(\+|00)39/, '')
        .replace(/\D/g, '')
        .slice(0, PHONE_DIGITS);
}

/**
 * "Prefisso" (+39, can't be changed) and "Telefono" in two boxes: the server
 * adds +39 and saves e.g. +393330000000. Required: the trainer calls the
 * client after confirming a booking.
 */
export function PhoneFields({
    errors,
    hint,
    bind,
    defaultPhone,
    onAccountExists,
    inputClassName,
    compact = false,
}: {
    errors: Partial<Record<'phone', string>>;
    hint?: string;
    bind?: Bind;
    /** Starting number inside a <Form>, e.g. the saved one in the settings. */
    defaultPhone?: string;
    /** Sign-ups only: the number is checked while typed (see AccountFields). */
    onAccountExists?: (value: string) => void;
    inputClassName?: string;
    /** The dark sign-up: "+39" as an example, not greyed out; spaced example number. */
    compact?: boolean;
}) {
    const fieldClass = cn(inputClass, inputClassName);
    const phoneBinding = bind?.('phone');
    const phoneCheck = useAccountCheck('phone', onAccountExists);
    const phoneError = phoneCheck.error ?? errors.phone;

    return (
        <div className={cn('flex items-start', compact ? 'gap-4.5' : 'gap-2')}>
            <div className={cn('shrink-0', compact ? 'w-22 md:w-33' : 'w-24')}>
                <FormField label="Prefisso">
                    {({ id }) => (
                        // Disabled: it can't be changed and it isn't sent.
                        <Input
                            id={id}
                            value={PHONE_PREFIX}
                            disabled
                            className={cn(
                                fieldClass,
                                compact &&
                                    'text-muted-foreground disabled:cursor-default disabled:opacity-100',
                            )}
                        />
                    )}
                </FormField>
            </div>
            <div className="min-w-0 flex-1">
                <FormField label="Telefono" hint={hint} error={phoneError}>
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={!!phoneError}
                            type="tel"
                            name="phone"
                            required
                            defaultValue={
                                bind
                                    ? undefined
                                    : cleanPhone(defaultPhone ?? '')
                            }
                            // Mobiles start with 3; the server also refuses fake ones (3333333333).
                            pattern={`3[0-9]{${PHONE_DIGITS - 1}}`}
                            data-pattern-message="Inserisci un cellulare di 10 cifre, es. 3475218846."
                            inputMode="numeric"
                            autoComplete="tel-national"
                            placeholder={
                                compact ? '347 123 4567' : '3475218846'
                            }
                            className={fieldClass}
                            {...phoneBinding}
                            onChange={(event) => {
                                // Letters, spaces and an 11th digit never show up.
                                event.target.value = cleanPhone(
                                    event.target.value,
                                );
                                phoneBinding?.onChange(event);
                                phoneCheck.onChange(event.target);
                            }}
                            onBlur={(event) => phoneCheck.onBlur(event.target)}
                        />
                    )}
                </FormField>
            </div>
        </div>
    );
}
