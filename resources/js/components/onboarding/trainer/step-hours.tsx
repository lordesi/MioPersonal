import { Check, Info } from 'lucide-react';
import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import { weeklyHours } from '@/components/onboarding/trainer/draft';
import {
    DarkPanel,
    PanelNote,
    StepColumns,
} from '@/components/onboarding/trainer/onboarding-shell';
import NumberedSection from '@/components/trainer/area/numbered-section';
import { ruleSentences } from '@/components/trainer/hours/availability-summary';
import BookingRulesFields from '@/components/trainer/hours/booking-rules-fields';
import WeeklyHoursGrid from '@/components/trainer/hours/weekly-hours-grid';
import { formatHours } from '@/lib/format';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/**
 * Step 5: weekly hours grid and booking rules. The same fields are in
 * "Disponibilità" of the trainer area.
 */
export default function StepHours({ draft, update }: StepProps) {
    const total = weeklyHours(draft.hours);
    const activeDays = draft.hours.filter((day) => day.length > 0).length;

    return (
        <StepColumns
            aside={
                <DarkPanel label="Riepilogo di orari e regole">
                    <span className="text-[30px] leading-9 font-bold tracking-[-0.03em] tabular-nums">
                        {formatHours(total)} a settimana
                    </span>
                    <dl className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col-reverse gap-0.5 rounded-xl bg-sidebar-accent p-3">
                            <dt className="text-xs text-sidebar-muted-foreground">
                                Giorni attivi
                            </dt>
                            <dd className="text-[22px] leading-7 font-bold tabular-nums">
                                {activeDays}
                            </dd>
                        </div>
                        <div className="flex flex-col-reverse gap-0.5 rounded-xl bg-sidebar-accent p-3">
                            <dt className="text-xs text-sidebar-muted-foreground">
                                Conferma
                            </dt>
                            <dd className="text-[17px] leading-7 font-bold">
                                {draft.autoConfirm ? 'Automatica' : 'Manuale'}
                            </dd>
                        </div>
                    </dl>
                    <ul className="flex flex-col gap-3">
                        {ruleSentences(draft).map((sentence) => (
                            <li
                                key={sentence}
                                className="flex gap-2.5 text-sm text-sidebar-foreground/90"
                            >
                                <span className="flex size-5.5 flex-none items-center justify-center rounded-full bg-sidebar-border">
                                    <Check
                                        aria-hidden="true"
                                        className="size-3"
                                        strokeWidth={3}
                                    />
                                </span>
                                {sentence}
                            </li>
                        ))}
                    </ul>
                    <PanelNote icon={<Info aria-hidden="true" />}>
                        Dopo l’approvazione trovi tutto in Disponibilità, nella
                        tua area trainer.
                    </PanelNote>
                </DarkPanel>
            }
        >
            <NumberedSection step={1} title="Orari di lavoro">
                <WeeklyHoursGrid
                    hours={draft.hours}
                    onChange={(hours) => update({ hours })}
                />
            </NumberedSection>

            <NumberedSection step={2} title="Regole di prenotazione">
                <BookingRulesFields
                    rules={draft.rules}
                    autoConfirm={draft.autoConfirm}
                    onChange={update}
                />
            </NumberedSection>
        </StepColumns>
    );
}
