import { Head, Link, useForm } from '@inertiajs/react';
import TrainerAvailabilityController from '@/actions/App/Http/Controllers/TrainerAvailabilityController';
import PageHeading from '@/components/trainer/area/page-heading';
import BookingRulesFields from '@/components/trainer/hours/booking-rules-fields';
import WeeklyHoursGrid from '@/components/trainer/hours/weekly-hours-grid';
import { Button } from '@/components/ui/button';
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

/** The same fields as step 5 of "Diventa trainer", saved with one button. */
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
            // "✓ Salvato" stays until the next change.
            onSuccess: () => form.setDefaults(),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <section
                aria-label="Orari di lavoro"
                className="flex flex-col gap-4 rounded-[20px] border bg-card p-5 md:p-6"
            >
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Orari di lavoro</h2>
                    <p className="text-sm text-muted-foreground">
                        Le prenotazioni già fatte restano valide anche se togli
                        quelle ore.
                    </p>
                </div>
                <WeeklyHoursGrid
                    hours={form.data.hours}
                    onChange={(hours) => form.setData('hours', hours)}
                />
                {hoursError && (
                    <p className="text-sm text-destructive">{hoursError}</p>
                )}
            </section>

            <section
                aria-label="Regole di prenotazione"
                className="flex flex-col gap-4 rounded-[20px] border bg-card p-5 md:p-6"
            >
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">
                        Regole di prenotazione
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Valgono per le prossime prenotazioni.
                    </p>
                </div>
                <BookingRulesFields
                    rules={form.data.rules}
                    autoConfirm={form.data.autoConfirm}
                    onChange={(changes) =>
                        form.setData({ ...form.data, ...changes })
                    }
                    errors={errors}
                />
            </section>

            <div className="flex items-center gap-3">
                <Button
                    type="submit"
                    disabled={form.processing}
                    className="h-10 font-semibold"
                >
                    Salva modifiche
                </Button>
                {form.wasSuccessful && !form.isDirty && (
                    <span role="status" className="text-sm">
                        ✓ Salvato
                    </span>
                )}
            </div>
        </form>
    );
}

Availability.layout = { section: 'availability' };
