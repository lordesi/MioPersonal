import { Form } from '@inertiajs/react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import AcknowledgeCheckbox from '@/components/account/acknowledge-checkbox';
import SettingsSection from '@/components/account/settings-section';
import FormField from '@/components/auth/form-field';
import PasswordField from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';

type DeleteAccountSectionProps = {
    /** Trainers of the client's pending bookings: they get cancelled too. */
    pendingBookingTrainers?: string[];
};

/**
 * Deletes the account on the server (starter kit route `profile.destroy`).
 * Unlike the design it also asks for the password: the server requires it.
 */
export default function DeleteAccountSection({
    pendingBookingTrainers = [],
}: DeleteAccountSectionProps) {
    const [open, setOpen] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    const close = () => {
        setOpen(false);
        setAcknowledged(false);
    };

    return (
        <SettingsSection
            id="elimina"
            title="Elimina account"
            description="Cancelliamo account, profilo, preferiti e messaggi. Le recensioni che hai scritto restano, ma in forma anonima."
            danger
        >
            {open ? (
                <Form
                    {...ProfileController.destroy.form()}
                    options={{ preserveScroll: true }}
                    role="alertdialog"
                    aria-label="Conferma eliminazione"
                    className="flex flex-col gap-3 rounded-lg bg-muted p-3.5"
                >
                    {({ errors, processing }) => (
                        <>
                            <strong className="text-[15px]">
                                Sei sicuro? Non si può annullare.
                            </strong>
                            <PendingBookings
                                trainers={pendingBookingTrainers}
                            />
                            <FormField
                                label="Password attuale"
                                error={errors.password}
                            >
                                {({ id, describedBy }) => (
                                    <PasswordField
                                        id={id}
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        aria-describedby={describedBy}
                                        aria-invalid={!!errors.password}
                                        className="bg-background"
                                    />
                                )}
                            </FormField>
                            <AcknowledgeCheckbox
                                checked={acknowledged}
                                onCheckedChange={setAcknowledged}
                            >
                                Ho capito che i miei dati verranno cancellati
                                definitivamente.
                            </AcknowledgeCheckbox>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="submit"
                                    disabled={!acknowledged || processing}
                                    className="h-10 font-semibold"
                                >
                                    Elimina definitivamente
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10"
                                    onClick={close}
                                >
                                    Annulla
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            ) : (
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
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
            <span className="text-sm">
                Hai <strong>1 prenotazione in attesa</strong> con {trainers[0]}:
                la annulliamo e avvisiamo noi {trainers[0]}.
            </span>
        );
    }

    return (
        <span className="text-sm">
            Hai <strong>{trainers.length} prenotazioni in attesa</strong>: le
            annulliamo e avvisiamo noi i trainer.
        </span>
    );
}
