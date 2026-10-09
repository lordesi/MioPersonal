/**
 * The trainer's answers in steps 2–7 of the registration.
 * TODO: send them to the server once the trainer tables exist; today only
 * the account (step 1) is saved.
 */
export type TrainerDraft = {
    headline: string;
    bio: string;
    experience: string;
    disciplines: string[];
    places: PlaceType[];
    studios: { name: string; address: string }[];
    zones: string[];
    services: { name: string; minutes: number; priceCents: number | null }[];
    /** Working hours by day (0 = Monday … 6 = Sunday), whole hours from 7 to 20. */
    hours: number[][];
    rules: {
        noticeHours: number;
        bookingWindowDays: number;
        breakMinutes: number;
        travelMinutes: number;
        maxSessionsPerDay: number;
        freeCancellationHours: number;
    };
    durations: { one: boolean; two: boolean };
    autoConfirm: boolean;
    certifications: { title: string; issuer: string; year: string }[];
};

export type PlaceType = 'studio' | 'home' | 'park' | 'online';

export const MAX_DISCIPLINES = 5;

export const disciplineOptions = [
    'Functional',
    'Pesi e bodybuilding',
    'Pilates',
    'Yoga',
    'Crossfit',
    'Preparazione atletica',
    'Boxe',
    'Calisthenics',
    'Postura',
    'Running',
];

export const zoneOptions = [
    'Centro',
    'Brera',
    'Isola',
    'Porta Venezia',
    'Città Studi',
    'Lambrate',
    'Navigli',
    'Porta Romana',
    'CityLife',
    'San Siro',
    'Bicocca',
    'Monza',
    'Sesto San Giovanni',
    'Rho',
];

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

export const experienceOptions = [
    'Meno di 2 anni',
    'Da 2 a 5 anni',
    'Da 5 a 10 anni',
    'Più di 10 anni',
];

export const serviceMinuteOptions = [30, 45, 60, 90, 120];

/** Starting values: the same examples the design shows. */
export const initialDraft: TrainerDraft = {
    headline: '',
    bio: '',
    experience: 'Da 2 a 5 anni',
    disciplines: [],
    places: [],
    studios: [{ name: '', address: '' }],
    zones: [],
    services: [{ name: 'Seduta singola', minutes: 60, priceCents: null }],
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
        travelMinutes: 30,
        maxSessionsPerDay: 6,
        freeCancellationHours: 24,
    },
    durations: { one: true, two: true },
    autoConfirm: false,
    certifications: [{ title: '', issuer: '', year: '' }],
};

/** Lowest price among the services, in cents, or null when none is set. */
export function minPriceCents(draft: TrainerDraft): number | null {
    const prices = draft.services
        .map((service) => service.priceCents)
        .filter((price): price is number => price !== null && price > 0);

    return prices.length > 0 ? Math.min(...prices) : null;
}

/** Total working hours in a week. */
export function weeklyHours(draft: TrainerDraft): number {
    return draft.hours.reduce((total, day) => total + day.length, 0);
}
