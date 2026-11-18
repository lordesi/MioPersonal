import type {
    TrainerBookingRequest,
    TrainerDashboardStats,
    TrainerDaySession,
    TrainerPackage,
    TrainerSession,
    TrainerStatsPeriod,
    TrainerWeekDay,
} from '@/types';

/** The props of "Home" (TrainerDashboardController). */
export type HomeProps = {
    firstName: string;
    /** Rome dates "YYYY-MM-DD". */
    today: string;
    day: string;
    minDate: string;
    maxDate: string;
    /** The confirmed session going on now, or the next one. */
    next: TrainerSession | null;
    /** "Da confermare": all of them, the ones expiring first on top. */
    requests: TrainerBookingRequest[];
    week: TrainerWeekDay[];
    daySessions: TrainerDaySession[];
    packages: TrainerPackage[];
    stats: TrainerDashboardStats;
};

/** What the desktop and the phone drawings get from the page. */
export type HomeViewProps = HomeProps & {
    now: Date;
    busyId: number | null;
    onAnswer: (
        request: TrainerBookingRequest,
        value: 'confirmed' | 'declined',
        weekly?: boolean,
    ) => void;
    onPickDay: (date: string) => void;
    onPeriod: (period: TrainerStatsPeriod, from?: string, to?: string) => void;
    /** The open session of the day (its id), null when all are closed. */
    openId: number | null;
    onToggle: (id: number) => void;
    /** The first session of the chosen day not over yet, when the day is today. */
    nextId: number | null;
};
