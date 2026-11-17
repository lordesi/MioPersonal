/**
 * The gym form: "Registra la tua palestra" (5 steps) and "Modifica profilo"
 * of the gym area. Same limits as App\Http\Requests\GymProfileRequest.
 */

export const DESCRIPTION_MIN = 60;
export const DESCRIPTION_MAX = 1500;
export const MAX_RANGES_PER_DAY = 3;
export const MAX_REGISTRATION_PHOTOS = 6;

/** An opening range, "06:30"–"22:00"; "24:00" = midnight. */
export type OpeningRange = { opens: string; closes: string };

export type GymDraft = {
    name: string;
    /** City slug. */
    city: string;
    address: string;
    postalCode: string;
    description: string;
    /** App\Enums\GymAmenity values. */
    amenities: string[];
    /** Monday first: [] = closed. */
    hours: OpeningRange[][];
    openingNotes: string;
    /** A new cover; null keeps coverUrl. */
    cover: File | null;
    coverUrl: string | null;
    /** New gallery photos (registration only). */
    gallery: File[];
    galleryUrls: string[];
    contactPhone: string;
    contactEmail: string;
    website: string;
    instagram: string;
};

export const weekdays = [
    'Lunedì',
    'Martedì',
    'Mercoledì',
    'Giovedì',
    'Venerdì',
    'Sabato',
    'Domenica',
];

/** Monday to Friday 7–22, Saturday 9–18, Sunday closed: a usual week to start from. */
export const initialGymDraft: GymDraft = {
    name: '',
    city: '',
    address: '',
    postalCode: '',
    description: '',
    amenities: [],
    hours: [
        ...Array.from({ length: 5 }, () => [
            { opens: '07:00', closes: '22:00' },
        ]),
        [{ opens: '09:00', closes: '18:00' }],
        [],
    ],
    openingNotes: '',
    cover: null,
    coverUrl: null,
    gallery: [],
    galleryUrls: [],
    contactPhone: '',
    contactEmail: '',
    website: '',
    instagram: '',
};

/** Every half hour, "00:00" … "24:00". */
export const timeOptions: string[] = Array.from({ length: 49 }, (_, index) => {
    const hours = String(Math.floor(index / 2)).padStart(2, '0');

    return `${hours}:${index % 2 === 0 ? '00' : '30'}`;
});

/**
 * The range added by "+ Fascia": from the end of the last one (or 9:00),
 * four hours long.
 */
export function nextRange(ranges: OpeningRange[]): OpeningRange {
    const last = ranges.at(-1)?.closes;
    const opens = last && last < '23:00' ? last : '09:00';

    return {
        opens,
        closes: timeOptions[
            Math.min(timeOptions.indexOf(opens) + 8, timeOptions.length - 1)
        ],
    };
}

/** "Copia lunedì su martedì–venerdì". */
export function copyMondayToWeekdays(
    hours: OpeningRange[][],
): OpeningRange[][] {
    return hours.map((ranges, index) =>
        index > 0 && index < 5
            ? hours[0].map((range) => ({ ...range }))
            : ranges,
    );
}

/** "07:00 – 22:00, 15:00 – 21:00", or "Chiusa". */
export function dayLabel(ranges: OpeningRange[], dash = ' – '): string {
    if (ranges.length === 0) {
        return 'Chiusa';
    }

    return ranges
        .map((range) =>
            range.opens === '00:00' && range.closes === '24:00'
                ? '24 ore'
                : `${range.opens}${dash}${range.closes}`,
        )
        .join(', ');
}

/** "15 ore", "7,5 ore": the hours open in a day. */
export function dayLength(ranges: OpeningRange[]): string {
    const minutes = (time: string) => {
        const [hours, mins] = time.split(':').map(Number);

        return hours * 60 + mins;
    };
    const total = ranges.reduce(
        (sum, range) =>
            sum + Math.max(0, minutes(range.closes) - minutes(range.opens)),
        0,
    );
    const hours = total / 60;

    return `${String(hours).replace('.', ',')} ${hours === 1 ? 'ora' : 'ore'}`;
}

/**
 * The services in groups, only to show them (the server keeps a flat list,
 * App\Enums\GymAmenity). A value not listed here goes in the last group.
 */
export const amenityGroups: { title: string; values: string[] }[] = [
    {
        title: 'Allenamento',
        values: [
            'sala-pesi',
            'cardio',
            'corsi',
            'functional',
            'crossfit',
            'spinning',
            'yoga-pilates',
            'arti-marziali',
            'personal-training',
        ],
    },
    {
        title: 'Benessere',
        values: ['piscina', 'sauna', 'bagno-turco', 'spa'],
    },
    {
        title: 'Comodità',
        values: [
            'spogliatoi-docce',
            'parcheggio',
            'aperta-24h',
            'accessibile',
            'wifi',
        ],
    },
];

/** Every range opens before it closes and after the previous one. */
export function hoursAreValid(hours: OpeningRange[][]): boolean {
    return hours.every((ranges) =>
        ranges.every(
            (range, index) =>
                range.opens < range.closes &&
                (index === 0 || ranges[index - 1].closes <= range.opens),
        ),
    );
}

export const isDetailsComplete = (draft: GymDraft) =>
    draft.name.trim() !== '' &&
    draft.city !== '' &&
    draft.address.trim() !== '' &&
    (draft.postalCode === '' || /^\d{5}$/.test(draft.postalCode)) &&
    draft.description.trim().length >= DESCRIPTION_MIN &&
    draft.description.length <= DESCRIPTION_MAX;

export const isServicesComplete = (draft: GymDraft) =>
    draft.amenities.length > 0 && hoursAreValid(draft.hours);

/** The fields as the server reads them (GymProfileRequest). */
export function toGymPayload(draft: GymDraft, withGallery: boolean) {
    return {
        name: draft.name,
        city: draft.city,
        address: draft.address,
        postal_code: draft.postalCode,
        description: draft.description,
        amenities: draft.amenities,
        hours: draft.hours,
        opening_notes: draft.openingNotes,
        ...(draft.cover ? { cover: draft.cover } : {}),
        ...(withGallery && draft.gallery.length > 0
            ? { gallery: draft.gallery }
            : {}),
        contact_phone: draft.contactPhone,
        contact_email: draft.contactEmail,
        website: draft.website,
        instagram: draft.instagram,
    };
}

/** The step of each field, as GymRegistrationStepRequest. The rest is the account (1). */
const fieldSteps: Record<string, number> = {
    name: 2,
    city: 2,
    address: 2,
    postal_code: 2,
    description: 2,
    amenities: 3,
    hours: 3,
    opening_notes: 3,
    cover: 4,
    gallery: 4,
    contact_phone: 5,
    contact_email: 5,
    website: 5,
    instagram: 5,
};

/** "hours.2.0.opens" → 3. */
export function stepOfGymField(field: string): number {
    return fieldSteps[field.split('.')[0]] ?? 1;
}

/** The names of the 5 steps of "Registra la palestra". */
export const gymSteps = [
    'Account',
    'La palestra',
    'Servizi e orari',
    'Foto',
    'Contatti e invio',
];
