import { router } from '@inertiajs/react';
import { Check, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import TrainerProfileSettingsController from '@/actions/App/Http/Controllers/TrainerProfileSettingsController';
import SectionFooter from '@/components/account/section-footer';
import SettingSwitch from '@/components/account/setting-switch';
import SettingsSection from '@/components/account/settings-section';
import FormField from '@/components/auth/form-field';
import { Textarea } from '@/components/ui/textarea';
import type { TrainerContacts } from '@/types';

/** The same limit as the server. */
const NOTES_MAX = 300;

type Choices = {
    showPhone: boolean;
    showEmail: boolean;
    arrivalNotes: string;
};

/**
 * What clients receive once a booking is confirmed, with a preview on the
 * right. Telefono needs the phone of "Dati personali". Saved with
 * "Salva modifiche".
 */
export default function ClientContactsSection({
    phone,
    email,
    arrivalNotes,
    showPhone,
    showEmail,
}: TrainerContacts) {
    const [saved, setSaved] = useState<Choices>({
        showPhone,
        showEmail,
        arrivalNotes,
    });
    const [choices, setChoices] = useState<Choices>(saved);
    const [error, setError] = useState<string | undefined>();
    const [processing, setProcessing] = useState(false);

    const dirty =
        choices.showPhone !== saved.showPhone ||
        choices.showEmail !== saved.showEmail ||
        choices.arrivalNotes !== saved.arrivalNotes;

    const save = () =>
        router.patch(
            TrainerProfileSettingsController.updateContacts.url(),
            {
                show_phone: choices.showPhone,
                show_email: choices.showEmail,
                arrival_notes: choices.arrivalNotes,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setSaved(choices);
                    setError(undefined);
                },
                onError: (errors) => setError(errors.arrival_notes),
            },
        );

    // What the client sees: Telefono only if there is a phone to share.
    const shared: { label: string; value: string }[] = [];

    if (phone && choices.showPhone) {
        shared.push({ label: 'Telefono', value: phone });
    }

    if (choices.showEmail) {
        shared.push({ label: 'Email', value: email });
    }

    const notes = choices.arrivalNotes.trim();

    return (
        <SettingsSection
            id="contatti"
            title="Contatti per i clienti"
            icon={Phone}
        >
            <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 flex-[3_1_320px] flex-col gap-2.5">
                    {phone ? (
                        <SettingSwitch
                            label="Telefono"
                            description={phone}
                            icon={Phone}
                            highlightOn
                            checked={choices.showPhone}
                            onCheckedChange={(checked) =>
                                setChoices({ ...choices, showPhone: checked })
                            }
                        />
                    ) : (
                        <p className="rounded-2xl border border-dashed px-4 py-3.5 text-[13px] text-muted-foreground">
                            Aggiungi il telefono in «Dati personali» per
                            mostrarlo ai clienti.
                        </p>
                    )}
                    <SettingSwitch
                        label="Email"
                        description={email}
                        icon={Mail}
                        highlightOn
                        checked={choices.showEmail}
                        onCheckedChange={(checked) =>
                            setChoices({ ...choices, showEmail: checked })
                        }
                    />
                    <div className="mt-1">
                        <FormField
                            label="Indicazioni aggiuntive · facoltativo"
                            error={error}
                            counter={{
                                length: choices.arrivalNotes.length,
                                max: NOTES_MAX,
                            }}
                        >
                            {({ id, describedBy }) => (
                                <Textarea
                                    id={id}
                                    rows={3}
                                    maxLength={NOTES_MAX}
                                    placeholder="Es. Citofono Siligato, secondo piano. Porta asciugamano e scarpe pulite."
                                    value={choices.arrivalNotes}
                                    onChange={(event) =>
                                        setChoices({
                                            ...choices,
                                            arrivalNotes: event.target.value,
                                        })
                                    }
                                    aria-describedby={describedBy}
                                    aria-invalid={!!error}
                                    className="rounded-xl px-3.5 py-3 text-[15px] leading-5.5 md:text-[15px]"
                                />
                            )}
                        </FormField>
                    </div>
                </div>

                <div className="flex min-w-0 flex-[2_1_240px] flex-col gap-3 rounded-[20px] bg-sidebar p-4.5 text-sidebar-foreground">
                    <span className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground">
                        COSA VEDE IL CLIENTE
                    </span>
                    <span className="flex items-center gap-2 text-[13px] leading-4.5 text-sidebar-foreground/85">
                        <span
                            aria-hidden="true"
                            className="flex size-5 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground"
                        >
                            <Check strokeWidth={3.5} className="size-2.75" />
                        </span>
                        Seduta confermata
                    </span>
                    {shared.map((contact) => (
                        <div
                            key={contact.label}
                            className="flex flex-col gap-px rounded-[14px] bg-sidebar-accent px-3.5 py-3"
                        >
                            <span className="text-xs text-sidebar-muted-foreground">
                                {contact.label}
                            </span>
                            <span className="text-sm font-semibold break-words tabular-nums">
                                {contact.value}
                            </span>
                        </div>
                    ))}
                    {shared.length === 0 && (
                        <div className="rounded-[14px] border border-dashed border-sidebar-muted-foreground/60 px-3.5 py-3 text-[13px] leading-4.5 text-sidebar-foreground/85">
                            Nessun contatto condiviso: il cliente non saprà come
                            raggiungerti.
                        </div>
                    )}
                    {notes !== '' && (
                        <div className="flex flex-col gap-px rounded-[14px] bg-sidebar-accent px-3.5 py-3">
                            <span className="text-xs text-sidebar-muted-foreground">
                                Indicazioni
                            </span>
                            <span className="text-[13px] leading-4.5 break-words">
                                {notes}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <SectionFooter
                dirty={dirty}
                processing={processing}
                onSave={save}
            />
        </SettingsSection>
    );
}
