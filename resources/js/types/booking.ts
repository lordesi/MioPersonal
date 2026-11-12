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
    /** "Sposta": the time the trainer proposes, until the client answers. */
    proposal: { start: string; hours: number; expiresAt: string } | null;
    group: BookingGroup | null;
};

/**
 * "Invita un amico": a session for more people, as the viewer sees it. The
 * booker shares the link and manages the friends; a friend can only leave.
 */
export type BookingGroup = {
    /** Who comes, the booker included. */
    people: number;
    /** The total for all of them. */
    priceCents: number;
    role: 'booker' | 'guest';
    /** "Marco R." */
    bookerName: string;
    /** Only for the booker, while friends can still join. */
    inviteUrl: string | null;
    freeSeats: number;
    /** The friends who joined. */
    guests: { id: number; name: string; isYou: boolean }[];
    /** "Quante persone": up to this many, while the booker can still change it; else null. */
    maxPeople: number | null;
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
    /** "Ripeti ogni settimana": `set` once the "sedute fisse" exist. */
    repeatWeekly: { label: string; set: boolean } | null;
    placeLabel: string;
    priceCents: number;
    /** "Invita un amico": a session for more people. */
    group: BookingGroup | null;
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
    /** "Ripeti ogni settimana": "Ogni martedì alle 18:00" while pending. */
    repeatWeekly: string | null;
    /**
     * 'declined' = refused by the trainer, 'expired' = no answer in time,
     * 'cancelled' = a confirmed session the trainer cancelled.
     */
    status: 'pending' | 'expired' | 'declined' | 'cancelled';
    /** ISO UTC string, null once expired or declined. */
    expiresAt: string | null;
    /** The trainer's message when cancelling. */
    cancelNote: string | null;
    group: BookingGroup | null;
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
    /** "Scrivi": the conversation in "Messaggi", when the trainer has the client in "Clienti". */
    messageHref: string | null;
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
