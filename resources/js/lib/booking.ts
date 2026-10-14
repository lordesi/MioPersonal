import { formatDuration, formatPrice } from '@/lib/format';
import type { AvailabilityDay, TrainerService } from '@/types';

/**
 * "Durate prenotabili" a trainer can offer, in minutes: from 30 minutes to
 * 3 hours. Same as TrainerProfile::SESSION_MINUTES.
 */
export const SESSION_MINUTES = [30, 60, 90, 120, 150, 180];

/** "45 €/ora" for hourly services, "30 €" for fixed ones, "Gratis" for 0. */
export function servicePriceLabel(service: TrainerService): string {
    if (service.priceCents === 0) {
        return 'Gratis';
    }

    const price = formatPrice(service.priceCents);

    return service.perHour ? `${price}/ora` : price;
}

/** Indicative total in cents for the chosen duration (whole cents). */
export function totalPriceCents(
    service: TrainerService,
    minutes: number,
): number {
    return service.perHour
        ? Math.round((service.priceCents * minutes) / 60)
        : service.priceCents;
}

/** The total as text: "67,50 €", or "Gratis" for a free first session. */
export function totalPriceLabel(
    service: TrainerService,
    minutes: number,
): string {
    const cents = totalPriceCents(service, minutes);

    return cents === 0 ? 'Gratis' : formatPrice(cents);
}

/** "1 ora e mezza · seduta singola" or "10 × 1 ora · pacchetto 10 sedute" */
export function serviceSummary(
    service: TrainerService,
    minutes: number,
): string {
    const duration = service.perHour
        ? formatDuration(minutes)
        : service.durationLabel;

    return `${duration} · ${service.name.toLowerCase()}`;
}

/** Start times of a day that can host a session of `minutes`. */
export function freeStarts(day: AvailabilityDay, minutes: number): string[] {
    return day.slots
        .filter((slot) => slot.maxMinutes >= minutes)
        .map((slot) => slot.start);
}

/** Split the availability into weeks of 7 days. */
export function toWeeks(days: AvailabilityDay[]): AvailabilityDay[][] {
    const weeks: AvailabilityDay[][] = [];

    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return weeks;
}
