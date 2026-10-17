import { router } from '@inertiajs/react';
import { useState } from 'react';
import TrainerProfileSettingsController from '@/actions/App/Http/Controllers/TrainerProfileSettingsController';
import AcknowledgeCheckbox from '@/components/account/acknowledge-checkbox';
import SettingsSection from '@/components/account/settings-section';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sessionsLabel } from '@/lib/calendar';

type CloseTrainerProfileSectionProps = {
    /** Confirmed sessions and requests that get cancelled. */
    upcoming: { sessions: number; requests: number };
    /** "Metti in pausa" is on; null before the registration is sent (no button). */
    paused: boolean | null;
};

/**
 * The trainer stops working on MioPersonal but stays a client: the server
 * deletes the profile and opens the client settings. Next to it, "Metti in
 * pausa" hides the profile without deleting anything, until "Riattiva profilo".
 * TODO (step 5): the message goes to the clients whose bookings are cancelled.
 */
export default function CloseTrainerProfileSection({
    upcoming,
    paused,
}: CloseTrainerProfileSectionProps) {
    const [step, setStep] = useState<'idle' | 'confirm'>('idle');
    const [acknowledged, setAcknowledged] = useState(false);
    const [message, setMessage] = useState(
        'Mi dispiace, smetto di allenare su MioPersonal. Grazie a tutti!',
    );
    const [processing, setProcessing] = useState(false);

    const togglePause = () =>
        router.patch(
            TrainerProfileSettingsController.updatePause.url(),
            { paused: !paused },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );

    const close = () =>
        router.delete(TrainerProfileSettingsController.close.url(), {
            data: { acknowledged, message },
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });

    const requests =
        upcoming.requests === 1
            ? '1 prenotazione da confermare'
            : `${upcoming.requests} prenotazioni da confermare`;

    return (
        <SettingsSection
            id="chiudi"
            title="Chiudi il profilo da trainer"
            description="Cosa succede: il profilo sparisce dalla ricerca, le prenotazioni future vengono annullate e i clienti avvisati. Le recensioni ricevute vengono cancellate."
            danger
        >
            {step === 'idle' && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={() => setStep('confirm')}
                    >
                        Chiudi il profilo
                    </Button>
                    {paused !== null && (
                        <Button
                            type="button"
                            className="h-10"
                            disabled={processing}
                            onClick={togglePause}
                        >
                            {paused ? 'Riattiva profilo' : 'Metti in pausa'}
                        </Button>
                    )}
                </div>
            )}

            {step === 'confirm' && (
                <div
                    role="alertdialog"
                    aria-label="Conferma chiusura"
                    className="flex flex-col gap-3 rounded-lg bg-muted p-3.5"
                >
                    <strong className="text-[15px]">
                        Hai {sessionsLabel(upcoming.sessions).toLowerCase()} in
                        programma e {requests}.
                    </strong>
                    <span className="text-sm">
                        Le annulliamo e avvisiamo i clienti via email. Se vuoi,
                        scrivi loro un messaggio:
                    </span>
                    <Textarea
                        aria-label="Messaggio per i clienti"
                        rows={2}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        className="bg-background text-[15px] md:text-[15px]"
                    />
                    <AcknowledgeCheckbox
                        checked={acknowledged}
                        onCheckedChange={setAcknowledged}
                    >
                        Ho capito che profilo, sedute e recensioni verranno
                        cancellati.
                    </AcknowledgeCheckbox>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            disabled={!acknowledged || processing}
                            className="h-10 font-semibold"
                            onClick={close}
                        >
                            Chiudi definitivamente
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10"
                            onClick={() => {
                                setStep('idle');
                                setAcknowledged(false);
                            }}
                        >
                            Annulla
                        </Button>
                    </div>
                </div>
            )}
        </SettingsSection>
    );
}
