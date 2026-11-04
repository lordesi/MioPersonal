import { ChartColumn, Megaphone, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import SettingSwitch from '@/components/account/setting-switch';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { CookieConsent } from '@/lib/cookie-consent';

type CookiePreferencesDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The saved choice, or null if none yet: then everything starts off. */
    consent: CookieConsent | null;
    onSave: (consent: CookieConsent) => void;
    disabled?: boolean;
};

/** "Impostazioni cookie": one switch per category, the technical ones locked on. */
export default function CookiePreferencesDialog({
    open,
    onOpenChange,
    consent,
    onSave,
    disabled,
}: CookiePreferencesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-5">
                <DialogHeader>
                    <DialogTitle>Impostazioni cookie</DialogTitle>
                    <DialogDescription>
                        Scegli quali cookie possiamo usare. Al momento non
                        usiamo cookie di statistica né di marketing: se li
                        aggiungeremo, rispetteremo la tua scelta.
                    </DialogDescription>
                </DialogHeader>
                {/* Mounted only while open: the switches start from the saved choice. */}
                {open && (
                    <PreferencesForm
                        consent={consent}
                        onSave={onSave}
                        disabled={disabled}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function PreferencesForm({
    consent,
    onSave,
    disabled,
}: Pick<CookiePreferencesDialogProps, 'consent' | 'onSave' | 'disabled'>) {
    const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
    const [marketing, setMarketing] = useState(consent?.marketing ?? false);

    return (
        <>
            <div className="flex flex-col gap-2.5">
                <SettingSwitch
                    label="Necessari"
                    description="Accesso e sicurezza, sempre attivi"
                    icon={ShieldCheck}
                    checked
                    onCheckedChange={() => {}}
                    disabled
                />
                <SettingSwitch
                    label="Statistiche"
                    description="Per capire come viene usato il sito"
                    icon={ChartColumn}
                    checked={analytics}
                    onCheckedChange={setAnalytics}
                    disabled={disabled}
                />
                <SettingSwitch
                    label="Marketing"
                    description="Per mostrarti pubblicità pertinente"
                    icon={Megaphone}
                    checked={marketing}
                    onCheckedChange={setMarketing}
                    disabled={disabled}
                />
            </div>
            <DialogFooter className="gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() => onSave({ analytics, marketing })}
                    disabled={disabled}
                >
                    Salva preferenze
                </Button>
                <Button
                    type="button"
                    className="h-10 font-semibold"
                    onClick={() => onSave({ analytics: true, marketing: true })}
                    disabled={disabled}
                >
                    Accetta tutti
                </Button>
            </DialogFooter>
        </>
    );
}
