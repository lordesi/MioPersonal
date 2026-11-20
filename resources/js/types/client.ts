/**
 * A session or an event of the chosen day in the client's "Home"
 * (ClientHomeController::dayItems).
 */
export type ClientDayItem = {
    /** "booking-12" or "event-4": unique in the list. */
    key: string;
    /** A session with a trainer, or an event with a place taken. */
    kind: 'trainer' | 'event';
    /** The trainer's name, or "Yoga flow · Urban Fit". */
    title: string;
    avatar: string | null;
    /** "Boxe", or the type of event ("Corso"). */
    activity: string;
    /** ISO UTC. */
    start: string;
    end: string;
    /** 'pending': waiting for the trainer's answer. */
    status: 'confirmed' | 'pending';
    /** "Pacchetto Boxe · seduta 9 di 10", only for a package. */
    packageLabel: string | null;
    placeLabel: string;
    /** An event cancelled by who organises it. */
    cancelled: boolean;
    /** The conversation with the trainer, when there is one. */
    messageHref: string | null;
    /** "Le mie prenotazioni", or the page of the event. */
    detailsHref: string;
};

/** Shared on every page for clients (HandleInertiaRequests::clientArea). */
export type ClientAreaData = {
    /** Conversations with messages from a trainer not read yet. */
    unreadChats: number;
};
