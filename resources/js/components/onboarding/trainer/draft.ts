import type { BookingRules } from '@/types';

/**
 * The trainer's answers in steps 2–7 of the registration, sent all together
 * at the end (see toPayload). When the trainer fixes the profile, the page
 * starts from the saved one.
 */
export type TrainerDraft = {
    headline: string;
    bio: string;
    /** '' until the trainer chooses. */
    experience: Experience | '';
    /** A new profile photo chosen in step 2. */
    photo: File | null;
    /** The photo already saved, shown until a new one is chosen. */
    photoUrl: string | null;
    /** Discipline slugs from the catalog. */
    disciplines: string[];
    places: PlaceType[];
    studios: { name: string; address: string }[];
    /** Slug of the main city ('' = not chosen yet). Not needed for online only. */
    city: string;
    /** Other cities where the trainer goes (home and park sessions). */
    otherCities: string[];
    /** Step 4 "Servizi e prezzi". */
    pricing: Pricing;
    /** Working hours by day (0 = Monday … 6 = Sunday), start hours from 6 to 23. */
    hours: number[][];
    rules: BookingRules;
    autoConfirm: boolean;
    certifications: Certification[];
};

/**
 * Step 4. Prices in whole cents; null = not written yet. Saved as rows of
 * `services` by SaveTrainerServices.
 */
export type Pricing = {
    /**
     * The kinds of session ("Seduta singola", "Calisthenics"…), at least
     * one and at most MAX_SESSION_TYPES, each with its own name and prices.
     */
    sessions: SessionType[];
    /** Online at the same prices, or each kind at its own online prices. */
    onlineSamePrice: boolean;
    /**
     * Optional, fixed duration; 0 = "Gratis". Always called "Prima seduta",
     * only for a client's first booking with the trainer.
     */
    firstSession: {
        enabled: boolean;
        minutes: number;
        priceCents: number | null;
        note: string;
    };
    /** At most MAX_PACKAGES; priceCents is the total. */
    packages: PricePackage[];
};

/**
 * A kind of session: the durations the client can choose, each with its own
 * price (30 minutes is not half of an hour), shortest first.
 */
export type SessionType = {
    /** Free text, "Seduta singola" for the first one. */
    name: string;
    prices: DurationPrice[];
    note: string;
    /** The online prices by duration; only those of `prices` are sent. */
    online: DurationPrice[];
    onlineNote: string;
};

/** A duration of a kind of session (see SESSION_MINUTES) and its price. */
export type DurationPrice = {
    minutes: number;
    priceCents: number | null;
};

export type PricePackage = {
    sessions: number;
    minutes: number;
    priceCents: number | null;
    note: string;
};

export type Certification = {
    /** Set for a certification already sent: its file is kept. */
    id?: number;
    title: string;
    issuer: string;
    year: string;
    /** A new certificate file (PDF or photo). */
    file?: File | null;
    /** The certification already has a file on the server. */
    hasFile?: boolean;
};

export type Experience = 'lt2' | '2to5' | '5to10' | 'gt10';

export type PlaceType = 'studio' | 'home' | 'park' | 'online';

/** Limits, the same as in TrainerProfileRequest. */
export const MAX_DISCIPLINES = 5;
export const MAX_STUDIOS = 3;
export const MAX_OTHER_CITIES = 2;
export const MAX_CERTIFICATIONS = 3;
export const HEADLINE_MAX = 60;
export const BIO_MIN = 60;
export const BIO_MAX = 500;
/** Certifications: from this year to the current one. */
export const FIRST_CERTIFICATION_YEAR = 1950;

export const placeOptions: {
    value: PlaceType;
    label: string;
    hint: string;
    short: string;
}[] = [
    {
        value: 'studio',
        label: 'Studio o palestra',
        hint: 'Uno o più indirizzi',
        short: 'Studio',
    },
    {
        value: 'home',
        label: 'A domicilio',
        hint: 'Vai tu dal cliente',
        short: 'Domicilio',
    },
    { value: 'park', label: 'Al parco', hint: 'All’aperto', short: 'Parco' },
    {
        value: 'online',
        label: 'Online',
        hint: 'In videochiamata',
        short: 'Online',
    },
];

