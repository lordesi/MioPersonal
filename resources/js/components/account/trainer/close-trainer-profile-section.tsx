import { router } from '@inertiajs/react';
import { Power } from 'lucide-react';
import { useState } from 'react';
import TrainerProfileSettingsController from '@/actions/App/Http/Controllers/TrainerProfileSettingsController';
import SettingsSection from '@/components/account/settings-section';
import { Button } from '@/components/ui/button';

const consequences = [
    'Il tuo profilo non sarà più visibile nella ricerca.',
    'Le prenotazioni future vengono annullate.',
];

/**
 * The trainer stops working on MioPersonal but stays a client: the server
 * deletes the profile and opens the client settings. "Metti in pausa" leads
 * to "Visibilità del profilo", where nothing gets deleted.
 */
export default function CloseTrainerProfileSection({
    canPause,
}: {
    /** False before the registration is sent: there is no pause to suggest. */
    canPause: boolean;
}) {
    const [confirming, setConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);

    const close = () =>
        router.delete(TrainerProfileSettingsController.close.url(), {
            data: { acknowledged: true },
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        });

    return (
        <SettingsSection
            id="chiudi"
            title="Chiudi il profilo da trainer"
            icon={Power}
            description="Puoi tornare cliente senza perdere il tuo account."
            danger
        >
            <ul className="flex flex-col gap-2 rounded-[14px] bg-muted px-4 py-3.5 text-sm text-foreground/80">
                {consequences.map((consequence) => (
                    <li key={consequence} className="flex gap-2.5">
                        <span
                            aria-hidden="true"
                            className="mt-1.75 size-1.5 flex-none rounded-full bg-foreground"
                        />
                        {consequence}
                    </li>
                ))}
            </ul>

            {confirming ? (
                <div
                    role="alertdialog"
                    aria-labelledby="close-title"
                    aria-describedby="close-hint"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sidebar px-4.5 py-4 text-sidebar-foreground"
                >
                    <span className="flex flex-col gap-0.5">
                        <span
                            id="close-title"
                            className="text-[15px] leading-5.5 font-semibold"
                        >
                            Chiudere davvero il profilo da trainer?
                        </span>
                        <span
                            id="close-hint"
                            className="text-[13px] leading-4.5 text-sidebar-muted-foreground"
                        >
                            Se vuoi solo una pausa, usa “Metti in pausa”: non
                            perdi nulla.
                        </span>
                    </span>
                    <span className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirming(false)}
                            className="h-11 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                            Annulla
                        </Button>
                        <Button
                            type="button"
                            disabled={processing}
                            onClick={close}
                            className="h-11 bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        >
                            Sì, chiudi il profilo
                        </Button>
                    </span>
                </div>
            ) : (
                <div className="flex flex-wrap justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConfirming(true)}
                        className="h-11 rounded-xl font-semibold"
                    >
                        Chiudi il profilo
                    </Button>
                    {canPause && (
                        <Button
                            asChild
                            className="h-11 rounded-xl font-semibold"
                        >
                            <a href="#visibilita">Metti in pausa</a>
                        </Button>
                    )}
                </div>
            )}
        </SettingsSection>
    );
}
