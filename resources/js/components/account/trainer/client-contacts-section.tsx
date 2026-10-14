import { router } from '@inertiajs/react';
import { useId, useState } from 'react';
import TrainerProfileSettingsController from '@/actions/App/Http/Controllers/TrainerProfileSettingsController';
import SettingsSection from '@/components/account/settings-section';
import SwitchRow from '@/components/shared/switch-row';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TrainerContacts } from '@/types';

type Choices = {
    showPhone: boolean;
    showEmail: boolean;
    showWhatsapp: boolean;
    arrivalNotes: string;
};

/**
 * What clients receive once a booking is confirmed. Telefono and WhatsApp
 * need the phone of "Dati personali". The switches are saved right away,
 * the notes when the field is left.
 */
export default function ClientContactsSection({
    phone,
    email,
    arrivalNotes,
    showPhone,
    showEmail,
    showWhatsapp,
}: TrainerContacts) {
    const [saved, setSaved] = useState<Choices>({
        showPhone,
        showEmail,
        showWhatsapp,
        arrivalNotes,
    });
    const [choices, setChoices] = useState<Choices>(saved);
    const [error, setError] = useState<string | undefined>();
    const notesId = useId();

    const save = (next: Choices) => {
        // The switch moves at once; it goes back if the server says no.
        setChoices(next);
        router.patch(
            TrainerProfileSettingsController.updateContacts.url(),
            {
                show_phone: next.showPhone,
                show_email: next.showEmail,
                show_whatsapp: next.showWhatsapp,
                arrival_notes: next.arrivalNotes,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setSaved(next);
                    setError(undefined);
                },
                onError: (errors) => {
                    setChoices(saved);
                    setError(errors.arrival_notes);
                },
            },
        );
    };

    return (
        <SettingsSection
            id="contatti"
            title="Contatti per i clienti"
            description="Cosa ricevono i clienti quando confermi una prenotazione. Prima della conferma non vedono nessun contatto."
        >
            <div className="flex flex-col">
                {phone && (
                    <SwitchRow
                        label="Telefono"
                        description={phone}
                        checked={choices.showPhone}
                        onCheckedChange={(checked) =>
                            save({ ...choices, showPhone: checked })
                        }
                        className="border-b py-3"
                    />
                )}
                <SwitchRow
                    label="Email"
                    description={email}
                    checked={choices.showEmail}
                    onCheckedChange={(checked) =>
                        save({ ...choices, showEmail: checked })
                    }
                    className="border-b py-3"
                />
                {phone ? (
                    <SwitchRow
                        label="Scrivimi su WhatsApp"
                        description="Mostra un pulsante che apre la chat con il tuo numero"
                        checked={choices.showWhatsapp}
                        onCheckedChange={(checked) =>
                            save({ ...choices, showWhatsapp: checked })
                        }
                        className="border-b py-3"
                    />
                ) : (
                    <p className="border-b py-3 text-xs text-muted-foreground">
                        Aggiungi il telefono in «Dati personali» per mostrarlo
                        ai clienti e ricevere messaggi su WhatsApp.
                    </p>
                )}
            </div>
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
                    maxLength={500}
                    value={choices.arrivalNotes}
                    onChange={(event) =>
                        setChoices({
                            ...choices,
                            arrivalNotes: event.target.value,
                        })
                    }
                    onBlur={() => {
                        if (choices.arrivalNotes !== saved.arrivalNotes) {
                            save(choices);
                        }
                    }}
                    aria-describedby={`${notesId}-hint`}
                    aria-invalid={!!error}
                    className="text-[15px] md:text-[15px]"
                />
                <span
                    id={`${notesId}-hint`}
                    className="text-xs text-muted-foreground"
                >
                    Arriva nell’email di conferma insieme all’indirizzo. Si
                    salva quando esci dal campo.
                </span>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        </SettingsSection>
    );
}
