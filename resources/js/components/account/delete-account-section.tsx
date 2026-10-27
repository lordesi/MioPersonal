import { Form } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import SettingsSection from '@/components/account/settings-section';
import PasswordField from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DeleteAccountSectionProps = {
    /** What gets deleted: different for clients and trainers. */
    description: string;
    /** Who has a password types it too; who uses only Google can't. */
    hasPassword: boolean;
    /** Trainers of the client's pending bookings: they get cancelled too. */
    pendingBookingTrainers?: string[];
};

/** Deletes the account on the server (route `profile.destroy`) after typing ELIMINA. */
export default function DeleteAccountSection({
    description,
    hasPassword,
    pendingBookingTrainers = [],
}: DeleteAccountSectionProps) {
    const [open, setOpen] = useState(false);
    const [confirmation, setConfirmation] = useState('');
    const confirmationId = useId();
    const passwordId = useId();

    const confirmed = confirmation.trim().toUpperCase() === 'ELIMINA';

    const close = () => {
        setOpen(false);
        setConfirmation('');
    };

    return (
        <SettingsSection
            id="elimina"
            title="Elimina account"
            icon={Trash2}
            description={description}
            danger
        >
            {open ? (
                <Form
                    {...ProfileController.destroy.form()}
                    options={{ preserveScroll: true }}
                    role="alertdialog"
                    aria-labelledby={`${confirmationId}-title`}
                    className="flex flex-col gap-3 rounded-2xl bg-sidebar p-4.5 text-sidebar-foreground"
                >
                    {({ errors, processing }) => (
                        <>
                            <span
                                id={`${confirmationId}-title`}
                                className="text-[15px] leading-5.5 font-semibold"
                            >
                                Non si può annullare. Per confermare scrivi
                                ELIMINA.
                            </span>
                            <PendingBookings
                                trainers={pendingBookingTrainers}
                            />
                            {hasPassword && (
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor={passwordId}
                                        className="text-[13px] font-semibold"
                                    >
                                        Password attuale
                                    </label>
                                    <PasswordField
                                        id={passwordId}
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        aria-invalid={!!errors.password}
                                        className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-sidebar-foreground">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <label
                                    htmlFor={confirmationId}
                                    className="sr-only"
                                >
                                    Scrivi ELIMINA per confermare
                                </label>
                                <Input
                                    id={confirmationId}
                                    name="confirmation"
                                    value={confirmation}
                                    onChange={(event) =>
                                        setConfirmation(event.target.value)
                                    }
                                    placeholder="ELIMINA"
                                    autoComplete="off"
                                    aria-invalid={!!errors.confirmation}
                                    className="h-11 min-w-0 flex-[1_1_200px] rounded-[10px] border-sidebar-border bg-sidebar-accent tracking-[0.06em] text-sidebar-foreground placeholder:text-sidebar-muted-foreground"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={close}
                                    className="h-11 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                >
                                    Annulla
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!confirmed || processing}
                                    className="h-11 bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90 disabled:bg-sidebar-border disabled:text-sidebar-muted-foreground disabled:opacity-100"
                                >
                                    Elimina per sempre
                                </Button>
                            </div>
                            {errors.confirmation && (
                                <p className="text-sm">{errors.confirmation}</p>
                            )}
                        </>
                    )}
                </Form>
            ) : (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl font-semibold"
                        onClick={() => setOpen(true)}
                    >
                        Elimina il mio account
                    </Button>
                </div>
            )}
        </SettingsSection>
    );
}

function PendingBookings({ trainers }: { trainers: string[] }) {
    if (trainers.length === 0) {
        return null;
    }

    if (trainers.length === 1) {
        return (
            <span className="text-sm text-sidebar-foreground/85">
                Hai <strong>1 prenotazione in attesa</strong> con {trainers[0]}:
                la annulliamo e avvisiamo noi {trainers[0]}.
            </span>
        );
    }

    return (
        <span className="text-sm text-sidebar-foreground/85">
            Hai <strong>{trainers.length} prenotazioni in attesa</strong>: le
            annulliamo e avvisiamo noi i trainer.
        </span>
    );
}
