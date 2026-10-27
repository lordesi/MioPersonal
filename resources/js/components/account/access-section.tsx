import { Form, router } from '@inertiajs/react';
import { Check, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import AccountSettingsController from '@/actions/App/Http/Controllers/AccountSettingsController';
import GoogleAuthController from '@/actions/App/Http/Controllers/Auth/GoogleAuthController';
import SettingsSection from '@/components/account/settings-section';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import {
    missingPasswordRequirements,
    PASSWORD_PATTERN,
    PASSWORD_PATTERN_MESSAGE,
    PASSWORD_REQUIREMENTS_COUNT,
} from '@/components/auth/password-requirements';
import { Button } from '@/components/ui/button';
import { formatDayMonthYear } from '@/lib/format';
import { cn } from '@/lib/utils';
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
    const google = providers.find((provider) => provider.name === 'Google');

    return (
        <SettingsSection
            id="accesso"
            title="Accesso e sicurezza"
            icon={LockKeyhole}
        >
            <div className="flex flex-col">
                {/* The settings open only with a verified email. */}
                <div className="flex flex-wrap items-center gap-3 border-t py-3.5">
                    <span className="flex min-w-55 flex-1 flex-col gap-0.5">
                        <span className="text-[13px] leading-4.5 font-semibold text-muted-foreground">
                            Email
                        </span>
                        <span className="text-[15px] leading-5.5 font-semibold break-all">
                            {email}
                        </span>
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-xs font-semibold">
                        <Check
                            aria-hidden="true"
                            strokeWidth={3}
                            className="size-3"
                        />
                        Verificata
                    </span>
                </div>
                <PasswordForm
                    hasPassword={hasPassword}
                    changedAt={passwordChangedAt}
                />
                {google && (google.available || google.connected) && (
                    <GoogleRow
                        connected={google.connected}
                        available={google.available}
                        hasPassword={hasPassword}
                    />
                )}
            </div>
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
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');

    const missing = missingPasswordRequirements(password);
    const met = PASSWORD_REQUIREMENTS_COUNT - missing.length;
    const valid = missing.length === 0 && (!hasPassword || current !== '');
    const strength =
        password === ''
            ? 'Almeno 8 caratteri, con una maiuscola, una minuscola e un numero.'
            : missing.length > 0
              ? `Manca: ${missing.map((label) => label.toLowerCase()).join(', ')}.`
              : 'Ottima.';

    const close = () => {
        setOpen(false);
        setCurrent('');
        setPassword('');
    };

    return (
        <div className="flex flex-col gap-3.5 border-t py-3.5">
            <div className="flex flex-wrap items-center gap-3">
                <span className="flex min-w-55 flex-1 flex-col gap-0.5">
                    <span className="text-[13px] leading-4.5 font-semibold text-muted-foreground">
                        Password
                    </span>
                    {hasPassword ? (
                        <span className="text-[15px] leading-5.5 font-semibold tracking-[0.1em]">
                            ••••••••••
                        </span>
                    ) : (
                        <span className="text-[15px] leading-5.5 font-semibold">
                            Non ancora impostata
                        </span>
                    )}
                    {saved ? (
                        <span
                            role="status"
                            className="text-[13px] leading-4.5 text-muted-foreground"
                        >
                            Aggiornata adesso
                        </span>
                    ) : (
                        changedAt && (
                            <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                Cambiata l’ultima volta il{' '}
                                {formatDayMonthYear(changedAt)}
                            </span>
                        )
                    )}
                </span>
                {!open && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 font-semibold"
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
                        close();
                        setSaved(true);
                    }}
                    className="flex flex-col gap-3 rounded-2xl border bg-muted/50 p-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
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
                                                onChange={(event) =>
                                                    setCurrent(
                                                        event.target.value,
                                                    )
                                                }
                                                className="bg-background"
                                            />
                                        )}
                                    </FormField>
                                )}
                                <FormField
                                    label="Nuova password"
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
                                            className="bg-background"
                                        />
                                    )}
                                </FormField>
                            </div>
                            {/* One segment for each criterion met. */}
                            <div
                                aria-hidden="true"
                                className="grid grid-cols-4 gap-1"
                            >
                                {Array.from(
                                    { length: PASSWORD_REQUIREMENTS_COUNT },
                                    (_, index) => (
                                        <span
                                            key={index}
                                            className={cn(
                                                'h-1 rounded-full',
                                                index < met
                                                    ? 'bg-foreground'
                                                    : 'bg-border',
                                            )}
                                        />
                                    ),
                                )}
                            </div>
                            <span
                                role="status"
                                className="text-[13px] leading-4.5 text-muted-foreground"
                            >
                                {strength}
                            </span>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10"
                                    onClick={close}
                                >
                                    Annulla
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!valid || processing}
                                    className="h-10 font-semibold"
                                >
                                    Aggiorna password
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            )}
        </div>
    );
}

/**
 * "Collega" goes to Google and comes back here; "Scollega" needs a password,
 * otherwise there would be no way left to log in.
 */
function GoogleRow({
    connected,
    available,
    hasPassword,
}: {
    connected: boolean;
    available: boolean;
    hasPassword: boolean;
}) {
    const [processing, setProcessing] = useState(false);

    const unlink = () =>
        router.delete(GoogleAuthController.unlink.url(), {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });

    return (
        <div className="flex flex-col gap-2.5 border-t pt-3.5">
            <span className="text-[13px] leading-4.5 font-semibold text-muted-foreground">
                Accesso con altri account
            </span>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-3.5">
                <span
                    aria-hidden="true"
                    className="flex size-10 flex-none items-center justify-center rounded-xl bg-muted text-base font-bold"
                >
                    G
                </span>
                <span className="flex min-w-40 flex-1 flex-col">
                    <span className="text-[15px] leading-5.5 font-semibold">
                        Google
                    </span>
                    <span className="text-[13px] leading-4.5 text-muted-foreground">
                        {connected
                            ? hasPassword
                                ? 'Collegato'
                                : 'Collegato · imposta una password per poterlo scollegare'
                            : 'Non collegato'}
                    </span>
                </span>
                {connected ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 font-semibold"
                        disabled={!hasPassword || processing}
                        onClick={unlink}
                    >
                        Scollega
                    </Button>
                ) : (
                    available && (
                        // A normal link, not Inertia: the page goes to Google.
                        <Button asChild className="h-10 font-semibold">
                            <a href={GoogleAuthController.link.url()}>
                                Collega
                            </a>
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}
