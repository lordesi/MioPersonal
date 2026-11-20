import { Check } from 'lucide-react';
import { weeklyHours } from '@/components/onboarding/trainer/draft';
import type { HourRange } from '@/lib/hours';
import { dayRangesLabel } from '@/lib/hours';
import { formatHours } from '@/lib/format';
import { stepBoxClassName } from '@/components/trainer/ui/styles';
import { cn } from '@/lib/utils';
import type { TrainerAvailability } from '@/types';

const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/** "12:00–15:00, 18:00–19:30" */
export function dayRanges(ranges: HourRange[]): string {
    return dayRangesLabel(ranges);
}

/**
 * The week in one line, days with the same hours together:
 * "Lun–Ven 12:00–18:00 · Sab 09:00–12:00".
 */
export function weekRangesLabel(hours: HourRange[][]): string {
    const groups: { ranges: string; first: number; last: number }[] = [];

    hours.forEach((dayHours, day) => {
        const ranges = dayRanges(dayHours);
        const previous = groups.at(-1);

        if (ranges === '') {
            return;
        }

        if (previous?.ranges === ranges && previous.last === day - 1) {
            previous.last = day;
        } else {
            groups.push({ ranges, first: day, last: day });
        }
    });

    if (groups.length === 0) {
        return 'Nessun orario aperto';
    }

    return groups
        .map(
            ({ ranges, first, last }) =>
                `${first === last ? dayNames[first] : `${dayNames[first]}–${dayNames[last]}`} ${ranges}`,
        )
        .join(' · ');
}

/** The rules as the clients will read them (also step 5 of "Diventa trainer"). */
export function ruleSentences({
    rules,
    autoConfirm,
}: Omit<TrainerAvailability, 'hours'>): string[] {
    const limit =
        rules.maxSessionsPerDay === null
            ? 'Nessun limite di sedute al giorno'
            : `Al massimo ${rules.maxSessionsPerDay} ${rules.maxSessionsPerDay === 1 ? 'seduta' : 'sedute'} al giorno`;
    const pause =
        rules.breakMinutes === 0
            ? 'senza pausa tra una e l’altra'
            : `con ${rules.breakMinutes} min di pausa tra una e l’altra`;

    return [
        `Possono prenotare con almeno ${formatHours(rules.noticeHours)} di preavviso, fino a ${rules.bookingWindowDays} giorni prima.`,
        `${limit}, ${pause}.`,
        `Cancellano gratis fino a ${rules.freeCancellationHours} ore prima.`,
        autoConfirm
            ? 'Le prenotazioni sono confermate subito.'
            : 'Ogni richiesta la confermi tu, entro 24 ore.',
    ];
}

type AvailabilitySummaryProps = {
    availability: TrainerAvailability;
};

/**
 * "Così funziona per i clienti" in "Disponibilità": the week and the rules
 * in words, as the clients read them.
 */
export default function AvailabilitySummary({
    availability,
}: AvailabilitySummaryProps) {
    const { hours, autoConfirm } = availability;
    const total = weeklyHours(hours);
    const activeDays = hours.filter((dayHours) => dayHours.length > 0).length;

    return (
        <section
            aria-label="Così funziona per i clienti"
            className={cn(stepBoxClassName, 'flex flex-col gap-4')}
        >
            <div className="flex flex-col gap-1">
                <span className="text-[28px] leading-8.5 font-bold tracking-[-0.03em] tabular-nums">
                    {formatHours(total)} a settimana
                </span>
                <span className="text-[15px] text-muted-foreground tabular-nums">
                    {activeDays} {activeDays === 1 ? 'giorno' : 'giorni'} su 7 ·
                    conferma {autoConfirm ? 'automatica' : 'manuale'}
                </span>
            </div>

            <ul className="flex flex-col gap-3">
                {ruleSentences(availability).map((sentence) => (
                    <li
                        key={sentence}
                        className="flex gap-2.5 text-[15px] leading-5 text-foreground/90"
                    >
                        <span className="flex size-5.5 flex-none items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]">
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
        </section>
    );
}