export const experienceOptions: { value: Experience; label: string }[] = [
    { value: 'lt2', label: 'Meno di 2 anni' },
    { value: '2to5', label: 'Da 2 a 5 anni' },
    { value: '5to10', label: 'Da 5 a 10 anni' },
    { value: 'gt10', label: 'Più di 10 anni' },
];

/** Step 4, as in TrainerProfileRequest. */
export const MAX_SESSION_TYPES = 5;
export const SESSION_NAME_MAX = 60;
/** The name of the first session, not one of the kinds of session. */
export const FIRST_SESSION_NAME = 'Prima seduta';
export const MAX_PACKAGES = 3;
export const NOTE_MAX = 200;
/** Every price: up to 10.000 €, in cents. */
export const MAX_PRICE_CENTS = 1000000;
export const PACKAGE_SESSIONS = { min: 2, max: 50 };

export const firstSessionType: SessionType = {
    name: 'Seduta singola',
    prices: [{ minutes: 60, priceCents: null }],
    note: '',
    online: [],
    onlineNote: '',
};

export const emptyPackage: PricePackage = {
    sessions: 10,
    minutes: 60,
    priceCents: null,
    note: '',
};

/** Starting values: the same examples the design shows. */
export const initialDraft: TrainerDraft = {
    headline: '',
    bio: '',
    experience: '',
    photo: null,
    photoUrl: null,
    disciplines: [],
    places: [],
    studios: [{ name: '', address: '' }],
    city: '',
    otherCities: [],
    pricing: {
        sessions: [firstSessionType],
        onlineSamePrice: true,
        firstSession: {
            enabled: false,
            minutes: 60,
            priceCents: null,
            note: '',
        },
        packages: [],
    },
    hours: [
        [7, 8, 9, 10, 11, 18, 19, 20],
        [12, 13, 14, 15, 16, 17, 18, 19, 20],
        [7, 8, 9, 10, 11, 18, 19, 20],
        [12, 13, 14, 15, 16, 17, 18, 19, 20],
        [7, 8, 9, 10, 11, 12],
        [8, 9, 10, 11, 12, 13],
        [],
    ],
    rules: {
        noticeHours: 12,
        bookingWindowDays: 60,
        breakMinutes: 15,
        maxSessionsPerDay: 6,
        freeCancellationHours: 24,
    },
    autoConfirm: false,
    certifications: [{ title: '', issuer: '', year: '' }],
};

