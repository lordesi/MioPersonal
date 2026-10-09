import { useState } from 'react';
import AcknowledgeCheckbox from '@/components/account/acknowledge-checkbox';
import SettingsSection from '@/components/account/settings-section';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sessionsLabel } from '@/lib/calendar';

type CloseTrainerProfileSectionProps = {
    /** Confirmed sessions and requests that get cancelled. */
    upcoming: { sessions: number; requests: number };
};

/**
 * The trainer stops working on MioPersonal but stays a client.
 * TODO: close the profile on the server; for now it only lives in the page.
 */
export default function CloseTrainerProfileSection({
    upcoming,
}: CloseTrainerProfileSectionProps) {
    const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle');
    const [acknowledged, setAcknowledged] = useState(false);

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
                    <span className="self-center text-[13px] text-muted-foreground">
                        Vuoi solo una pausa? Usa «Metti in pausa» qui sopra.
                    </span>
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
                        defaultValue="Mi dispiace, smetto di allenare su MioPersonal. Grazie a tutti!"
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
                            disabled={!acknowledged}
                            className="h-10 font-semibold"
                            onClick={() => setStep('done')}
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

            {step === 'done' && (
                <span role="status" className="text-sm">
                    Profilo chiuso, clienti avvisati. Resti iscritto come
                    cliente: puoi eliminare anche l’account da «Elimina
                    account».
                </span>
            )}
        </SettingsSection>
    );
}
