import { Head, Link, useForm } from '@inertiajs/react';
import TrainerAvailabilityController from '@/actions/App/Http/Controllers/TrainerAvailabilityController';
import NumberedSection from '@/components/trainer/area/numbered-section';
import PageHeading from '@/components/trainer/area/page-heading';
import AvailabilitySummary from '@/components/trainer/hours/availability-summary';
import BookingRulesFields from '@/components/trainer/hours/booking-rules-fields';
import WeeklyHoursGrid from '@/components/trainer/hours/weekly-hours-grid';
import { register } from '@/routes/trainer';
import type { TrainerAvailability } from '@/types';

type AvailabilityProps = {
    /** null until the registration is sent. */
    availability: TrainerAvailability | null;
};

export default function Availability({ availability }: AvailabilityProps) {
    return (
        <>
            <Head title="Disponibilità e regole" />

            <PageHeading
                title="Disponibilità e regole"
                description="Da qui nascono gli slot che i clienti vedono sul tuo profilo."
            />

            {availability === null ? (
                <p className="text-sm text-muted-foreground">
                    Scegli i tuoi orari nella{' '}
                    <Link
                        href={register()}
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        registrazione da trainer
                    </Link>
                    : poi potrai cambiarli da qui.
                </p>
            ) : (
                <AvailabilityForm availability={availability} />
            )}
        </>
    );
}

/**
 * The same fields as step 5 of "Diventa trainer" on the left, the summary
 * for the clients with "Salva modifiche" on the right.
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
            // Back to "Tutto salvato" until the next change.
            onSuccess: () => form.setDefaults(),
        });
    };

    let status = 'Tutto salvato';

    if (form.processing) {
        status = 'Salvataggio…';
    } else if (form.hasErrors) {
        status = 'Controlla i campi segnati';
    } else if (form.isDirty) {
        status = 'Modifiche non salvate';
    }

    return (
        <form onSubmit={submit} className="flex flex-wrap items-start gap-5">
            <div className="flex min-w-0 flex-[3_1_600px] flex-col gap-4">
                <NumberedSection
                    step={1}
                    title="Orari di lavoro"
                    description="Le prenotazioni già fatte restano valide anche se togli quelle ore."
                >
                    <WeeklyHoursGrid
                        hours={form.data.hours}
                        onChange={(hours) => form.setData('hours', hours)}
                    />
                    {hoursError && (
                        <p className="text-sm text-destructive">{hoursError}</p>
                    )}
                </NumberedSection>

                <NumberedSection
                    step={2}
                    title="Regole di prenotazione"
                    description="Valgono per le prossime prenotazioni."
                >
                    <BookingRulesFields
                        rules={form.data.rules}
                        autoConfirm={form.data.autoConfirm}
                        onChange={(changes) =>
                            form.setData({ ...form.data, ...changes })
                        }
                        errors={errors}
                    />
                </NumberedSection>
            </div>

            <aside className="min-w-0 flex-[2_1_320px] lg:sticky lg:top-6">
                <AvailabilitySummary
                    availability={form.data}
                    status={status}
                    changed={form.isDirty}
                    saving={form.processing}
                />
            </aside>
        </form>
    );
}

Availability.layout = { section: 'availability' };