/** The "da X €" of the search: the lowest price of a session, or null. */
export function minPriceCents(draft: TrainerDraft): number | null {
    const prices = draft.pricing.sessions
        .flatMap((session) => [
            ...session.prices,
            ...(hasOwnOnlinePrice(draft) ? onlinePrices(session) : []),
        ])
        .map((item) => item.priceCents)
        .filter((price): price is number => price !== null && price > 0);

    return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * The online prices for the durations of a kind of session (the same
 * durations, each with its own online price; null = not written yet).
 */
export function onlinePrices(session: SessionType): DurationPrice[] {
    return session.prices.map(({ minutes }) => ({
        minutes,
        priceCents:
            session.online.find((item) => item.minutes === minutes)
                ?.priceCents ?? null,
    }));
}

/** The same name, ignoring spaces at the ends and capitals. */
export function sameName(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * The problem with the name of a kind of session, or null: required,
 * not "Prima seduta" and not the name of a kind before it.
 */
export function sessionNameError(
    sessions: SessionType[],
    index: number,
): string | null {
    const name = sessions[index].name;

    if (name.trim() === '') {
        return 'Scrivi il nome del servizio.';
    }

    if (sameName(name, FIRST_SESSION_NAME)) {
        return `«${FIRST_SESSION_NAME}» è già il nome della prima seduta: scegline un altro.`;
    }

    if (sessions.some((other, i) => i < index && sameName(other.name, name))) {
        return 'C’è già un servizio con questo nome.';
    }

    return null;
}

/** The online price question makes sense only for who trains both online and in person. */
export function asksOnlinePrice(draft: TrainerDraft): boolean {
    return draft.places.includes('online') && needsCity(draft);
}

/** "Seduta online" with its own prices. */
export function hasOwnOnlinePrice(draft: TrainerDraft): boolean {
    return asksOnlinePrice(draft) && !draft.pricing.onlineSamePrice;
}

const inRange = (cents: number | null, min: number, max: number) =>
    cents !== null && cents >= min && cents <= max;

/** Step 4 can continue: a price for each duration, and every optional part complete. */
export function isPricingComplete(draft: TrainerDraft): boolean {
    return isPricingValid(draft.pricing, hasOwnOnlinePrice(draft));
}

/**
 * The same check on the prices alone ("Servizi" in the trainer area).
 * ownOnline: online has its own prices (see hasOwnOnlinePrice).
 */
export function isPricingValid(pricing: Pricing, ownOnline: boolean): boolean {
    const allPriced = (prices: DurationPrice[]) =>
        prices.every((item) => inRange(item.priceCents, 100, MAX_PRICE_CENTS));

    return (
        pricing.sessions.length > 0 &&
        pricing.sessions.every(
            (session, index) =>
                sessionNameError(pricing.sessions, index) === null &&
                session.prices.length > 0 &&
                allPriced(session.prices) &&
                (!ownOnline || allPriced(onlinePrices(session))),
        ) &&
        (!pricing.firstSession.enabled ||
            inRange(pricing.firstSession.priceCents, 0, MAX_PRICE_CENTS)) &&
        pricing.packages.every(
            (item) =>
                item.sessions >= PACKAGE_SESSIONS.min &&
                item.sessions <= PACKAGE_SESSIONS.max &&
                inRange(item.priceCents, 100, MAX_PRICE_CENTS),
        )
    );
}

/** How many services the profile will show (kinds of session and their online prices, first session, packages). */
export function serviceCount(draft: TrainerDraft): number {
    return (
        draft.pricing.sessions.length * (hasOwnOnlinePrice(draft) ? 2 : 1) +
        Number(draft.pricing.firstSession.enabled) +
        draft.pricing.packages.length
    );
}

/** Online-only trainers don't need a city. */
export function needsCity(draft: TrainerDraft): boolean {
    return draft.places.some((place) => place !== 'online');
}

/** Total working hours in a week. */
export function weeklyHours(hours: number[][]): number {
    return hours.reduce((total, day) => total + day.length, 0);
}

/** Step 2: photo (new or already saved), headline, bio and experience. */
export function isProfileComplete(draft: TrainerDraft): boolean {
    return (
        (draft.photo !== null || draft.photoUrl !== null) &&
        draft.headline.trim() !== '' &&
        draft.bio.trim().length >= BIO_MIN &&
        draft.experience !== ''
    );
}

/** Empty or a real year, from 1950 to this year. */
export function isValidYear(year: string): boolean {
    if (year === '') {
        return true;
    }

    const value = Number(year);

    return (
        /^\d{4}$/.test(year) &&
        value >= FIRST_CERTIFICATION_YEAR &&
        value <= new Date().getFullYear()
    );
}

/** Empty certification rows are not sent. */
export function isFilled(certification: Certification): boolean {
    return (
        certification.title.trim() !== '' ||
        certification.issuer.trim() !== '' ||
        certification.year.trim() !== '' ||
        !!certification.file
    );
}

/**
 * A certification is all or nothing: an empty row is skipped, a started one
 * needs title, issuer and year (the certificate file stays optional).
 */
export function isCertificationValid(certification: Certification): boolean {
    if (!isFilled(certification)) {
        return true;
    }

    return (
        certification.title.trim() !== '' &&
        certification.issuer.trim() !== '' &&
        certification.year !== '' &&
        isValidYear(certification.year)
    );
}

/**
 * The fields sent to the server (TrainerProfileRequest), in snake_case.
 * Studios count only when "Studio o palestra" is chosen.
 */
export function toPayload(draft: TrainerDraft) {
    return {
        headline: draft.headline,
        bio: draft.bio,
        experience: draft.experience,
        photo: draft.photo,
        disciplines: draft.disciplines,
        places: draft.places,
        studios: draft.places.includes('studio') ? draft.studios : [],
        city: needsCity(draft) ? draft.city : '',
        other_cities: needsCity(draft) ? draft.otherCities : [],
        ...toServicesPayload(draft.pricing, hasOwnOnlinePrice(draft)),
        hours: draft.hours,
        notice_hours: draft.rules.noticeHours,
        booking_window_days: draft.rules.bookingWindowDays,
        break_minutes: draft.rules.breakMinutes,
        // '' = "Nessun limite" (the server reads it as null).
        max_sessions_per_day: draft.rules.maxSessionsPerDay ?? '',
        free_cancellation_hours: draft.rules.freeCancellationHours,
        auto_confirm: draft.autoConfirm,
        certifications: draft.certifications.filter(isFilled).map((item) => ({
            id: item.id ?? '',
            title: item.title,
            issuer: item.issuer,
            year: item.year,
            file: item.file ?? null,
            // The ✕ next to a certificate already sent: its file goes.
            remove_file:
                item.id !== undefined && !item.hasFile && !item.file ? 1 : 0,
        })),
    };
}

/**
 * The fields of step 4 (servicesRules() in TrainerProfileRequest), also sent
 * alone by "Servizi". ownOnline: online has its own prices.
 */
export function toServicesPayload(pricing: Pricing, ownOnline: boolean) {
    return {
        sessions: pricing.sessions.map((session) => ({
            name: session.name,
            prices: pricesPayload(session.prices),
            note: session.note,
            // Only when online has its own prices: otherwise the same prices cover it.
            ...(ownOnline
                ? {
                      online_prices: pricesPayload(onlinePrices(session)),
                      online_note: session.onlineNote,
                  }
                : {}),
        })),
        ...(pricing.firstSession.enabled
            ? {
                  first_session: {
                      minutes: pricing.firstSession.minutes,
                      price_cents: pricing.firstSession.priceCents ?? '',
                      note: pricing.firstSession.note,
                  },
              }
            : {}),
        packages: pricing.packages.map((item) => ({
            sessions: item.sessions,
            minutes: item.minutes,
            price_cents: item.priceCents ?? '',
            note: item.note,
        })),
    };
}

/** Prices as the server reads them: [{ minutes: 60, price_cents: 4500 }]. */
function pricesPayload(prices: DurationPrice[]) {
    return prices.map((item) => ({
        minutes: item.minutes,
        price_cents: item.priceCents ?? '',
    }));
}

/**
 * "Modifica profilo" (TrainerProfileUpdateRequest): the same fields without
 * the services of step 4, changed from "Servizi", and hours and rules of
 * step 5, changed from "Disponibilità".
 */
export function toProfilePayload(draft: TrainerDraft) {
    const otherPageFields = new Set([
        'sessions',
        'first_session',
        'packages',
        'hours',
        'notice_hours',
        'booking_window_days',
        'break_minutes',
        'max_sessions_per_day',
        'free_cancellation_hours',
        'auto_confirm',
    ]);

    return Object.fromEntries(
        Object.entries(toPayload(draft)).filter(
            ([field]) => !otherPageFields.has(field),
        ),
    );
}

/** The step of each field, to open the first step with an error. */
const fieldSteps: [prefix: string, step: number][] = [
    ['headline', 2],
    ['bio', 2],
    ['experience', 2],
    ['photo', 2],
    ['disciplines', 3],
    ['places', 3],
    ['studios', 3],
    ['city', 3],
    ['other_cities', 3],
    ['sessions', 4],
    ['first_session', 4],
    ['packages', 4],
    ['hours', 5],
    ['notice_hours', 5],
    ['booking_window_days', 5],
    ['break_minutes', 5],
    ['max_sessions_per_day', 5],
    ['free_cancellation_hours', 5],
    ['auto_confirm', 5],
    ['certifications', 6],
];

/** Account fields (step 1) and anything unknown stay on step 1. */
export function stepOfField(field: string): number {
    return fieldSteps.find(([prefix]) => field.startsWith(prefix))?.[1] ?? 1;
}
