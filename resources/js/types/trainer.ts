/** Trainer data shown in search results and featured lists. */
export type TrainerSummary = {
    /** In the URL /trainer/{slug}; used to save it among the favorites. */
    slug: string;
    name: string;
    href: string;
    /** City name, or "Solo online". */
    city: string;
    disciplines: string[];
    /** Average rating, null when the trainer has no reviews yet ("Nuovo"). */
    rating: number | null;
    reviewCount: number;
    priceFromCents: number;
    /** Already formatted in Europe/Rome, e.g. "domani 18:00"; null without free slots. */
    nextSlotLabel: string | null;
    /** 'also' = in person and online, 'only' = online only. */
    online: 'also' | 'only' | null;
    photoUrl?: string | null;
    /** Search results: saved by the logged-in client (the full heart). */
    favorite?: boolean;
};

/** A duration of a service and its price; serviceId is the row that gets booked. */
export type ServiceOption = {
    serviceId: number;
    minutes: number;
    priceCents: number;
};

/**
 * A service as the client chooses it. "Seduta singola" has a price for each
 * duration (one option each); the first session and packages have one option.
 */
export type TrainerService = {
    id: number;
    name: string;
    /** e.g. "da 30 min a 2 ore", "1 ora", "10 × 1 ora" */
    durationLabel: string;
    note: string;
    /** The lowest price of the options ("da 25 €" when there are more). */
    priceCents: number;
    /** Shortest first. */
    options: ServiceOption[];
};

export type TrainingPlace = {
    type: 'studio' | 'home' | 'park' | 'online';
    title: string;
    detail: string;
};

export type TrainerReview = {
    id: number;
    /** "Anna B.", or "Utente anonimo" once the client deleted the account. */
    authorName: string;
    rating: number;
    text: string;
    reply: string | null;
    /** The booked service, e.g. "Seduta singola"; null when unknown. */
    serviceName: string | null;
    /** ISO UTC string. */
    createdAt: string;
};

export type AvailabilityDay = {
    /** Local date in Europe/Rome, "YYYY-MM-DD". */
    date: string;
    /** start is an ISO UTC string; maxMinutes is the longest session that fits. */
    slots: { start: string; maxMinutes: number }[];
};

/** Everything shown on the public trainer profile. */
export type TrainerProfile = {
    slug: string;
    /** Saved among the favorites by the logged-in client. */
    favorite: boolean;
    name: string;
    headline: string;
    verified: boolean;
    bio: string[];
    experienceLabel: string;
    /** Null until the trainer has answered some bookings. */
    responseTimeLabel: string | null;
    cancellationLabel: string;
    rating: number | null;
    reviewCount: number;
    /** Main city: the breadcrumb links to its search. Null for online-only trainers. */
    city: { slug: string; name: string } | null;
    /** Every city where the trainer trains in person. */
    cities: string[];
    areaLabel: string;
    /** Center of the map circle: the first studio, or the main city. Null for online-only trainers. */
    areaCenter: { lat: number; lng: number } | null;
    /** Radius of the map circle, in meters. */
    areaRadius: number;
    online: 'also' | 'only' | null;
    disciplines: string[];
    /** The profile photo, for the circle next to the name; null = the initials. */
    portraitUrl: string | null;
    /** The gallery (carousel), without the profile photo; may be empty. */
    photos: { caption: string; url: string }[];
    services: TrainerService[];
    places: TrainingPlace[];
    certifications: { title: string; issuer: string }[];
    ratingDistribution: { stars: number; count: number }[];
    reviews: TrainerReview[];
    availability: AvailabilityDay[];
    similarTrainers: {
        name: string;
        href: string;
        subtitle: string;
        detail: string;
    }[];
};

/** A confirmed session in the trainer's "Le tue prenotazioni" page. */
export type TrainerTodaySession = {
    id: number;
    /** null once the client deleted the account: no link to the profile. */
    clientId: number | null;
    clientName: string;
    /** ISO UTC string. */
    start: string;
    hours: number;
    serviceName: string;
    placeLabel: string;
    /** Marked "Saltata" by the trainer; otherwise done once it ends. */
    noShow: boolean;
};

