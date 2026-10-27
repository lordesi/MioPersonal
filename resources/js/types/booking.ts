export type BookingStatus =
    | 'pending'
    | 'confirmed'
    | 'declined'
    | 'cancelled'
    | 'expired'
    | 'completed';

/** A confirmed session not over yet: "La tua prossima seduta" and "Più avanti". */
export type ClientUpcomingBooking = {
    id: number;
    trainerName: string;
    trainerFirstName: string;
    trainerHref: string;
    discipline: string;
    /** "Seduta singola", or "Pacchetto 10 sedute · seduta 1 di 10". */
    serviceLabel: string;
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

/** "Il tuo pacchetto": counted from its bookings, see docs/database/analisi.md §3.4. */
export type ClientPackage = {
    id: number;
    name: string;
    trainerName: string;
    trainerHref: string;
    total: number;
    /** Sessions done. */
    done: number;
    /** Sessions that take a place: done, confirmed or waiting for an answer. */
    booked: number;
};

/** A row of "I tuoi trainer". */
export type ClientTrainer = {
    name: string;
    firstName: string;
    /** For the heart: the favorites are saved by slug. */
    slug: string;
    href: string;
    /** Sessions done together, "5 sedute insieme". */
    sessionsDone: number;
    /** The first discipline, shown for the trainers already booked. */
    discipline: string | null;
    favorite: boolean;
    /** At least one confirmed session with this trainer. */
    booked: boolean;
};

/** A session done, in "Sedute svolte". */
export type ClientPastSession = {
    id: number;
    trainerName: string;
    trainerFirstName: string;
    trainerHref: string;
    discipline: string;
    /** ISO UTC string. */
    start: string;
    hours: number;
    serviceName: string;
    /** The client's review, null until it is written. */
    review: { rating: number; text: string } | null;
    /** "Lascia una recensione": not reviewed yet and not marked "Saltata". */
    canReview: boolean;
};
