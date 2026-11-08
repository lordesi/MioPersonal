/**
 * "Eventi": an appointment with N places of trainers and gyms
 * (App\Support\GroupSessionCard).
 */
export type GroupSessionSummary = {
    id: number;
    slug: string;
    /** The public page, /evento/{slug}. */
    href: string;
    title: string;
    /** training, workshop, open_day, other, lesson */
    type: string;
    /** "Workshop", "Open day"… */
    typeLabel: string;
    /** ISO UTC */
    start: string;
    end: string;
    city: string | null;
    online: boolean;
    /** "Palestra Fit · Via Roma 1, Milano", "Parco Sempione, Milano", "Online" */
    place: string;
    coverUrl: string | null;
    discipline: string | null;
    /** "Gratis", "15 €" */
    price: string;
    capacity: number;
    /** Places the app still gives. */
    remaining: number;
    cancelled: boolean;
    /** The organizers who said yes, the owner first. */
    hosts: { name: string; href: string | null }[];
};

/** "Eventi" of the trainer area or of the gym area. */
export type OrganizerArea = 'trainer' | 'gym';
