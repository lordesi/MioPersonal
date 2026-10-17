/** "Impostazioni account": the data shared by clients and trainers. */
export type AccountSettings = {
    firstName: string;
    lastName: string;
    /** Required, e.g. "+393330000000"; null only for accounts made before. */
    phone: string | null;
    email: string;
    /** False for who signed up with Google: "Imposta una password". */
    hasPassword: boolean;
    /** ISO UTC of the last change in "Cambia password"; null = never. */
    passwordChangedAt: string | null;
    /** Sign-in with Google. */
    providers: { name: string; connected: boolean }[];
};

/** What clients receive when the trainer confirms a booking. */
export type TrainerContacts = {
    /** The account phone; Telefono shows up only when it is set. */
    phone: string | null;
    email: string;
    arrivalNotes: string;
    showPhone: boolean;
    showEmail: boolean;
};

/** "Visibilità del profilo" of the trainer settings. */
export type TrainerVisibility = {
    visibleInSearch: boolean;
    acceptsNewClients: boolean;
    /** First day bookable again ("YYYY-MM-DD", Rome); null when not paused. */
    pausedUntil: string | null;
    /** "Metti in pausa" without an end: hidden from the search until "Riattiva profilo". */
    paused: boolean;
};
