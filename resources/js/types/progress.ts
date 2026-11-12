/** Where a training comes from: a booked session, a course/event, or the diary. */
export type ProgressSource = 'session' | 'event' | 'log';

/** One week of the chart in "La tua attività". */
export type ProgressWeek = {
    /** The Monday, a Rome calendar day "2026-11-09". */
    start: string;
    count: number;
};

/** A training in "Ultimi allenamenti". */
export type ProgressEntry = {
    /** A Rome calendar day. */
    date: string;
    source: ProgressSource;
    label: string;
    /** Only for the diary's trainings: they can be deleted. */
    logId: number | null;
};

/** App\Support\ClientProgress::summary(). */
export type ClientProgressSummary = {
    thisWeek: number;
    thisMonth: number;
    total: number;
    /** Trainings a week the client aims at ("Su di te"), null if not chosen. */
    goal: number | null;
    /** Weeks in a row with the goal reached (one training without a goal). */
    streak: number;
    /** The last 12 weeks, the current one last. */
    weeks: ProgressWeek[];
    /** The most recent first. */
    recent: ProgressEntry[];
};

/** A weight in the trend of "Panoramica" (only with the consent). */
export type WeightPoint = {
    id: number;
    /** A Rome calendar day. */
    date: string;
    kg: number;
};

/** An option of "Segna un allenamento" (App\Enums\ActivityKind). */
export type ActivityKindOption = {
    value: string;
    label: string;
};

/** "Condividi i miei progressi con Marco": one switch per trainer. */
export type ProgressSharing = {
    recordId: number;
    trainerName: string;
    trainerFirstName: string;
    shared: boolean;
};

/** "Nota per il cliente", on top of "Panoramica". */
export type TrainerNote = {
    id: number;
    trainerName: string;
    trainerHref: string;
    note: string;
    /** ISO UTC. */
    at: string;
};
