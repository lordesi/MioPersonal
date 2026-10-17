import type { TrainerDraft } from '@/components/onboarding/trainer/draft';
import StepTitle from '@/components/onboarding/trainer/step-title';
import BookingRulesFields from '@/components/trainer/hours/booking-rules-fields';
import WeeklyHoursGrid from '@/components/trainer/hours/weekly-hours-grid';

type StepProps = {
    draft: TrainerDraft;
    update: (changes: Partial<TrainerDraft>) => void;
};

/**
 * Step 5: weekly hours grid and booking rules. The same fields are in
 * "Disponibilità" of the trainer area.
 */
export default function StepHours({ draft, update }: StepProps) {
    return (
        <>
            <StepTitle
                title="I tuoi orari di lavoro"
                description="Da qui nascono gli slot prenotabili sul tuo profilo. Tocca le fasce in cui lavori; gli orari esatti li rifinisci dalla tua area."
            />

            <WeeklyHoursGrid
                hours={draft.hours}
                onChange={(hours) => update({ hours })}
            />

            <div className="flex flex-col gap-4 border-t pt-5">
                <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold">
                        Regole di prenotazione
                    </span>
                    <span className="text-sm text-muted-foreground">
                        Puoi cambiarle quando vuoi dalla tua area.
                    </span>
                </div>

                <BookingRulesFields
                    rules={draft.rules}
                    autoConfirm={draft.autoConfirm}
                    onChange={update}
                />
            </div>
        </>
    );
}
