import type { GroupSessionSummary } from './event';
import type { TrainerSummary } from './trainer';

/** A gym on the search cards (App\Support\GymCard). */
export type GymSummary = {
    /** In the URL /palestra/{slug}. */
    slug: string;
    name: string;
    href: string;
    city: string;
    address: string;
    coverUrl: string | null;
    /** The first few, already as labels ("Sala pesi"). */
    amenities: string[];
    /** All of them, for "+3". */
    amenityCount: number;
    /** The cheapest plan over one month; null without plans. */
    monthlyFromCents: number | null;
    /** Title of a promotion running today. */
    promotion: string | null;
    trainerCount: number;
    /** Saved among the favorites by the logged-in client. */
    favorite?: boolean;
};

/** A plan on the public profile ("Abbonamenti"). */
export type GymPlanSummary = {
    id: number;
    name: string;
    /** "Mensile", "Annuale"… */
    period: string;
    priceCents: number;
    /** "/mese", "per 10 ingressi". */
    suffix: string;
    /** The same price over one month, for quarterly and yearly plans. */
    monthlyCents: number | null;
    features: string[];
    note: string | null;
};

/** A promotion running today. */
export type GymPromotionSummary = {
    id: number;
    title: string;
    description: string | null;
    planName: string | null;
    planPriceCents: number | null;
    planSuffix: string | null;
    promoPriceCents: number | null;
    discountPercent: number | null;
    /** "YYYY-MM-DD", the last day; null = no end. */
    endsOn: string | null;
};

/** The public page of a gym (GymProfileController). */
export type GymProfileData = {
    slug: string;
    name: string;
    /** Paragraphs. */
    description: string[];
    city: { name: string; slug: string };
    address: string;
    mapsUrl: string;
    /** With the description and photo of "Servizi" in the gym area, when written. */
    amenities: {
        value: string;
        label: string;
        description: string | null;
        photoUrl: string | null;
    }[];
    /** Monday first. */
    hours: { day: string; ranges: string[]; today: boolean }[];
    /** Open right now, in Rome time; null when the hours are not given. */
    openNow: boolean | null;
    openingNotes: string | null;
    coverUrl: string | null;
    photos: string[];
    /** "Corsi": the active courses with at least one lesson. */
    courses: GymCourseInfo[];
    /** This week and the next one, Monday first. */
    courseWeeks: GymCourseDay[][];
    /** The cheapest active plan over one month; null without plans. */
    monthlyFromCents: number | null;
    plans: GymPlanSummary[];
    promotions: GymPromotionSummary[];
    trainers: TrainerSummary[];
    /** Saved among the favorites by the logged-in client. */
    favorite: boolean;
    contacts: {
        phone: string | null;
        email: string | null;
        website: string | null;
        instagram: string | null;
        instagramUrl: string | null;
    };
};

/**
 * "Novità" (App\Support\NewsFeed::preview): the newest trainers and gyms,
 * in a city or in Italy. A list is empty when that page doesn't show it.
 */
export type NewsPreview = {
    city: { slug: string; name: string } | null;
    trainers: TrainerSummary[];
    gyms: GymSummary[];
    /** The events published lately, still to come (empty in the searches). */
    events: GroupSessionSummary[];
};

/** A lesson of a course on a day of the plan (App\Support\GymCourseWeek). */
export type GymCourseLessonSlot = {
    lessonId: number;
    courseId: number;
    name: string;
    /** "18:30" */
    start: string;
    end: string;
    room: string | null;
    capacity: number | null;
    /** "Per tutti", "Principianti"… */
    level: string;
    discipline: string | null;
    instructor: string | null;
    /** The trainer's public profile, when the instructor is on MioPersonal. */
    instructorHref: string | null;
    /** Called off that day by the gym. */
    cancelled: boolean;
    cancelNote: string | null;
    /** "Prenotazione posto": a place is taken on MioPersonal. */
    bookable: boolean;
    /** Places left; null when not bookable. */
    remaining: number | null;
    /** The viewer has a place. */
    booked: boolean;
    /** Already started: no more places. */
    started: boolean;
    /** The event of the lesson that day, once someone took a place. */
    eventSlug: string | null;
    /** Clients with a place (gym area). */
    registered: number;
};

/** A day of the plan of the courses. */
export type GymCourseDay = {
    /** "YYYY-MM-DD", Rome. */
    date: string;
    /** "Lunedì" */
    label: string;
    lessons: GymCourseLessonSlot[];
};

/** A course under the plan: photo, description and when. */
export type GymCourseInfo = {
    id: number;
    name: string;
    description: string | null;
    photoUrl: string | null;
    level: string;
    discipline: string | null;
    instructor: string | null;
    /** "Lun, Gio 18:30 · Sab 10:00" */
    when: string;
};

/** "Palestre dove allena" on a trainer's profile. */
export type TrainerGym = {
    slug: string;
    name: string;
    city: string;
    address: string;
    coverUrl: string | null;
    href: string;
};

/** The data of the gym layout on every page of the gym area (BuildsGymArea). */
export type GymAreaData = {
    /** Trainers' requests waiting for an answer. */
    pendingCount: number;
    publicProfileHref: string | null;
    profile: {
        status: 'review' | 'changes' | 'approved' | 'rejected' | 'missing';
        message: string | null;
    };
};

/** A request, an invitation or a trainer of the gym (GymTrainersController). */
export type GymTrainerLinkRow = {
    id: number;
    message: string | null;
    trainer: TrainerSummary;
};

/** The same from the trainer's side (TrainerGymsController). */
export type TrainerGymLinkRow = {
    id: number;
    message: string | null;
    gym: GymSummary;
};
