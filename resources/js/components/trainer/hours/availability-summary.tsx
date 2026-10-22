import { Check } from 'lucide-react';
import { weeklyHours } from '@/components/onboarding/trainer/draft';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { hourLabel } from '@/lib/calendar';
import { formatHours } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TrainerAvailability } from '@/types';

const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/** [12, 13, 14, 18] → "12:00–15:00, 18:00–19:00" */
function dayRanges(hours: number[]): string {
    const ranges: string[] = [];
    let start: number | null = null;

    [...hours]
        .sort((a, b) => a - b)
        .forEach((hour, index, sorted) => {
            start ??= hour;

            if (sorted[index + 1] !== hour + 1) {
                ranges.push(`${hourLabel(start)}–${hourLabel(hour + 1)}`);
                start = null;
            }
        });

    return ranges.join(', ');
}

/**
 * The week in one line, days with the same hours together:
 * "Lun–Ven 12:00–18:00 · Sab 09:00–12:00".
 */
export function weekRangesLabel(hours: number[][]): string {
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
    /** "Tutto salvato", "Modifiche non salvate"… */
    status: string;
    changed: boolean;
    saving: boolean;
};

/**
 * "Così funziona per i clienti": the black panel of "Disponibilità" with
 * the week and the rules in words, and the save button of the page (a
 * submit button of its form).
 */
export default function AvailabilitySummary({
    availability,
    status,
    changed,
    saving,
}: AvailabilitySummaryProps) {
    const { hours, autoConfirm } = availability;
    const total = weeklyHours(hours);
    const activeDays = hours.filter((dayHours) => dayHours.length > 0).length;

    return (
        <section
            aria-labelledby="availability-summary-title"
            className="flex flex-col gap-4.5 rounded-3xl bg-sidebar p-5.5 text-sidebar-foreground"
        >
            <div className="flex flex-col gap-1.5">
                <h2
                    id="availability-summary-title"
                    className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted-foreground"
                >
                    COSÌ FUNZIONA PER I CLIENTI
                </h2>
                <span className="text-[30px] leading-9 font-bold tracking-[-0.03em] tabular-nums">
                    {formatHours(total)} a settimana
                </span>
                <span className="text-sm text-sidebar-foreground/80 tabular-nums">
                    {weekRangesLabel(hours)}
                </span>
            </div>

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
                        {autoConfirm ? 'Automatica' : 'Manuale'}
                    </dd>
                </div>
            </dl>

            <ul className="flex flex-col gap-3">
                {ruleSentences(availability).map((sentence) => (
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

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border pt-4">
                <span
                    role="status"
                    className="flex items-center gap-2 text-[13px] leading-4.5 text-sidebar-foreground/80"
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'size-2 rounded-full',
                            changed
                                ? 'bg-sidebar-primary'
                                : 'bg-muted-foreground',
                        )}
                    />
                    {status}
                </span>
                <Button
                    type="submit"
                    disabled={!changed || saving}
                    className="h-11 rounded-xl bg-sidebar-primary px-4.5 font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90 disabled:bg-sidebar-border disabled:text-muted-foreground disabled:opacity-100"
                >
                    {saving && <Spinner />}
                    Salva modifiche
                </Button>
            </div>
        </section>
    );
}
