import { formatHours, formatPrice } from '@/lib/format';
import type { AvailabilityDay, TrainerService } from '@/types';

/** "45 €/ora" for hourly services, "30 €" for fixed ones. */
export function servicePriceLabel(service: TrainerService): string {
    const price = formatPrice(service.priceCents);

    return service.perHour ? `${price}/ora` : price;
}

/** Indicative total in cents for the chosen duration. */
export function totalPriceCents(
    service: TrainerService,
    hours: number,
): number {
    return service.perHour ? service.priceCents * hours : service.priceCents;
}

/** "1 ora · seduta singola" or "10 × 1 ora · pacchetto 10 sedute" */
export function serviceSummary(service: TrainerService, hours: number): string {
    const duration = service.perHour
        ? formatHours(hours)
        : service.durationLabel;

    return `${duration} · ${service.name.toLowerCase()}`;
}

/** Start times of a day that can host a session of `hours`. */
export function freeStarts(day: AvailabilityDay, hours: number): string[] {
    return day.slots
        .filter((slot) => slot.maxHours >= hours)
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
