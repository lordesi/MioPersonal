/** "Impostazioni account": the data shared by clients and trainers. */
export type AccountSettings = {
    firstName: string;
    lastName: string;
    email: string;
    /** Sign-in with Google or Apple. */
    providers: { name: string; connected: boolean }[];
    /** Browsers where the user is logged in. */
    devices: AccountDevice[];
};

export type AccountDevice = {
    id: number;
    /** e.g. "iPhone · Safari" */
    name: string;
    /** e.g. "Milano · 2 giorni fa" */
    detail: string;
    current: boolean;
};

/** A switch in the "Notifiche" section. */
export type NotificationSetting = {
    key: string;
    label: string;
    hint: string;
    defaultOn: boolean;
};

/** What clients receive when the trainer confirms a booking. */
export type TrainerContacts = {
    email: string;
    arrivalNotes: string;
};
