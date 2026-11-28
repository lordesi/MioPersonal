import { useState } from 'react';
import {
    BottomSheet,
    PanelHeader,
} from '@/components/trainer/session/panel-shell';
import {
    ClientSection,
    DayPickerPanel,
    NoteSection,
    PanelFooter,
    SessionSections,
    TimePickerPanel,
    WhenSection,
} from '@/components/trainer/session/session-form-parts';
import type { Picker } from '@/components/trainer/session/session-form-parts';
import type { SessionForm } from '@/components/trainer/session/use-session-form';

/**
 * "Nuova seduta" on phones (designs "Nuova seduta · cliente esistente /
 * nuovo cliente / scegli il giorno / scegli l’ora"): a sheet from the
 * bottom. The day and the time open their pickers under QUANDO.
 */
export default function SessionSheet({
    open,
    onOpenChange,
    form,
    today,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: SessionForm;
    today: string;
    onSave: () => void;
}) {
    const [picker, setPicker] = useState<Picker>(null);

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            label="Nuova seduta"
        >
            <PanelHeader title="Nuova seduta" />
            <ClientSection form={form} />
            <WhenSection form={form} picker={picker} onPicker={setPicker}>
                {picker && (
                    <div className="rounded-[20px] bg-[#0B0C0D] p-3.5">
                        {picker === 'day' ? (
                            <DayPickerPanel
                                value={form.date}
                                today={today}
                                onChange={(date) => {
                                    form.setDate(date);
                                    setPicker(null);
                                }}
                            />
                        ) : (
                            <TimePickerPanel
                                form={form}
                                onDone={() => setPicker(null)}
                            />
                        )}
                    </div>
                )}
            </WhenSection>
            <SessionSections form={form} />
            <NoteSection form={form} />
            <PanelFooter
                onCancel={() => onOpenChange(false)}
                onConfirm={onSave}
                label="Aggiungi seduta"
                processing={form.processing}
                errors={form.otherErrors}
            />
        </BottomSheet>
    );
}
