import { Form } from '@inertiajs/react';
import { useState } from 'react';
import AccountSettingsController from '@/actions/App/Http/Controllers/AccountSettingsController';
import SettingsSection from '@/components/account/settings-section';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AccountSettings } from '@/types';

type AccessSectionProps = Pick<
    AccountSettings,
    'email' | 'providers' | 'devices'
>;

/** Email, password, sign-in with Google/Apple and logged-in devices. */
export default function AccessSection({
    email,
    providers,
    devices,
}: AccessSectionProps) {
    return (
        <SettingsSection
            id="accesso"
            title="Accesso e sicurezza"
            description="Email, password e modi per entrare nel tuo account."
        >
            <EmailForm email={email} />
            <PasswordForm />
            <Providers providers={providers} />
            <Devices devices={devices} />
        </SettingsSection>
    );
}

/** The design has no save button here: "Aggiorna email" is ours. */
function EmailForm({ email }: { email: string }) {
    return (
        <Form
            {...AccountSettingsController.updateEmail.form()}
            options={{ preserveScroll: true }}
            className="grid items-end gap-3 sm:grid-cols-2"
        >
            {({ errors, processing }) => (
                <>
                    <FormField
                        label="Email"
                        hint="Se la cambi ti mandiamo un link di conferma al nuovo indirizzo."
                        error={errors.email}
                    >
                        {({ id, describedBy }) => (
                            <Input
                                id={id}
                                type="email"
                                name="email"
                                defaultValue={email}
                                required
                                autoComplete="email"
                                aria-describedby={describedBy}
                                aria-invalid={!!errors.email}
                                className="h-11 text-base md:text-base"
                            />
                        )}
                    </FormField>
                    {/* Lines the button up with the input, above the hint. */}
                    <div className="sm:pb-5.5">
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={processing}
                            className="h-10"
                        >
                            Aggiorna email
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

function PasswordForm() {
    const [open, setOpen] = useState(false);
    const [saved, setSaved] = useState(false);

    return (
        <div className="flex flex-col gap-2.5 border-t pt-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[15px] font-semibold">Password</span>
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
                        Cambia password
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
                    }}
                    className="flex flex-col gap-3.5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-3.5 sm:grid-cols-2">
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
                                <FormField
                                    label="Nuova password"
                                    hint="Almeno 8 caratteri."
                                    error={errors.password}
                                >
                                    {({ id, describedBy }) => (
                                        <PasswordField
                                            id={id}
                                            name="password"
                                            required
                                            autoComplete="new-password"
                                            aria-describedby={describedBy}
                                            aria-invalid={!!errors.password}
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

/** TODO: connect and disconnect for real once sign-in with Google/Apple exists. */
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

/** TODO: log out the other device on the server. */
function Devices({ devices }: Pick<AccountSettings, 'devices'>) {
    const [loggedOut, setLoggedOut] = useState<number[]>([]);

    return (
        <div className="flex flex-col gap-2.5 border-t pt-3.5">
            <span className="text-[15px] font-semibold">
                Dispositivi collegati
            </span>
            {devices
                .filter((device) => !loggedOut.includes(device.id))
                .map((device) => (
                    <div
                        key={device.id}
                        className="flex items-center gap-3 text-sm"
                    >
                        <span className="flex flex-1 flex-col">
                            <span className="font-semibold">{device.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {device.detail}
                            </span>
                        </span>
                        {device.current ? (
                            <Badge
                                variant="outline"
                                className="h-5.5 rounded-full px-2 text-xs font-semibold"
                            >
                                Questo dispositivo
                            </Badge>
                        ) : (
                            <Button
                                type="button"
                                variant="link"
                                className="h-8 px-2.5 text-[13px] font-normal text-foreground underline"
                                onClick={() =>
                                    setLoggedOut([...loggedOut, device.id])
                                }
                            >
                                Disconnetti
                            </Button>
                        )}
                    </div>
                ))}
        </div>
    );
}
