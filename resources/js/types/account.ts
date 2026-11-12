/** One switch of "Cosa ricevere sul dispositivo": off stops only the push. */
export type PushCategorySetting = {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
};

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
    /** "Notifiche": the switches saved on the account (the push devices are read by the browser). */
    notifications: {
        reminders: boolean;
        /** "Cosa ricevere sul dispositivo": the kinds of push of this role (App\Enums\PushCategory). */
        push: PushCategorySetting[];
    };
    /** Sign-in with Google; `available` is false without the keys in the .env ("Collega" hidden). */
    providers: { name: string; connected: boolean; available: boolean }[];
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
    /** The old "Metti in pausa" without an end: ended by "Riprendi ora". */
    paused: boolean;
};

/** "Google Calendar" of the trainer settings; the section is hidden when null. */
export type TrainerGoogleCalendar = {
    connected: boolean;
    email: string | null;
    /** Why Google refused the last time: the trainer has to link again. */
    error: string | null;
    /** "Blocca gli orari occupati": the busy times on Google can't be booked. */
    readsBusy: boolean;
    /** ISO, when the busy times were last read; null before the first read. */
    busySyncedAt: string | null;
};
