import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Form, Link } from '@inertiajs/react';
import { Lock, Mail } from 'lucide-react';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import SocialSignIn from '@/components/auth/social-sign-in';
import DarkDialog, {
    darkLinkClassName,
    darkSecondaryButtonClassName,
} from '@/components/mp/dark-dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { CheckedField } from '@/hooks/use-account-check';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
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

/**
 * The fields of the design: 50px with a turquoise icon and the label above
 * on phones; on desktop a round field, white icon, the placeholder as label.
 */
const fieldClassName =
    'h-12.5 rounded-[14px] bg-transparent pl-12 text-[17px] tracking-[-0.43px] shadow-none focus-visible:border-brand focus-visible:bg-[#141414] focus-visible:shadow-[inset_0_0_0_0.5px_var(--brand)] focus-visible:ring-0 md:h-13 md:rounded-full md:text-[17px] md:font-semibold md:tracking-normal md:placeholder:text-foreground md:focus-visible:bg-transparent';

const iconClassName =
    'pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-brand md:left-5 md:text-foreground';

const labelClassName =
    'text-[15px] leading-5 font-semibold tracking-[-0.23px] md:sr-only';

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
    const isMobile = useIsMobile();

    // Lowercase, as the sign-up saves it: the login compares it as it is.
    const email =
        account?.field === 'email' ? account.value.trim().toLowerCase() : '';

    return (
        <DarkDialog
            open={account !== null}
            onOpenChange={(open) => !open && onClose()}
            title={
                <>
                    Hai già un <strong className="font-bold">account</strong>?
                </>
            }
            description={
                account?.field === 'phone'
                    ? 'Questo numero è già registrato. Accedi per continuare.'
                    : 'Questa email è già registrata. Accedi per continuare.'
            }
            logo
        >
            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6 md:gap-2.5"
            >
                {({ processing, errors }) => (
                    <>
                        <SocialSignIn
                            verb="Continua con"
                            googleEnabled={googleEnabled}
                            className="h-12.5 rounded-full text-[17px]"
                            dividerLabel="oppure con email"
                        />

                        {/* As on the login page, where it is ticked by default. */}
                        <input type="hidden" name="remember" value="on" />

                        <FormField
                            label="Email"
                            error={errors.email}
                            labelClassName={labelClassName}
                        >
                            {({ id, describedBy }) => (
                                <div className="relative">
                                    <Mail
                                        aria-hidden="true"
                                        className={iconClassName}
                                    />
                                    <Input
                                        id={id}
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.email}
                                        type="email"
                                        name="email"
                                        inputMode="email"
                                        required
                                        defaultValue={email}
                                        autoFocus={email === ''}
                                        autoComplete="email"
                                        placeholder={
                                            isMobile
                                                ? 'nome@esempio.it'
                                                : 'Email'
                                        }
                                        className={fieldClassName}
                                    />
                                </div>
                            )}
                        </FormField>

                        <div className="flex flex-col gap-2 md:gap-0">
                            <FormField
                                label="Password"
                                error={errors.password}
                                labelClassName={labelClassName}
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
                                        placeholder={
                                            isMobile
                                                ? 'Scrivi la password'
                                                : 'Password'
                                        }
                                        icon={
                                            <Lock
                                                aria-hidden="true"
                                                className={iconClassName}
                                            />
                                        }
                                        className={fieldClassName}
                                        toggleClassName="top-1/2 right-1 h-11 min-w-20 -translate-y-1/2 rounded-full text-[15px] font-semibold tracking-[-0.23px] text-brand hover:bg-brand/12 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:right-2"
                                    />
                                )}
                            </FormField>
                            <Link
                                href={request()}
                                className={cn(
                                    darkLinkClassName,
                                    'self-start md:self-end',
                                )}
                            >
                                Password dimenticata?
                            </Link>
                        </div>

                        <div className="flex flex-col gap-3 md:gap-2.5">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex h-14 items-center justify-center gap-2 rounded-full bg-brand text-[17px] font-bold font-semibold tracking-[-0.43px] text-black outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60"
                            >
                                {processing && <Spinner />}
                                Accedi
                            </button>
                            <DialogPrimitive.Close
                                type="button"
                                className={darkSecondaryButtonClassName}
                            >
                                Annulla
                            </DialogPrimitive.Close>
                        </div>
                    </>
                )}
            </Form>
        </DarkDialog>
    );
}
