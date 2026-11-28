import { useState } from 'react';
import {
    FloatingPanel,
    PanelHeader,
    asidePanelClassName,
} from '@/components/trainer/session/panel-shell';
import type { PopoverAnchor } from '@/components/trainer/session/panel-shell';
import {
    ClientSection,
    DayPickerPanel,
    NoteSection,
    PackageSection,
    PanelFooter,
    SessionSections,
    TimePickerPanel,
    WhenSection,
} from '@/components/trainer/session/session-form-parts';
import type { Picker } from '@/components/trainer/session/session-form-parts';
import type { SessionForm } from '@/components/trainer/session/use-session-form';
import { formatDayLong } from '@/lib/format';

export type { PopoverAnchor };

/**
 * "Nuova seduta" on desktop (designs "Popover bottone +", "Popover clic su
 * un orario", "Popover scegli il giorno / l’ora"): under "+" or beside the
 * hour clicked. The day and the time open their pickers beside it.
 */
export default function SessionPopover({
    open,
    onOpenChange,
    form,
    today,
    anchor,
    fromSlot,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: SessionForm;
    today: string;
    anchor: PopoverAnchor | null;
    /** Opened from an hour of the grid: the day and the time under the title. */
    fromSlot: boolean;
    onSave: () => void;
}) {
    const [picker, setPicker] = useState<Picker>(null);
    const [whenRow, setWhenRow] = useState<HTMLDivElement | null>(null);

    return (
        <FloatingPanel
            open={open}
            onOpenChange={onOpenChange}
            anchor={anchor}
            label="Nuova seduta"
            asideWidth={picker === 'time' ? 300 : 340}
            asideFrom={whenRow}
            aside={
                picker && (
                    <div className={asidePanelClassName}>
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
                )
            }
        >
            <PanelHeader
                title="Nuova seduta"
                subtitle={
                    fromSlot
                        ? `${formatDayLong(form.date)} · ${form.time} – ${form.end}`
                        : 'Scegli cliente, giorno e ora'
                }
            />
            <ClientSection form={form.client} error={form.clientError} />
            <PackageSection form={form} />
            <WhenSection
                form={form}
                picker={picker}
                onPicker={setPicker}
                rowRef={setWhenRow}
            />
            <SessionSections form={form} />
            <NoteSection form={form} />
            <PanelFooter
                onCancel={() => onOpenChange(false)}
                onConfirm={onSave}
                label="Aggiungi seduta"
                processing={form.processing}
                errors={form.otherErrors}
            />
        </FloatingPanel>
    );
}
