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
    rules: {
        noticeHours: number;
        bookingWindowDays: number;
        breakMinutes: number;
        /** null = "Nessun limite". */
        maxSessionsPerDay: number | null;
        freeCancellationHours: number;
    };
    /** "Durate prenotabili" in minutes, e.g. [60, 120]: see SESSION_MINUTES. */
    sessionMinutes: number[];
    autoConfirm: boolean;
    certifications: Certification[];
};

/**
 * Step 4. Prices in whole cents; null = not written yet. Saved as rows of
 * `services` by SaveTrainerProfile::saveServices().
 */
export type Pricing = {
    /** "Seduta singola": price per hour, bookable in every duration of step 5. */
    hourlyCents: number | null;
    singleNote: string;
    /** Online at the same price, or at its own hourly price ("Seduta online"). */
    onlineSamePrice: boolean;
    onlineHourlyCents: number | null;
    onlineNote: string;
    /** Optional, fixed duration; 0 = "Gratis". */
    firstSession: {
        enabled: boolean;
        name: string;
        minutes: number;
        priceCents: number | null;
        note: string;
    };
    /** At most MAX_PACKAGES; priceCents is the total. */
    packages: PricePackage[];
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
export const BIO_MIN = 150;
export const BIO_MAX = 800;
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
export const MAX_PACKAGES = 3;
export const NOTE_MAX = 200;
export const MAX_HOURLY_CENTS = 100000;
export const MAX_PACKAGE_CENTS = 1000000;
export const PACKAGE_SESSIONS = { min: 2, max: 50 };

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
        hourlyCents: null,
        singleNote: '',
        onlineSamePrice: true,
        onlineHourlyCents: null,
        onlineNote: '',
        firstSession: {
            enabled: false,
            name: 'Prima seduta',
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
    sessionMinutes: [60, 120],
    autoConfirm: false,
    certifications: [{ title: '', issuer: '', year: '' }],
};

/** The "da X €" of the search: the lowest hourly price, or null. */
export function minPriceCents(draft: TrainerDraft): number | null {
    const prices = [
        draft.pricing.hourlyCents,
        hasOwnOnlinePrice(draft) ? draft.pricing.onlineHourlyCents : null,
    ].filter((price): price is number => price !== null && price > 0);

    return prices.length > 0 ? Math.min(...prices) : null;
}

/** The online price question makes sense only for who trains both online and in person. */
export function asksOnlinePrice(draft: TrainerDraft): boolean {
    return draft.places.includes('online') && needsCity(draft);
}

/** "Seduta online" with its own hourly price. */
export function hasOwnOnlinePrice(draft: TrainerDraft): boolean {
    return asksOnlinePrice(draft) && !draft.pricing.onlineSamePrice;
}

const inRange = (cents: number | null, min: number, max: number) =>
    cents !== null && cents >= min && cents <= max;

/** Step 4 can continue: hourly price, and every optional part complete. */
export function isPricingComplete(draft: TrainerDraft): boolean {
    const { pricing } = draft;

    return (
        inRange(pricing.hourlyCents, 100, MAX_HOURLY_CENTS) &&
        (!hasOwnOnlinePrice(draft) ||
            inRange(pricing.onlineHourlyCents, 100, MAX_HOURLY_CENTS)) &&
        (!pricing.firstSession.enabled ||
            (pricing.firstSession.name.trim() !== '' &&
                inRange(
                    pricing.firstSession.priceCents,
                    0,
                    MAX_HOURLY_CENTS,
                ))) &&
        pricing.packages.every(
            (item) =>
                item.sessions >= PACKAGE_SESSIONS.min &&
                item.sessions <= PACKAGE_SESSIONS.max &&
                inRange(item.priceCents, 100, MAX_PACKAGE_CENTS),
        )
    );
}

/** How many services the profile will show (single, online, first session, packages). */
export function serviceCount(draft: TrainerDraft): number {
    return (
        1 +
        Number(hasOwnOnlinePrice(draft)) +
        Number(draft.pricing.firstSession.enabled) +
        draft.pricing.packages.length
    );
}

/** Online-only trainers don't need a city. */
export function needsCity(draft: TrainerDraft): boolean {
    return draft.places.some((place) => place !== 'online');
}

/** Total working hours in a week. */
export function weeklyHours(draft: TrainerDraft): number {
    return draft.hours.reduce((total, day) => total + day.length, 0);
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
function isFilled(certification: Certification): boolean {
    return (
        certification.title.trim() !== '' ||
        certification.issuer.trim() !== '' ||
        certification.year.trim() !== '' ||
        !!certification.file
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
        hourly_price_cents: draft.pricing.hourlyCents ?? '',
        single_note: draft.pricing.singleNote,
        // Only when online has its own price: otherwise "Seduta singola" covers it.
        ...(hasOwnOnlinePrice(draft)
            ? {
                  online_price_cents: draft.pricing.onlineHourlyCents ?? '',
                  online_note: draft.pricing.onlineNote,
              }
            : {}),
        ...(draft.pricing.firstSession.enabled
            ? {
                  first_session: {
                      name: draft.pricing.firstSession.name,
                      minutes: draft.pricing.firstSession.minutes,
                      price_cents: draft.pricing.firstSession.priceCents ?? '',
                      note: draft.pricing.firstSession.note,
                  },
              }
            : {}),
        packages: draft.pricing.packages.map((item) => ({
            sessions: item.sessions,
            minutes: item.minutes,
            price_cents: item.priceCents ?? '',
            note: item.note,
        })),
        hours: draft.hours,
        notice_hours: draft.rules.noticeHours,
        booking_window_days: draft.rules.bookingWindowDays,
        break_minutes: draft.rules.breakMinutes,
        // '' = "Nessun limite" (the server reads it as null).
        max_sessions_per_day: draft.rules.maxSessionsPerDay ?? '',
        free_cancellation_hours: draft.rules.freeCancellationHours,
        session_minutes: draft.sessionMinutes,
        auto_confirm: draft.autoConfirm,
        certifications: draft.certifications.filter(isFilled).map((item) => ({
            id: item.id ?? '',
            title: item.title,
            issuer: item.issuer,
            year: item.year,
            file: item.file ?? null,
        })),
    };
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
    ['hourly_price_cents', 4],
    ['single_note', 4],
    ['online_', 4],
    ['first_session', 4],
    ['packages', 4],
    ['hours', 5],
    ['notice_hours', 5],
    ['booking_window_days', 5],
    ['break_minutes', 5],
    ['max_sessions_per_day', 5],
    ['free_cancellation_hours', 5],
    ['session_minutes', 5],
    ['auto_confirm', 5],
    ['certifications', 6],
];

/** Account fields (step 1) and anything unknown stay on step 1. */
export function stepOfField(field: string): number {
    return fieldSteps.find(([prefix]) => field.startsWith(prefix))?.[1] ?? 1;
}
