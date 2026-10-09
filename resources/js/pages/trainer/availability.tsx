import { Head } from '@inertiajs/react';
import { useState } from 'react';
import BookingRulesCard from '@/components/trainer/area/booking-rules-card';
import PageHeading from '@/components/trainer/area/page-heading';
import type { Holiday } from '@/components/trainer/area/working-hours-card';
import WorkingHoursCard from '@/components/trainer/area/working-hours-card';
import type { BookingRules, WorkingDay } from '@/types';

type AvailabilityProps = {
    weekdays: WorkingDay[];
    durations: number[];
    holidays: Holiday[];
    autoConfirm: boolean;
    rules: BookingRules;
};

export default function Availability(props: AvailabilityProps) {
    // TODO: save every change on the server; for now it only lives in the page.
    const [weekdays, setWeekdays] = useState(props.weekdays);
    const [durations, setDurations] = useState(props.durations.map(String));
    const [holidays, setHolidays] = useState(props.holidays);
    const [autoConfirm, setAutoConfirm] = useState(props.autoConfirm);
    const [rules, setRules] = useState(props.rules);

    return (
        <>
            <Head title="Disponibilità e regole" />

            <PageHeading
                title="Disponibilità e regole"
                description="Da qui nascono gli slot che i clienti vedono sul tuo profilo."
            />

            <div className="flex flex-wrap items-start gap-5">
                <WorkingHoursCard
                    weekdays={weekdays}
                    onToggleDay={(day, enabled) =>
                        setWeekdays(
                            weekdays.map((item) =>
                                item.day === day ? { ...item, enabled } : item,
                            ),
                        )
                    }
                    durations={durations}
                    onDurationsChange={setDurations}
                    holidays={holidays}
                    onRemoveHoliday={(id) =>
                        setHolidays(holidays.filter((item) => item.id !== id))
                    }
                />
                <BookingRulesCard
                    rules={rules}
                    onRulesChange={setRules}
                    autoConfirm={autoConfirm}
                    onAutoConfirmChange={setAutoConfirm}
                />
            </div>
        </>
    );
}

Availability.layout = { section: 'availability' };
