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

export type TrainerService = {
    id: number;
    name: string;
    /** Duration of one session, e.g. 60. */
    minutes: number;
    /** e.g. "da 30 min a 2 ore", "10 × 1 ora" */
    durationLabel: string;
    note: string;
    priceCents: number;
    /** Price per hour: total = priceCents × minutes / 60. */
    perHour: boolean;
    /** Only bookable for its own `minutes`. */
    fixedDuration: boolean;
};

export type TrainingPlace = {
    type: 'studio' | 'home' | 'park' | 'online';
    title: string;
    detail: string;
};

export type TrainerReview = {
    id: number;
    authorName: string;
    meta: string;
    rating: number;
    text: string;
    reply: string | null;
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
    online: 'also' | 'only' | null;
    disciplines: string[];
    /** url is null for the placeholder with the initials. */
    photos: { caption: string; isPortrait: boolean; url: string | null }[];
    services: TrainerService[];
    places: TrainingPlace[];
    certifications: { title: string; issuer: string }[];
    ratingDistribution: { stars: number; count: number }[];
    reviews: TrainerReview[];
    /** "Durate prenotabili" in minutes, shortest first, e.g. [60, 90, 120]. */
    sessionMinutes: number[];
    availability: AvailabilityDay[];
    similarTrainers: {
        name: string;
        href: string;
        subtitle: string;
        detail: string;
    }[];
};

/** A confirmed session in the trainer's "Oggi" list. */
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
    /** null until the trainer confirms a booking of this client. */
    contacts: { email: string; phone: string | null } | null;
};

export type TrainerStats = {
    sessionsThisWeek: number;
};

/** A row of the "Da fare" list. */
export type TrainerTodo = {
    label: string;
    hint: string;
    cta: string;
    href: string;
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

/** A block in the trainer calendar. */
export type CalendarEvent = {
    id: number;
    /** ISO UTC strings. */
    start: string;
    end: string;
    title: string;
    detail: string;
    place: string;
    kind: 'confirmed' | 'pending';
};

export type TrainerClient = {
    id: number;
    name: string;
    sessions: number;
    /** ISO UTC strings. */
    lastSession: string;
    nextSession: string | null;
    package: { name: string; left: number; total: number } | null;
    /** Practical notes only: never health data. */
    note: string;
};

export type WorkingDay = {
    /** ISO day of week: 1 = Monday … 7 = Sunday. */
    day: number;
    label: string;
    enabled: boolean;
    /** "HH:MM" in Rome time. */
    ranges: { from: string; to: string }[];
};

export type BookingRules = {
    noticeHours: number;
    bookingWindowDays: number;
    breakMinutes: number;
    /** null = "Nessun limite". */
    maxSessionsPerDay: number | null;
    confirmHours: number;
    freeCancellationHours: number;
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
