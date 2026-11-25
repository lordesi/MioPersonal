import { Head, Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import TrainerAvailabilityController from '@/actions/App/Http/Controllers/TrainerAvailabilityController';
import { initialDraft } from '@/components/onboarding/trainer/draft';
import StepErrors from '@/components/onboarding/trainer/step-errors';
import StepHours from '@/components/onboarding/trainer/step-hours';
import ProfilePage, {
    ProfileSection,
    SaveBar,
} from '@/components/trainer/profile-pages/profile-page';
import AvailabilitySummary from '@/components/trainer/hours/availability-summary';
import { bookingRuleOptions } from '@/components/trainer/hours/booking-rules-fields';
import DayOverrideDialog from '@/components/trainer/hours/day-override-dialog';
import DayOverrides from '@/components/trainer/hours/day-overrides';
import { brandButtonClassName } from '@/components/trainer/ui/styles';
import { register } from '@/routes/trainer';
import type { TrainerAvailability, TrainerDayOverrideBlock } from '@/types';

type AvailabilityProps = {
    /** null until the registration is sent. */
    availability: TrainerAvailability | null;
    /** "Giorni e settimane diverse", from today on. */
    overrides: TrainerDayOverrideBlock[];
    /** Rome date of today. */
    today: string;
};

export default function Availability({
    availability,
    overrides,
    today,
}: AvailabilityProps) {
    return (
        <>
            <Head title="Le tue disponibilità" />

            <ProfilePage
                title="Disponibilità"
                intro="Gli orari in cui i clienti possono prenotarti e le regole delle prenotazioni."
            >
                {availability === null ? (
                    <p className="text-[15px] text-muted-foreground">
                        Scegli i tuoi orari nella{' '}
                        <Link
                            href={register()}
                            className="font-semibold text-brand underline-offset-4 hover:underline"
                        >
                            registrazione da trainer
                        </Link>
                        : poi potrai cambiarli da qui.
                    </p>
                ) : (
                    <>
                        <AvailabilityForm availability={availability} />

                        {/* Outside the form above: saved on its own, right away. */}
                        <ProfileSection
                            title="Giorni e settimane diverse"
                            description="Ferie, un giorno libero o una settimana con altri orari: vale solo per quei giorni."
                        >
                            <DayOverrides blocks={overrides} />
                            <DayOverrideDialog
                                baseHours={availability.hours}
                                today={today}
                                trigger={
                                    <button
                                        type="button"
                                        className={`${brandButtonClassName} self-start`}
                                    >
                                        <Plus
                                            aria-hidden="true"
                                            className="size-4.5"
                                        />
                                        Modifica un giorno o una settimana
                                    </button>
                                }
                            />
                        </ProfileSection>
                    </>
                )}
            </ProfilePage>
        </>
    );
}

/**
 * Step 5 of "Diventa trainer" ("Orari e regole"), the summary for the
 * clients and "Salva modifiche".
 */
function AvailabilityForm({
    availability,
}: {
    availability: TrainerAvailability;
}) {
    const form = useForm<TrainerAvailability>(availability);
    const errors: Partial<Record<string, string>> = form.errors;
    // "hours", "hours.0" or "hours.0.1": one message for the whole grid.
    const hoursError = Object.entries(errors).find(([field]) =>
        field.startsWith('hours'),
    )?.[1];
    // The rules show their messages on top: the menus of the step have none.
    const ruleErrors = bookingRuleOptions
        .map((rule) => errors[rule.field])
        .concat(errors.auto_confirm)
        .filter((message): message is string => Boolean(message));

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            hours: data.hours,
            notice_hours: data.rules.noticeHours,
            booking_window_days: data.rules.bookingWindowDays,
            break_minutes: data.rules.breakMinutes,
            max_sessions_per_day: data.rules.maxSessionsPerDay,
            free_cancellation_hours: data.rules.freeCancellationHours,
            auto_confirm: data.autoConfirm,
        }));
        form.put(TrainerAvailabilityController.update.url(), {
            preserveScroll: true,
            // Back to no status until the next change.
            onSuccess: () => form.setDefaults(),
        });
    };

    let status: string | undefined;

    if (form.hasErrors) {
        status = 'Controlla i campi segnati';
    } else if (form.isDirty) {
        status = 'Modifiche non salvate';
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-10 md:gap-12">
            {/* Step 5 of "Diventa trainer": the ranges of each day and the rules. */}
            {(hoursError || ruleErrors.length > 0) && (
                <StepErrors
                    errors={[
                        ...(hoursError ? [hoursError] : []),
                        ...ruleErrors,
                    ]}
                    title="Da sistemare:"
                />
            )}
            <StepHours
                draft={{
                    ...initialDraft,
                    hours: form.data.hours,
                    rules: form.data.rules,
                    autoConfirm: form.data.autoConfirm,
                }}
                update={(changes) =>
                    form.setData({
                        ...form.data,
                        ...(changes.hours ? { hours: changes.hours } : {}),
                        ...(changes.rules ? { rules: changes.rules } : {}),
                        ...(changes.autoConfirm !== undefined
                            ? { autoConfirm: changes.autoConfirm }
                            : {}),
                    })
                }
            />

            <ProfileSection title="Così funziona per i clienti">
                <AvailabilitySummary availability={form.data} />
            </ProfileSection>

            <SaveBar
                status={status}
                disabled={!form.isDirty}
                saving={form.processing}
            />
        </form>
    );
}

Availability.layout = { section: 'availability' };
