/**
 * Answers of the quiz, as option values (see resources/js/lib/quiz.ts).
 * null or [] = question skipped.
 */
export type QuizAnswers = {
    goal: string | null;
    disciplines: string[];
    places: string[];
    /** An area of the zone suggestions, or "online". */
    zone: string | null;
    /** Kilometres: "2", "5" or "10". */
    radius: string | null;
    times: string[];
    budget: string | null;
    level: string | null;
};

/** Why a trainer fits: the page turns it into text, e.g. "Libero di sera". */
export type QuizReason =
    | { type: 'disciplines'; disciplines: string[] }
    | { type: 'goal'; goal: string }
    | { type: 'zone' }
    | { type: 'online' }
    | { type: 'time'; time: string }
    | { type: 'budget' };

/** A suggested trainer, computed by QuizController. */
export type QuizMatch = {
    name: string;
    href: string;
    /** Neighbourhood or town, e.g. "Città Studi". */
    area: string;
    rating: number | null;
    priceFromCents: number;
    /** Already formatted in Europe/Rome, e.g. "domani 18:00". */
    nextSlotLabel: string;
    /** 35–97. */
    matchPercent: number;
    reasons: QuizReason[];
};
