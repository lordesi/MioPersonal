import { useState } from 'react';
import type { ChangeEvent } from 'react';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import PasswordRequirements, {
    PASSWORD_PATTERN,
    PASSWORD_PATTERN_MESSAGE,
} from '@/components/auth/password-requirements';
import { Input } from '@/components/ui/input';

export type AccountField =
    | 'first_name'
    | 'last_name'
    | 'email'
    | 'phone_prefix'
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
};

const inputClass = 'h-11 text-base md:text-base';

/** The domain must have a dot: "nome@esempio" is refused, as on the server. */
const EMAIL_PATTERN = '[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}';
const EMAIL_MESSAGE = 'Inserisci un’email valida, es. nome@esempio.it.';

/** Name, surname, email, phone and password (all required): the account part of both sign-ups. */
export default function AccountFields({
    errors,
    emailHint,
    phoneHint,
    bind,
}: AccountFieldsProps) {
    // Inside a <Form> the password is not in React state: the criteria list
    // needs it, so it is copied here as you type.
    const [typedPassword, setTypedPassword] = useState('');
    const passwordBinding = bind?.('password');
    const password = passwordBinding?.value ?? typedPassword;

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2">
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
                            className={inputClass}
                            {...bind?.('first_name')}
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
                            className={inputClass}
                            {...bind?.('last_name')}
                        />
                    )}
                </FormField>
            </div>

            <FormField label="Email" hint={emailHint} error={errors.email}>
                {({ id, describedBy }) => (
                    <Input
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={!!errors.email}
                        type="email"
                        name="email"
                        required
                        maxLength={255}
                        pattern={EMAIL_PATTERN}
                        data-pattern-message={EMAIL_MESSAGE}
                        autoComplete="email"
                        placeholder="nome@esempio.it"
                        className={inputClass}
                        {...bind?.('email')}
                    />
                )}
            </FormField>

            <PhoneFields errors={errors} hint={phoneHint} bind={bind} />

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
                        {...passwordBinding}
                        onChange={(event) => {
                            setTypedPassword(event.target.value);
                            passwordBinding?.onChange(event);
                        }}
                    />
                )}
            </FormField>
        </>
    );
}

/**
 * "Prefisso" (+39, can be changed) and "Telefono" in two boxes: the server
 * saves them together, e.g. +393330000000. Required: the trainer calls the
 * client after confirming a booking.
 */
export function PhoneFields({
    errors,
    hint,
    bind,
}: {
    errors: Partial<Record<'phone_prefix' | 'phone', string>>;
    hint?: string;
    bind?: Bind;
}) {
    return (
        <div className="flex items-start gap-2">
            <div className="w-24 shrink-0">
                <FormField label="Prefisso" error={errors.phone_prefix}>
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={!!errors.phone_prefix}
                            type="tel"
                            name="phone_prefix"
                            required
                            defaultValue={bind ? undefined : '+39'}
                            pattern="\+[0-9]{1,4}"
                            data-pattern-message="Prefisso non valido, es. +39."
                            maxLength={5}
                            autoComplete="tel-country-code"
                            className={inputClass}
                            {...bind?.('phone_prefix')}
                        />
                    )}
                </FormField>
            </div>
            <div className="min-w-0 flex-1">
                <FormField label="Telefono" hint={hint} error={errors.phone}>
                    {({ id, describedBy }) => (
                        <Input
                            id={id}
                            aria-describedby={describedBy}
                            aria-invalid={!!errors.phone}
                            type="tel"
                            name="phone"
                            required
                            pattern="[0-9]( ?[0-9]){5,11}"
                            data-pattern-message="Solo cifre (da 6 a 12), es. 333 000 0000."
                            inputMode="numeric"
                            autoComplete="tel-national"
                            placeholder="333 000 0000"
                            className={inputClass}
                            {...bind?.('phone')}
                        />
                    )}
                </FormField>
            </div>
        </div>
    );
}
