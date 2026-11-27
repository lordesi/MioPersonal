import type {
    PricePackage,
    Pricing,
    SessionType,
} from '@/components/onboarding/trainer/draft';

/**
 * The calculations of "Servizi e prezzi", without the screen: columns of
 * the price list and package savings.
 */

/** "Prima seduta per nuovi clienti": not offered, free or at a lower price. */
export type FirstSessionMode = 'off' | 'free' | 'paid';

/** The chips of the sessions of a package, as in the design. */
export const PACKAGE_SESSION_OPTIONS = [5, 10, 20];

/** The name of a kind of session still without one. */
export const NEW_SESSION_NAME = 'Nuovo tipo di seduta';

/** 30 → "30 min", 60 → "1 h", 90 → "1 h 30", 150 → "2 h 30": headers and chips. */
export function shortDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    if (hours === 0) {
        return `${minutes} min`;
    }

    return rest === 0 ? `${hours} h` : `${hours} h ${rest}`;
}

/** The mode of a saved first session (0 € = free). */
export function firstSessionMode(pricing: Pricing): FirstSessionMode {
    if (!pricing.firstSession.enabled) {
        return 'off';
    }

    return pricing.firstSession.priceCents === 0 ? 'free' : 'paid';
}

/**
 * The chips of a choice, plus the saved value when it isn't one of them
 * (e.g. a package of 8 sessions made in the registration): nothing is lost.
 */
export function withCurrent(options: number[], current: number): number[] {
    return options.includes(current)
        ? options
        : [...options, current].sort((a, b) => a - b);
}

/** A kind of session without these minutes, online price too. */
export function removeDuration(
    session: SessionType,
    minutes: number,
): SessionType {
    return {
        ...session,
        prices: session.prices.filter((price) => price.minutes !== minutes),
        online: session.online.filter((price) => price.minutes !== minutes),
    };
}

/**
 * A package compared with its sessions bought one by one, at the lowest
 * price of a kind of session of the same duration (null: no price yet).
 */
export function packageComparison(
    item: PricePackage,
    sessions: SessionType[],
): { separateCents: number | null; savingCents: number; percent: number } {
    const prices = sessions
        .flatMap((session) => session.prices)
        .filter((price) => price.minutes === item.minutes)
        .map((price) => price.priceCents)
        .filter((cents): cents is number => cents !== null && cents > 0);
    const separateCents =
        prices.length > 0 ? Math.min(...prices) * item.sessions : null;
    const savingCents =
        separateCents !== null &&
        item.priceCents !== null &&
        item.priceCents < separateCents
            ? separateCents - item.priceCents
            : 0;

    return {
        separateCents,
        savingCents,
        percent:
            separateCents !== null && savingCents > 0
                ? Math.round((savingCents / separateCents) * 100)
                : 0,
    };
}
