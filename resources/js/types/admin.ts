/** Sent by every admin page, read by the admin layout (menu badges). */
export type AdminAreaData = {
    verificationCount: number;
    flaggedReviews: number;
};

export type TrainerReviewStatus =
    | 'review'
    | 'changes'
    | 'approved'
    | 'rejected';

/** A trainer profile waiting for the team's approval. */
export type TrainerUnderReview = {
    id: number;
    name: string;
    disciplines: string[];
    city: string;
    status: TrainerReviewStatus;
    /** ISO UTC: when the profile was sent, or when changes were asked. */
    statusSince: string;
    bio: string;
    places: string[];
    services: { label: string; priceCents: number }[];
    weeklyHours: number;
    hasIdentityDocument: boolean;
    certifications: {
        id: number;
        title: string;
        issuer: string;
        /** Temporary link to the private file; null when there is no file. */
        fileHref: string | null;
    }[];
    /** Automatic warnings, e.g. "La bio contiene un numero di telefono". */
    warnings: string[];
    /** The team's note saved with the last decision. */
    internalNote: string | null;
    profileHref: string;
};

export type AdminBookingStatus =
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'expired'
    | 'cancelled'
    | 'no_show';

export type AdminBooking = {
    id: number;
    clientName: string;
    trainerName: string;
    /** ISO UTC string. */
    start: string;
    hours: number;
    serviceName: string;
    status: AdminBookingStatus;
    /** ISO UTC, pending requests only: after this the request decays. */
    expiresAt: string | null;
    /** e.g. "Dal cliente, 30 h prima". */
    note: string | null;
};

export type AdminClient = {
    id: number;
    name: string;
    email: string;
    /** ISO UTC string. */
    joinedAt: string;
    bookingCount: number;
    suspended: boolean;
};

export type AdminTrainer = {
    id: number;
    name: string;
    email: string;
    /** ISO UTC string. */
    joinedAt: string;
    profileStatus: TrainerReviewStatus;
    reviewCount: number;
    rating: number | null;
    suspended: boolean;
};

export type AdminReview = {
    id: number;
    authorName: string;
    trainerName: string;
    rating: number;
    text: string;
    /** ISO UTC string. */
    createdAt: string;
    /** Automatic warning, e.g. "Contiene un numero di telefono". */
    warning: string | null;
    hidden: boolean;
};

export type AdminDiscipline = {
    id: number;
    name: string;
    /** In the search URL; fixed once created. */
    slug: string;
    /** false = hidden from search and registration. */
    isActive: boolean;
    trainerCount: number;
};

export type AdminCity = {
    id: number;
    name: string;
    /** In the search URL; fixed once created. */
    slug: string;
    /** Car plate code of the province, e.g. "MI". */
    provinceCode: string;
    region: string;
    /** "45.4642, 9.19", the same text the form asks for. */
    coordinates: string;
    /** false = hidden from the menus, its search page gives 404. */
    isActive: boolean;
};
