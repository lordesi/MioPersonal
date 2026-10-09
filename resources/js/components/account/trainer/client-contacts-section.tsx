import { useId, useState } from 'react';
import SettingsSection from '@/components/account/settings-section';
import SwitchRow from '@/components/shared/switch-row';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TrainerContacts } from '@/types';

/**
 * What clients receive once a booking is confirmed.
 * TODO: add "Telefono" and "Scrivimi su WhatsApp" once users have a phone
 * column, and save the choices; for now they only live in the page.
 */
export default function ClientContactsSection({
    email,
    arrivalNotes,
}: TrainerContacts) {
    const [showEmail, setShowEmail] = useState(true);
    const notesId = useId();

    return (
        <SettingsSection
            id="contatti"
            title="Contatti per i clienti"
            description="Cosa ricevono i clienti quando confermi una prenotazione. Prima della conferma non vedono nessun contatto."
        >
            <SwitchRow
                label="Email"
                description={email}
                checked={showEmail}
                onCheckedChange={setShowEmail}
                className="border-b py-3"
            />
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={notesId}>
                    Indicazioni per arrivare{' '}
                    <span className="font-normal text-muted-foreground">
                        (facoltativo)
                    </span>
                </Label>
                <Textarea
                    id={notesId}
                    rows={2}
                    defaultValue={arrivalNotes}
                    aria-describedby={`${notesId}-hint`}
                    className="text-[15px] md:text-[15px]"
                />
                <span
                    id={`${notesId}-hint`}
                    className="text-xs text-muted-foreground"
                >
                    Arriva nell’email di conferma insieme all’indirizzo.
                </span>
            </div>
        </SettingsSection>
    );
}
