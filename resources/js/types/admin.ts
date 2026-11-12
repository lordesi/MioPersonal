/** Sent by every admin page, read by the admin layout (menu badges). */
export type AdminAreaData = {
    verificationCount: number;
    /** Gyms waiting for the team. */
    gymVerificationCount: number;
    /** Messages of the Contatti page not read yet. */
    unreadMessages: number;
    /** Contents reported with "Segnala" still to check. */
    openReports: number;
};

/** A line of the "Registro attività". */
export type AdminActivityRow = {
    id: number;
    adminName: string;
    /** e.g. "trainer.approved". */
    action: string;
    /** e.g. "Profilo trainer di Marco Rossi approvato". */
    description: string;
    /** ISO UTC string. */
    createdAt: string;
};

/** A report sent with "Segnala", in "Admin · Segnalazioni". */
export type AdminReport = {
    id: number;
    /** e.g. "Spam o pubblicità". */
    reason: string;
    details: string | null;
    reporterName: string;
    /** ISO UTC string. */
    createdAt: string;
    /** null while open. */
    resolution: 'removed' | 'dismissed' | null;
    resolvedAt: string | null;
    subject: {
        kind: 'trainer' | 'gym' | 'review' | 'deleted';
        /** The name of the profile, or "Anna B. su Marco Rossi". */
        title: string;
        /** The text of a review. */
        text: string | null;
        href: string | null;
        /** The owner's email, to find them in "Utenti". */
        ownerEmail: string | null;
        hidden: boolean;
    };
};

/** A message of the Contatti page, in "Admin · Messaggi". */
export type AdminMessage = {
    id: number;
    name: string;
    email: string;
    /** "Cliente", "Personal trainer", "Altro". */
    role: string;
    /** e.g. "Una prenotazione". */
    topic: string;
    message: string;
    /** ISO UTC string. */
    createdAt: string;
    read: boolean;
    /** The sender was logged in when writing. */
    registered: boolean;
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
    | 'declined'
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
    /** ISO UTC string: when the data goes (Cancella dati / Elimina account); null = none. */
    deletionAt: string | null;
    /** Asked by the user in the settings (they can also take it back). */
    deletionByUser: boolean;
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
    /** ISO UTC string: when the data goes (Cancella dati / Elimina account); null = none. */
    deletionAt: string | null;
    /** Asked by the user in the settings (they can also take it back). */
    deletionByUser: boolean;
};

/** A gym account in "Utenti › Palestre". */
export type AdminGym = {
    id: number;
    /** The gym's name; the contact person's while the profile is missing. */
    name: string;
    /** The contact person who signed up. */
    contact: string;
    email: string;
    city: string | null;
    /** ISO UTC string. */
    joinedAt: string;
    profileStatus: TrainerReviewStatus;
    /** Trainers who work there (both sides agreed). */
    trainerCount: number;
    /** The public page; null while the profile is missing. */
    profileHref: string | null;
    suspended: boolean;
    /** ISO UTC string: when the data goes (Cancella dati / Elimina account); null = none. */
    deletionAt: string | null;
    /** Asked by the user in the settings (they can also take it back). */
    deletionByUser: boolean;
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
    /** Approved gyms in the city. */
    gymCount: number;
};
