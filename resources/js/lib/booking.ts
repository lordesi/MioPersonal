import { formatPrice } from '@/lib/format';
import type { AvailabilityDay, ServiceOption, TrainerService } from '@/types';

/**
 * The durations a trainer can offer, in minutes: from 30 minutes to
 * 3 hours. Same as TrainerProfile::SESSION_MINUTES.
 */
export const SESSION_MINUTES = [30, 60, 90, 120, 150, 180];

/** The durations of a service, shortest first. */
export function serviceDurations(service: TrainerService): number[] {
    return service.options.map((option) => option.minutes);
}

/** The option of the chosen duration (the first one if it isn't offered). */
export function serviceOption(
    service: TrainerService,
    minutes: number,
): ServiceOption {
    return (
        service.options.find((option) => option.minutes === minutes) ??
        service.options[0]
    );
}

/** "da 25 €" when the price depends on the duration, "30 €" otherwise, "Gratis" for 0. */
export function servicePriceLabel(service: TrainerService): string {
    if (service.packageId !== null) {
        return 'Incluso';
    }

    if (service.priceCents === 0) {
        return 'Gratis';
    }

    const price = formatPrice(service.priceCents);

    return service.options.length > 1 ? `da ${price}` : price;
}

/** "Invita un amico": how many people can come for that duration, the booker included. */
export function maxPeople(service: TrainerService, minutes: number): number {
    const option = serviceOption(service, minutes);

    return Math.max(1, ...option.groupPrices.map((price) => price.people));
}

/** The most people of any duration: "fino a 3 persone" on the service. */
export function serviceMaxPeople(service: TrainerService): number {
    return Math.max(
        1,
        ...service.options.flatMap((option) =>
            option.groupPrices.map((price) => price.people),
        ),
    );
}

/** Indicative total in cents for the chosen duration and people. */
export function totalPriceCents(
    service: TrainerService,
    minutes: number,
    people = 1,
): number {
    const option = serviceOption(service, minutes);

    if (people <= 1) {
        return option.priceCents;
    }

    return (
        option.groupPrices.find((price) => price.people === people)
            ?.priceCents ?? option.priceCents
    );
}

/** The total as text: "67,50 €", or "Gratis" for a free first session. */
export function totalPriceLabel(
    service: TrainerService,
    minutes: number,
    people = 1,
): string {
    if (service.packageId !== null) {
        return 'Incluso';
    }

    const cents = totalPriceCents(service, minutes, people);

    return cents === 0 ? 'Gratis' : formatPrice(cents);
}

/** "35 € a testa", for more people. */
export function perPersonLabel(cents: number, people: number): string {
    return `${formatPrice(Math.round(cents / people))} a testa`;
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