/** A finished session: "Ultimi 7 giorni" and "Sedute passate". */
export type TrainerPastSession = TrainerTodaySession & {
    /** Within 7 days from the end: "Saltata" can still be set or taken back. */
    canChangeNoShow: boolean;
};

/** How often a client shows up: percentage of the sessions over that were not missed. */
export type AttendanceRate = { rate: number; sessions: number };

/** Only for trainers. null = no session over yet. */
export type ClientAttendance = {
    /** With every trainer on MioPersonal. */
    platform: AttendanceRate | null;
    /** With the trainer who is looking. */
    withYou: AttendanceRate | null;
};

/** A booking waiting for the trainer's answer. */
export type TrainerBookingRequest = {
    id: number;
    clientId: number | null;
    clientName: string;
    start: string;
    hours: number;
    serviceName: string;
    placeLabel: string;
    note: string | null;
    /** ISO UTC string: after this the request decays and the slot is freed. */
    expiresAt: string;
    /** null once the client deleted the account. */
    attendance: ClientAttendance | null;
};

/** A client's profile, seen by a trainer the client booked with. */
export type TrainerClientProfile = {
    id: number;
    name: string;
    firstName: string;
    avatar: string | null;
    /** ISO UTC strings. */
    joinedAt: string | null;
    /** Confirmed sessions with this trainer. */
    sessions: number;
    nextSession: string | null;
    attendance: ClientAttendance;
    /** null until the trainer confirms a booking of this client. */
    contacts: { email: string; phone: string | null } | null;
};

export type TrainerStats = {
    sessionsThisWeek: number;
};

/** Sent by every page of the trainer area, read by the trainer layout. */
export type TrainerAreaData = {
    pendingCount: number;
    /** Null until the registration is sent. */
    publicProfileHref: string | null;
    /** For the notice at the top of every page, until the profile is approved. */
    profile: {
        status: 'missing' | 'review' | 'changes' | 'approved' | 'rejected';
        /** The team's message, with "changes" and "rejected". */
        message: string | null;
    };
};

/** A booking in the trainer calendar, confirmed or waiting for an answer. */
export type CalendarEvent = {
    id: number;
    /** ISO UTC strings. */
    start: string;
    end: string;
    /** null once the client deleted the account: no link to the profile. */
    clientId: number | null;
    clientName: string;
    serviceName: string;
    placeLabel: string;
    kind: 'confirmed' | 'pending';
};

/** A client with at least one confirmed session, shown once in "Clienti". */
export type TrainerClient = {
    id: number;
    name: string;
    /** Confirmed sessions, past and future. */
    sessions: number;
    /** ISO UTC strings; null when there is none. */
    lastSession: string | null;
    nextSession: string | null;
    attendance: ClientAttendance;
    /** Every confirmed slot still to come, in order. */
    upcoming: TrainerTodaySession[];
    /** Over in the last 7 days, still in time for "Saltata"; most recent first. */
    recent: TrainerTodaySession[];
};

/** "Regole di prenotazione" of step 5 and of "Disponibilità". */
export type BookingRules = {
    noticeHours: number;
    bookingWindowDays: number;
    breakMinutes: number;
    /** null = "Nessun limite". */
    maxSessionsPerDay: number | null;
    freeCancellationHours: number;
};

/** Hours and rules of step 5 of "Diventa trainer" and of "Disponibilità". */
export type TrainerAvailability = {
    /** Start hours by day (0 = Monday … 6 = Sunday), from 6 to 23. */
    hours: number[][];
    rules: BookingRules;
    autoConfirm: boolean;
};

/** A review as the trainer sees it in their area. */
export type TrainerAreaReview = {
    id: number;
    authorName: string;
    rating: number;
    serviceName: string;
    /** ISO UTC string. */
    date: string;
    text: string;
    reply: string | null;
};
