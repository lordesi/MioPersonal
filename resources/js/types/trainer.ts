/** Trainer data shown in search results and featured lists. */
export type TrainerSummary = {
    name: string;
    href: string;
    zone: string;
    disciplines: string[];
    /** Average rating, null when the trainer has no reviews yet ("Nuovo"). */
    rating: number | null;
    reviewCount: number;
    priceFromCents: number;
    /** Already formatted in Europe/Rome, e.g. "domani 18:00". */
    nextSlotLabel: string;
    /** 'also' = in person and online, 'only' = online only. */
    online: 'also' | 'only' | null;
    photoUrl?: string | null;
};

export type TrainerService = {
    id: number;
    name: string;
    /** e.g. "1 o 2 ore", "10 × 1 ora" */
    durationLabel: string;
    note: string;
    priceCents: number;
    /** Price per hour: total = priceCents × hours. */
    perHour: boolean;
    /** Only bookable for 1 hour. */
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
    /** start is an ISO UTC string; maxHours is the longest bookable duration. */
    slots: { start: string; maxHours: number }[];
};

/** Everything shown on the public trainer profile. */
export type TrainerProfile = {
    slug: string;
    name: string;
    headline: string;
    verified: boolean;
    bio: string[];
    experienceLabel: string;
    responseTimeLabel: string;
    cancellationLabel: string;
    rating: number | null;
    reviewCount: number;
    zones: string[];
    areaLabel: string;
    online: 'also' | 'only' | null;
    disciplines: string[];
    photos: { caption: string; isPortrait: boolean }[];
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

/** A confirmed session in the trainer's "Oggi" list. */
export type TrainerTodaySession = {
    id: number;
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
    clientName: string;
    start: string;
    hours: number;
    serviceName: string;
    placeLabel: string;
    note: string | null;
    /** ISO UTC string: after this the request decays and the slot is freed. */
    expiresAt: string;
};

export type TrainerStats = {
    sessionsThisWeek: number;
    sessionsLastWeek: number;
    profileViews: number;
    profileBookings: number;
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
    publicProfileHref: string;
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
    /** 'busy' = an appointment imported from Google or Apple. */
    kind: 'confirmed' | 'pending' | 'busy';
    source: 'google' | 'apple' | null;
};

export type CalendarSync = {
    id: 'google' | 'apple';
    name: string;
    connected: boolean;
    /** Shown while connected, e.g. "Aggiornato 2 min fa". */
    status: string;
};

export type TrainerClient = {
    id: number;
    name: string;
    email: string;
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
    travelMinutes: number;
    maxSessionsPerDay: number;
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
