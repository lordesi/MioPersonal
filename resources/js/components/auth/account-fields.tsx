import type { ChangeEvent } from 'react';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import { Input } from '@/components/ui/input';

export type AccountField = 'first_name' | 'last_name' | 'email' | 'password';

type AccountFieldsProps = {
    errors: Partial<Record<AccountField, string>>;
    /** Different for clients and trainers. */
    emailHint: string;
    /**
     * Pass it to control the inputs (trainer wizard keeps values across steps).
     * Leave it out inside an Inertia <Form>, which reads the inputs by name.
     */
    bind?: (field: AccountField) => {
        value: string;
        onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    };
};

/**
 * Name, surname, email and password: the account part of both sign-ups.
 * TODO: add "Telefono" once the users table has a phone column
 * (needs a migration: ask before creating it).
 */
export default function AccountFields({
    errors,
    emailHint,
    bind,
}: AccountFieldsProps) {
    const inputClass = 'h-11 text-base md:text-base';

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
                        autoComplete="email"
                        placeholder="nome@esempio.it"
                        className={inputClass}
                        {...bind?.('email')}
                    />
                )}
            </FormField>

            <FormField
                label="Password"
                hint="Almeno 8 caratteri."
                error={errors.password}
            >
                {({ id, describedBy }) => (
                    <PasswordField
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={!!errors.password}
                        name="password"
                        required
                        autoComplete="new-password"
                        {...bind?.('password')}
                    />
                )}
            </FormField>
        </>
    );
}
