import { Form, Link } from '@inertiajs/react';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import SocialSignIn from '@/components/auth/social-sign-in';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { CheckedField } from '@/hooks/use-account-check';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

/** The email or phone of the sign-up that already belongs to an account. */
export type ExistingAccount = { field: CheckedField; value: string };

type ExistingAccountDialogProps = {
    /** Null: the pop-up is closed. */
    account: ExistingAccount | null;
    onClose: () => void;
    /** "Continua con Google", for who signed up with Google (no password). */
    googleEnabled?: boolean;
};

const inputClass = 'h-11 text-base md:text-base';

/**
 * "Hai già un account?": opened by the sign-ups when the email or the phone
 * is already used, with the login form inside (the same login of the
 * "Accedi" page). For a phone the email stays empty: we never show the
 * email of someone else's account.
 *
 * Render it outside the sign-up <form>: in React, the submit of a form inside
 * a pop-up reaches the form around it too.
 */
export default function ExistingAccountDialog({
    account,
    onClose,
    googleEnabled = false,
}: ExistingAccountDialogProps) {
    // Lowercase, as the sign-up saves it: the login compares it as it is.
    const email =
        account?.field === 'email' ? account.value.trim().toLowerCase() : '';

    return (
        <Dialog
            open={account !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hai già un account?</DialogTitle>
                    <DialogDescription>
                        Risulta già un account con{' '}
                        {account?.field === 'phone'
                            ? 'questo numero di telefono'
                            : 'questa email'}
                        . Vuoi accedere?
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <SocialSignIn
                                verb="Continua con"
                                googleEnabled={googleEnabled}
                            />

                            {/* As on the login page, where it is ticked by default. */}
                            <input type="hidden" name="remember" value="on" />

                            <FormField label="Email" error={errors.email}>
                                {({ id, describedBy }) => (
                                    <Input
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.email}
                                        type="email"
                                        name="email"
                                        required
                                        defaultValue={email}
                                        autoFocus={email === ''}
                                        autoComplete="email"
                                        placeholder="nome@esempio.it"
                                        className={inputClass}
                                    />
                                )}
                            </FormField>

                            <FormField
                                label="Password"
                                error={errors.password}
                                labelAside={
                                    <Link
                                        href={request()}
                                        className="text-sm text-muted-foreground hover:underline"
                                    >
                                        Password dimenticata?
                                    </Link>
                                }
                            >
                                {({ id, describedBy }) => (
                                    <PasswordField
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.password}
                                        name="password"
                                        required
                                        autoFocus={email !== ''}
                                        autoComplete="current-password"
                                    />
                                )}
                            </FormField>

                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11"
                                    >
                                        Annulla
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    className="h-11"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    Accedi
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
