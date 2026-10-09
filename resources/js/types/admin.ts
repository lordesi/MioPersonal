/** Sent by every admin page, read by the admin layout (menu badges). */
export type AdminAreaData = {
    verificationCount: number;
    unreadMessages: number;
    flaggedReviews: number;
};

/** A row of "Attività recente" / "Registro attività". */
export type AdminActivity = {
    id: number;
    who: string;
    what: string;
    /** ISO UTC string. */
    at: string;
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
    zone: string;
    status: TrainerReviewStatus;
    /** ISO UTC: when the profile was sent, or when changes were asked. */
    statusSince: string;
    bio: string;
    places: string[];
    services: { label: string; priceCents: number }[];
    weeklyHours: number;
    hasIdentityDocument: boolean;
    certifications: { title: string; issuer: string }[];
    /** Automatic warnings, e.g. "La bio contiene un numero di telefono". */
    warnings: string[];
    profileHref: string;
};

export type ContactMessageStatus = 'new' | 'in-progress' | 'closed';

/** A message sent from the Contatti page. */
export type AdminContactMessage = {
    id: number;
    name: string;
    email: string;
    roleLabel: string;
    topicLabel: string;
    /** ISO UTC string. */
    receivedAt: string;
    subject: string;
    text: string;
    status: ContactMessageStatus;
    /** "Privacy e dati": must be answered within the GDPR deadline. */
    isPrivacyRequest: boolean;
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
    trainerCount: number;
};

export type AdminTeamMember = {
    id: number;
    name: string;
    twoFactorEnabled: boolean;
};
