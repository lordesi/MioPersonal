export type BookingStatus =
    | 'pending'
    | 'confirmed'
    | 'declined'
    | 'cancelled'
    | 'expired'
    | 'completed';

/** A confirmed session in "Le mie prenotazioni" → "Prossime". */
export type ClientUpcomingBooking = {
    id: number;
    trainerName: string;
    trainerHref: string;
    trainerPhone: string;
    trainerEmail: string;
    discipline: string;
    /** ISO UTC string. */
    start: string;
    hours: number;
    placeLabel: string;
    status: 'confirmed';
    /** ISO UTC string: after this moment moving or cancelling is no longer free. */
    freeCancellationUntil: string;
};

/** The request just sent, on the "Prenotazione inviata" page. */
export type SentBooking = {
    id: number;
    status: 'pending';
    /** ISO UTC string. */
    start: string;
    hours: number;
    serviceName: string;
    placeLabel: string;
    priceCents: number;
    /** The trainer answers within this many hours, or the slot is freed. */
    confirmWithinHours: number;
    freeCancellationHours: number;
    trainer: {
        name: string;
        firstName: string;
        href: string;
        /** e.g. "Functional e Pilates · Città Studi" */
        subtitle: string;
    };
};

/** A request still waiting for the trainer, or one that expired unanswered. */
export type ClientPendingBooking = {
    id: number;
    trainerName: string;
    trainerFirstName: string;
    trainerHref: string;
    start: string;
    hours: number;
    serviceName: string;
    status: 'pending' | 'expired';
    /** ISO UTC string, null once expired. */
    expiresAt: string | null;
};

export type ClientPackage = {
    id: number;
    name: string;
    trainerName: string;
    trainerHref: string;
    used: number;
    total: number;
    /** Local date in Europe/Rome, "YYYY-MM-DD". */
    validUntil: string;
};

export type FavoriteTrainer = {
    name: string;
    href: string;
    /** ISO UTC string of the first free slot. */
    nextSlotStart: string;
};

export type ClientPastSession = {
    id: number;
    trainerName: string;
    trainerHref: string;
    start: string;
    serviceName: string;
    review: { rating: number; text: string } | null;
};
