import type { TrainingGoal } from '@/lib/goals';
import type { TrainerGym } from './gym';
import type { SocialLink } from './social';

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
    /** For one person. */
    priceCents: number;
    /** "Invita un amico": the total for 2… people; empty = only the booker. */
    groupPrices: { people: number; priceCents: number }[];
};

/**
 * A service as the client chooses it. "Seduta singola" has a price for each
 * duration (one option each); the first session and packages have one option.
 */
export type TrainerService = {
    /** Negative for "Il tuo pacchetto": never the id of a service. */
    id: number;
    /** "Il tuo pacchetto": a package the client bought, sessions already paid. */
    packageId: number | null;
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
    /** "Dove" of the booking (place_id). */
    id: number;
    type: 'studio' | 'home' | 'park' | 'online' | 'gym';
    title: string;
    detail: string;
    /** The gym's page, for the gyms of MioPersonal. */
    href: string | null;
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
    /** The trainer doesn't work that day ("chiuso"); without slots and not closed: "pieno". */
    closed: boolean;
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
    /** The socials linked by the trainer (and an Instagram typed by hand), as icons. */
    socials: SocialLink[];
    /** Null until the trainer has answered some bookings. */
    responseTimeLabel: string | null;
    cancellationLabel: string;
    /** "Conferma entro 24 ore" or "Conferma immediata". */
    confirmLabel: string;
    rating: number | null;
    reviewCount: number;
    /** Main city: the breadcrumb links to its search. Null for online-only trainers. */
    city: { slug: string; name: string } | null;
    /** Every city where the trainer trains in person. */
    cities: string[];
    online: 'also' | 'only' | null;
    disciplines: string[];
    /** Labels in trainingGoals (lib/goals.ts). */
    goals: TrainingGoal[];
    /** The profile photo, for the circle next to the name; null = the initials. */
    portraitUrl: string | null;
    /** The gallery (carousel), without the profile photo; may be empty. */
    photos: { caption: string; url: string }[];
    services: TrainerService[];
    places: TrainingPlace[];
    /** "Palestre dove allena": the gyms of MioPersonal that accepted the trainer. */
    gyms: TrainerGym[];
    certifications: { title: string; issuer: string }[];
    ratingDistribution: { stars: number; count: number }[];
    reviews: TrainerReview[];
    availability: AvailabilityDay[];
    /** Full days the viewer waits for ("Avvisami se si libera"), Y-m-d. */
    waitlistDays: string[];
    /** In the format of the search cards. */
    similarTrainers: TrainerSummary[];
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

/**
 * A session in Panoramica, Richieste and Clienti (App\Support\TrainerSessions).
 * serviceName says which session of a package it is: "Pacchetto 10 sedute · seduta 2 di 10".
 */
export type TrainerSession = TrainerTodaySession &
    SessionChange & {
        /** ISO UTC string. */
        end: string;
        /** 'pending' = waiting for the trainer's answer. */
        kind: 'confirmed' | 'pending';
        /** "Invita un amico": who comes, the client included. */
        people: number;
        /** The friends who joined the client. */
        guestNames: string[];
    };

/** "Sposta" and "Annulla seduta" of a confirmed session (TrainerSessions::change). */
export type SessionChange = {
    /** Confirmed and not started: the buttons show. */
    canChange: boolean;
    /** ISO UTC string: the time proposed to the client, waiting for the answer. */
    proposedStart: string | null;
};

/** "Pacchetti attivi": bought, not all the sessions done yet. */
export type TrainerPackage = {
    id: number;
    clientId: number | null;
    clientName: string;
    name: string;
    total: number;
    /** Confirmed, over and not "Saltata". */
    done: number;
    /** Confirmed or waiting, past and future. */
    booked: number;
    /** ISO UTC string of the next session of the package, null when none is booked. */
    nextStart: string | null;
};

/** A finished session: "Ultimi 7 giorni" and "Sedute passate". */
export type TrainerPastSession = TrainerTodaySession & {
    /** Within 7 days from the end: "Saltata" can still be set or taken back. */
    canChangeNoShow: boolean;
    /** "Seduta 2 di 10" as numbers; null for a single session. */
    package: { position: number; total: number } | null;
    /** ISO UTC string: the end + 7 days, "Modificabile fino a gio 29 ott". */
    noShowUntil: string;
};

/** "Tutte", "Effettuate" or "Saltate" in "Sedute passate" (`?esito=` in the URL). */
export type PastSessionFilter = 'all' | 'done' | 'missed';

/** The numbers next to the filters, of every session over. */
export type PastSessionCounts = Record<PastSessionFilter, number>;

/** "Ultimi 7 giorni" of "Sedute passate": the sessions over that can still be changed. */
export type PastWeekSummary = {
    sessions: number;
    hours: number;
    /** Different clients (deleted accounts not counted). */
    clients: number;
    missed: number;
    /** Rome calendar days "YYYY-MM-DD" of the first and the last one; null without sessions. */
    first: string | null;
    last: string | null;
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
export type TrainerBookingRequest = TrainerSession & {
    note: string | null;
    /** ISO UTC string: when the client asked. */
    requestedAt: string;
    /** ISO UTC string: after this the request decays and the slot is freed. */
    expiresAt: string;
    /** null once the client deleted the account. */
    attendance: ClientAttendance | null;
    /** What the client wrote in "Su di te"; null when nothing. */
    about: ClientAbout | null;
};

/**
 * "Sul cliente" (App\Support\ClientAbout): the answers of "Su di te", for the
 * trainers the client booked. Labels in Italian, except `goal` (goals.ts).
 * Height and weight only with the client's consent.
 */
export type ClientAbout = {
    /** The age the client turns this year (only the birth year is saved). */
    age: number | null;
    sex: string | null;
    goal: string | null;
    level: string | null;
    experience: string | null;
    activity: string | null;
    sessionsPerWeek: number | null;
    sports: string[];
    note: string | null;
    heightCm: number | null;
    weightKg: number | null;
};

/** "Gestite" in "Richieste": a request the trainer already answered. */
export type TrainerHandledRequest = TrainerSession & {
    /** "Pacchetto 10 sedute" or "Seduta singola", without "· seduta 2 di 10". */
    serviceType: string;
    /** "Seduta 2 di 10": only confirmed sessions of a package. */
    package: { position: number; total: number } | null;
    /** 'expired' = no answer in time, declined automatically. */
    answer: 'confirmed' | 'declined' | 'expired';
    /** ISO UTC string: when it was answered, or when it expired. */
    answeredAt: string;
};

/** The numbers of "Panoramica". */
export type TrainerStats = {
    /** Requests waiting for an answer. */
    pending: number;
    /** Confirmed sessions from today to the 7th day. */
    weekSessions: number;
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
export type CalendarEvent = SessionChange & {
    id: number;
    /** ISO UTC strings. */
    start: string;
    end: string;
    /** null once the client deleted the account: no link to the profile. */
    clientId: number | null;
    clientName: string;
    /** "Seduta singola · 3 persone" for a session of more people. */
    serviceName: string;
    placeLabel: string;
    kind: 'confirmed' | 'pending';
    /** "Invita un amico": the friends who joined the client. */
    guestNames: string[];
};

/** A payment the trainer wrote down by hand. */
export type ClientPayment = {
    id: number;
    amountCents: number;
    /** Y-m-d. */
    paidOn: string;
    note: string | null;
};

/** A "sedute fisse" rule going on: «Ogni martedì alle 18:00». */
export type ClientSeriesRule = {
    id: number;
    label: string;
    name: string;
    minutes: number;
    /** Y-m-d; null = until the trainer ends it. */
    endsOn: string | null;
    /** Confirmed sessions of the rule still to come. */
    upcomingCount: number;
    usesPackage: boolean;
};

/** A kind of session the trainer can repeat every week. */
export type SeriesService = {
    id: number;
    name: string;
    minutes: number;
    priceCents: number;
};

/**
 * A client in the list of the trainer ("Clienti"): who booked, shown once,
 * and who the trainer added by hand.
 */
export type TrainerClient = {
    /** The account (links of Panoramica and Calendario); null until the person signs up. */
    id: number | null;
    /** The row of the trainer's list: what the page selects and edits. */
    recordId: number;
    /** Has an account: the contacts and the name are theirs. */
    registered: boolean;
    name: string;
    /** Confirmed sessions, past and future. */
    sessions: number;
    /** ISO UTC strings; null when there is none. */
    firstSession: string | null;
    lastSession: string | null;
    nextSession: string | null;
    /** The service of the most recent session, under the name. */
    lastService: string;
    /** Confirmed sessions still to come. */
    upcomingCount: number;
    /** Over: done, or marked "Saltata". */
    done: number;
    missed: number;
    /** The package in progress, null when there is none. */
    package: { name: string; done: number; total: number } | null;
    attendance: ClientAttendance | null;
    /** What the client wrote in "Su di te"; null when nothing. */
    about: ClientAbout | null;
    /** The account's contacts; for who has none, the ones the trainer wrote (may be empty). */
    contacts: { email: string; phone: string | null };
    /** The trainer's own goal and private notes: never shown to the client. */
    goal: string | null;
    notes: string | null;
    payments: ClientPayment[];
    paidCents: number;
    /** The personal link to send; null once signed up, or while the profile is not public. */
    inviteLink: string | null;
    /** "Sedute fisse" going on. */
    series: ClientSeriesRule[];
    /** The open package of the client that a series can use up; null when none. */
    seriesPackage: { id: number; name: string; remaining: number } | null;
    /** Every confirmed slot still to come, in order. */
    upcoming: TrainerSession[];
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

/**
 * "Giorni e settimane diverse" (App\Support\TrainerDayOverrides::blocks):
 * days in a row with the same note, all closed or all with their own hours.
 */
export type TrainerDayOverrideBlock = {
    /** Rome dates, Y-m-d. */
    from: string;
    to: string;
    closed: boolean;
    note: string | null;
    /** Each day with its start hours ([] = closed). */
    days: { date: string; hours: number[] }[];
    /** Sessions already booked in those days: they stay valid. */
    bookings: number;
};

/** A review as the trainer sees it in their area. */
export type TrainerAreaReview = {
    id: number;
    authorName: string;
    rating: number;
    /** The booked service; null for the reviews not linked to a session. */
    serviceName: string | null;
    /** Left after a booked session: "Seduta svolta". */
    fromSession: boolean;
    /** ISO UTC string. */
    date: string;
    text: string;
    reply: string | null;
};
