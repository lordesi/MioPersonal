import { Form, Link } from '@inertiajs/react';
import { useState } from 'react';
import AccountSettingsController from '@/actions/App/Http/Controllers/AccountSettingsController';
import SettingsSection from '@/components/account/settings-section';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import PasswordRequirements, {
    PASSWORD_PATTERN,
    PASSWORD_PATTERN_MESSAGE,
} from '@/components/auth/password-requirements';
import { Button } from '@/components/ui/button';
import { formatDayMonthYear } from '@/lib/format';
import { show as contactPage } from '@/routes/contact';
import type { AccountSettings } from '@/types';

type AccessSectionProps = Pick<
    AccountSettings,
    'email' | 'hasPassword' | 'passwordChangedAt' | 'providers'
>;

/** Email (read only), password and sign-in with Google. */
export default function AccessSection({
    email,
    hasPassword,
    passwordChangedAt,
    providers,
}: AccessSectionProps) {
    return (
        <SettingsSection
            id="accesso"
            title="Accesso e sicurezza"
            description="Email, password e modi per entrare nel tuo account."
        >
            <div className="flex flex-col">
                <span className="text-[15px] font-semibold">Email</span>
                <span className="text-sm break-all">{email}</span>
                <span className="text-[13px] text-muted-foreground">
                    Non si può cambiare da qui: se ti serve,{' '}
                    <Link href={contactPage()} className="underline">
                        scrivici
                    </Link>
                    .
                </span>
            </div>
            <PasswordForm
                hasPassword={hasPassword}
                changedAt={passwordChangedAt}
            />
            <Providers providers={providers} />
        </SettingsSection>
    );
}

/**
 * The current password is always asked. Who signed up with Google has none:
 * they set the first one without it.
 */
function PasswordForm({
    hasPassword,
    changedAt,
}: {
    hasPassword: boolean;
    changedAt: string | null;
}) {
    const [open, setOpen] = useState(false);
    const [saved, setSaved] = useState(false);
    const [password, setPassword] = useState('');

    return (
        <div className="flex flex-col gap-2.5 border-t pt-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex flex-col">
                    <span className="text-[15px] font-semibold">Password</span>
                    {changedAt && (
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                            Cambiata l’ultima volta il{' '}
                            {formatDayMonthYear(changedAt)}
                        </span>
                    )}
                </span>
                {!open && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={() => {
                            setOpen(true);
                            setSaved(false);
                        }}
                    >
                        {hasPassword
                            ? 'Cambia password'
                            : 'Imposta una password'}
                    </Button>
                )}
            </div>

            {open && (
                <Form
                    {...AccountSettingsController.updatePassword.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    onSuccess={() => {
                        setOpen(false);
                        setSaved(true);
                        setPassword('');
                    }}
                    className="flex flex-col gap-3.5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-3.5 sm:grid-cols-2">
                                {hasPassword && (
                                    <FormField
                                        label="Password attuale"
                                        error={errors.current_password}
                                    >
                                        {({ id, describedBy }) => (
                                            <PasswordField
                                                id={id}
                                                name="current_password"
                                                required
                                                autoComplete="current-password"
                                                aria-describedby={describedBy}
                                                aria-invalid={
                                                    !!errors.current_password
                                                }
                                            />
                                        )}
                                    </FormField>
                                )}
                                <FormField
                                    label="Nuova password"
                                    hint={
                                        <PasswordRequirements
                                            value={password}
                                        />
                                    }
                                    error={errors.password}
                                >
                                    {({ id, describedBy }) => (
                                        <PasswordField
                                            id={id}
                                            name="password"
                                            required
                                            pattern={PASSWORD_PATTERN}
                                            data-pattern-message={
                                                PASSWORD_PATTERN_MESSAGE
                                            }
                                            autoComplete="new-password"
                                            aria-describedby={describedBy}
                                            aria-invalid={!!errors.password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                        />
                                    )}
                                </FormField>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-10 font-semibold"
                                >
                                    Aggiorna password
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10"
                                    onClick={() => setOpen(false)}
                                >
                                    Annulla
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            )}

            {saved && (
                <span role="status" className="text-sm">
                    ✓ Password aggiornata.
                </span>
            )}
        </div>
    );
}

/** TODO: connect and disconnect Google for real from here. */
function Providers({ providers }: Pick<AccountSettings, 'providers'>) {
    const [connected, setConnected] = useState(
        () =>
            new Set(
                providers
                    .filter((provider) => provider.connected)
                    .map((provider) => provider.name),
            ),
    );

    const toggle = (name: string) =>
        setConnected((current) => {
            const next = new Set(current);

            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }

            return next;
        });

    return (
        <div className="flex flex-col gap-2.5 border-t pt-3.5">
            <span className="text-[15px] font-semibold">
                Accesso con altri account
            </span>
            {providers.map(({ name }) => {
                const isConnected = connected.has(name);

                return (
                    <div
                        key={name}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                    >
                        <span className="flex flex-1 flex-col">
                            <span className="text-sm font-semibold">
                                {name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {isConnected
                                    ? `Collegato · puoi entrare con ${name}`
                                    : 'Non collegato'}
                            </span>
                        </span>
                        <Button
                            type="button"
                            variant={isConnected ? 'outline' : 'default'}
                            className="h-8.5 px-3 text-[13px]"
                            onClick={() => toggle(name)}
                        >
                            {isConnected ? 'Scollega' : 'Collega'}
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}
