import { Link } from '@inertiajs/react';
import { useState } from 'react';
import SettingsSection from '@/components/account/settings-section';
import { Button } from '@/components/ui/button';
import { cookies, privacy } from '@/routes/legal';

/** Data export (GDPR) and links to the policies. */
export default function PrivacySection() {
    // TODO: prepare the export and send it by email; for now it only lives in the page.
    const [requested, setRequested] = useState(false);

    return (
        <SettingsSection
            id="privacy"
            title="Privacy e dati"
            description="Puoi scaricare una copia di tutti i tuoi dati in qualsiasi momento."
        >
            {requested ? (
                <span role="status" className="text-sm">
                    ✓ Richiesta ricevuta: ti mandiamo il file via email entro 30
                    giorni, di solito molto prima.
                </span>
            ) : (
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10"
                        onClick={() => setRequested(true)}
                    >
                        Scarica i miei dati
                    </Button>
                </div>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <Link href={privacy()} className="underline">
                    Privacy policy
                </Link>
                <Link href={cookies()} className="underline">
                    Cookie policy
                </Link>
            </div>
        </SettingsSection>
    );
}
