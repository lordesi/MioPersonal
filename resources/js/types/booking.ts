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
    trainerFirstName: string;
    trainerHref: string;
    discipline: string;
    /** ISO UTC string. */
    start: string;
    hours: number;
    placeLabel: string;
    status: 'confirmed';
    /** ISO UTC string: after this moment cancelling is no longer free. */
    freeCancellationUntil: string;
};

/** The request just sent, on the "Prenotazione inviata" page. */
export type SentBooking = {
    id: number;
    /** 'confirmed' when the trainer confirms automatically. */
    status: 'pending' | 'confirmed';
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
    /** 'declined' = refused by the trainer, 'expired' = no answer in time. */
    status: 'pending' | 'expired' | 'declined';
    /** ISO UTC string, null once expired or declined. */
    expiresAt: string | null;
};

export type ClientPackage = {
    id: number;
    name: string;
    trainerName: string;
    trainerHref: string;
    /** Counted from the package's bookings: see docs/database/analisi.md §3.4. */
    used: number;
    total: number;
};

export type FavoriteTrainer = {
    name: string;
    href: string;
    /** ISO UTC string of the first free slot, null without free slots. */
    nextSlotStart: string | null;
};

export type ClientPastSession = {
    id: number;
    trainerName: string;
    trainerHref: string;
    start: string;
    serviceName: string;
    review: { rating: number; text: string } | null;
};
