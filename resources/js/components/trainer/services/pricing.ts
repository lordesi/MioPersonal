import type {
    PricePackage,
    Pricing,
    SessionType,
} from '@/components/onboarding/trainer/draft';
import { onlinePrices } from '@/components/onboarding/trainer/draft';
import { formatDuration, formatPrice } from '@/lib/format';

/**
 * The calculations of "Servizi e prezzi", without the screen: columns of
 * the price list, package savings, the rows of the preview.
 */

/** "Prima seduta per nuovi clienti": not offered, free or at a lower price. */
export type FirstSessionMode = 'off' | 'free' | 'paid';

/** The chips of the first session and of the packages, as in the design. */
export const FIRST_SESSION_MINUTES = [30, 60];
export const PACKAGE_SESSION_OPTIONS = [5, 10, 20];
export const PACKAGE_MINUTES = [60, 90, 120];

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

/** The columns at the start: every duration with a price, "1 h" when none. */
export function initialColumns(pricing: Pricing): number[] {
    const minutes = new Set(
        pricing.sessions.flatMap((session) =>
            session.prices.map((price) => price.minutes),
        ),
    );

    return minutes.size > 0 ? [...minutes].sort((a, b) => a - b) : [60];
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

/** A row of "Così ti vedono i clienti". */
export type PreviewRow = {
    key: string;
    name: string;
    /** "Nuovi clienti", "Risparmi 20%". */
    badge?: string;
    meta: string;
    price: string;
};

/**
 * "50 €" for one duration, "da 50 €" for more, or "Prezzo da impostare"
 * while no price is written.
 */
function fromPrice(cents: (number | null)[]): string {
    const prices = cents.filter((price): price is number => price !== null);

    if (prices.length === 0) {
        return 'Prezzo da impostare';
    }

    const lowest = formatPrice(Math.min(...prices));

    return cents.length > 1 ? `da ${lowest}` : lowest;
}

/**
 * The services as clients will see them, in the order of the profile: the
 * first session, each kind of session (and its online prices), the packages.
 * A kind of session without durations doesn't show up.
 */
export function previewRows(
    pricing: Pricing,
    firstMode: FirstSessionMode,
    ownOnline: boolean,
): PreviewRow[] {
    const rows: PreviewRow[] = [];
    const first = pricing.firstSession;

    if (firstMode !== 'off') {
        rows.push({
            key: 'first',
            name: 'Prima seduta',
            badge: 'Nuovi clienti',
            meta: `${formatDuration(first.minutes)} · solo per chi prenota la prima volta`,
            price:
                firstMode === 'free'
                    ? 'Gratuita'
                    : first.priceCents
                      ? formatPrice(first.priceCents)
                      : 'Prezzo da impostare',
        });
    }

    pricing.sessions.forEach((session, index) => {
        if (session.prices.length === 0) {
            return;
        }

        const name = session.name.trim() || NEW_SESSION_NAME;
        const durations = session.prices
            .map((price) => shortDuration(price.minutes))
            .join(' · ');
        const meta = (note: string) =>
            note.trim() ? `${durations} · ${note.trim()}` : durations;

        rows.push({
            key: `session-${index}`,
            name,
            meta: meta(session.note),
            price: fromPrice(session.prices.map((price) => price.priceCents)),
        });

        if (ownOnline) {
            rows.push({
                key: `online-${index}`,
                name: `${name} (online)`,
                meta: meta(session.onlineNote),
                price: fromPrice(
                    onlinePrices(session).map((price) => price.priceCents),
                ),
            });
        }
    });

    pricing.packages.forEach((item, index) => {
        const { savingCents, percent } = packageComparison(
            item,
            pricing.sessions,
        );

        rows.push({
            key: `package-${index}`,
            name: `Pacchetto ${item.sessions} sedute da ${formatDuration(item.minutes)}`,
            badge: savingCents > 0 ? `Risparmi ${percent}%` : undefined,
            meta: item.priceCents
                ? `${formatPrice(Math.round(item.priceCents / item.sessions))} a seduta`
                : 'Prezzo da impostare',
            price: item.priceCents ? formatPrice(item.priceCents) : '—',
        });
    });

    return rows;
}
