import {
    Activity,
    Building,
    Calendar,
    Clock,
    Coffee,
    Dumbbell,
    House,
    Leaf,
    MapPin,
    Moon,
    PersonStanding,
    SignalHigh,
    SignalLow,
    SignalMedium,
    Sparkles,
    Sun,
    Sunrise,
    Target,
    Trees,
    Trophy,
    Video,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { QuizAnswers, QuizReason } from '@/types';

/**
 * The 7 questions of the quiz, with the texts of the design.
 * The values are the ones QuizController accepts: change them in both places.
 * Never ask for health data here (conditions, injuries, medicines…).
 */

export type QuizOption = {
    value: string;
    label: string;
    hint?: string;
    /** Icon in the tile; without it the tile shows `glyph`, e.g. "Pi" or "€€". */
    icon?: LucideIcon;
    glyph?: string;
};

type QuestionBase = {
    category: string;
    /** Icon of the question in the intro list. */
    icon: LucideIcon;
    title: string;
    help: string;
};

export type ChoiceQuestion = QuestionBase & {
    kind: 'single' | 'multiple';
    key: 'goal' | 'disciplines' | 'places' | 'times' | 'budget' | 'level';
    options: QuizOption[];
};

/** "Zona": a search field with suggestions instead of option cards. */
export type ZoneQuestion = QuestionBase & { kind: 'zone'; key: 'zone' };

export type QuizQuestion = ChoiceQuestion | ZoneQuestion;

/** Screen of the quiz: the intro, a question (1–7) or the results. */
export type QuizStep = 'intro' | 'results' | number;

export const questions: QuizQuestion[] = [
    {
        key: 'goal',
        kind: 'single',
        category: 'Obiettivo',
        icon: Target,
        title: 'Qual è il tuo obiettivo principale?',
        help: 'Scegline uno: aiuta il trainer a capire da dove partire.',
        options: [
            {
                value: 'fitness',
                label: 'Rimettermi in forma',
                hint: 'Dopo una pausa o per iniziare',
                icon: Activity,
            },
            {
                value: 'strength',
                label: 'Diventare più forte',
                hint: 'Forza e massa muscolare',
                icon: Dumbbell,
            },
            {
                value: 'posture',
                label: 'Migliorare postura e mobilità',
                hint: 'Schiena, spalle, flessibilità',
                icon: PersonStanding,
            },
            {
                value: 'sport',
                label: 'Prepararmi a una gara o a uno sport',
                hint: 'Corsa, calcio, sci, altro',
                icon: Trophy,
            },
            {
                value: 'wellbeing',
                label: 'Stare meglio e scaricare lo stress',
                hint: 'Muovermi con regolarità',
                icon: Leaf,
            },
        ],
    },
    {
        key: 'disciplines',
        kind: 'multiple',
        category: 'Discipline',
        icon: Dumbbell,
        title: 'Quali discipline ti incuriosiscono?',
        help: 'Anche più di una.',
        options: [
            {
                value: 'Functional',
                label: 'Functional',
                hint: 'Movimenti completi',
                glyph: 'Fu',
            },
            {
                value: 'Pesi',
                label: 'Pesi',
                hint: 'Sala e bilanciere',
                glyph: 'Pe',
            },
            {
                value: 'Pilates',
                label: 'Pilates',
                hint: 'Controllo e core',
                glyph: 'Pi',
            },
            {
                value: 'Yoga',
                label: 'Yoga',
                hint: 'Respiro e mobilità',
                glyph: 'Yo',
            },
            {
                value: 'Crossfit',
                label: 'Crossfit',
                hint: 'Alta intensità',
                glyph: 'Cf',
            },
            {
                value: 'Boxe',
                label: 'Boxe',
                hint: 'Tecnica e cardio',
                glyph: 'Bx',
            },
            {
                value: 'Calisthenics',
                label: 'Calisthenics',
                hint: 'A corpo libero',
                glyph: 'Ca',
            },
            {
                value: 'any',
                label: 'Consigliami tu',
                hint: 'Non ho preferenze',
                icon: Sparkles,
            },
        ],
    },
    {
        key: 'places',
        kind: 'multiple',
        category: 'Luoghi',
        icon: MapPin,
        title: 'Dove ti piacerebbe allenarti?',
        help: 'Anche più di uno.',
        options: [
            {
                value: 'studio',
                label: 'In uno studio',
                hint: 'Lo spazio del trainer',
                icon: Building,
            },
            {
                value: 'home',
                label: 'A casa mia',
                hint: 'Il trainer viene da te',
                icon: House,
            },
            {
                value: 'park',
                label: 'Al parco',
                hint: 'All’aperto',
                icon: Trees,
            },
            {
                value: 'online',
                label: 'Online',
                hint: 'In videochiamata',
                icon: Video,
            },
        ],
    },
    {
        key: 'zone',
        kind: 'zone',
        category: 'Zona',
        icon: MapPin,
        title: 'Dove vuoi allenarti?',
        help: 'Cerca il quartiere, la via o il CAP: ti mostriamo i trainer più vicini.',
    },
    {
        key: 'times',
        kind: 'multiple',
        category: 'Orari',
        icon: Clock,
        title: 'Quando riesci ad allenarti?',
        help: 'Tutte le fasce che vanno bene.',
        options: [
            {
                value: 'early-morning',
                label: 'Mattina presto',
                hint: '7–9',
                icon: Sunrise,
            },
            {
                value: 'morning',
                label: 'In mattinata',
                hint: '9–12',
                icon: Sun,
            },
            {
                value: 'lunch',
                label: 'Pausa pranzo',
                hint: '12–14',
                icon: Coffee,
            },
            {
                value: 'afternoon',
                label: 'Pomeriggio',
                hint: '14–18',
                icon: Clock,
            },
            { value: 'evening', label: 'Sera', hint: 'Dopo le 18', icon: Moon },
            {
                value: 'weekend',
                label: 'Weekend',
                hint: 'Sabato e domenica',
                icon: Calendar,
            },
        ],
    },
    {
        key: 'budget',
        kind: 'single',
        category: 'Budget',
        icon: Wallet,
        title: 'Quanto vuoi spendere a seduta?',
        help: 'Prezzo indicativo: il pagamento si concorda con il trainer.',
        options: [
            { value: 'up-to-35', label: 'Fino a 35 €', glyph: '€' },
            { value: '35-45', label: '35–45 €', glyph: '€€' },
            { value: '45-60', label: '45–60 €', glyph: '€€€' },
            { value: 'over-60', label: 'Più di 60 €', glyph: '€€€€' },
            { value: 'any', label: 'Non ho preferenze', icon: Sparkles },
        ],
    },
    {
        key: 'level',
        kind: 'single',
        category: 'Livello',
        icon: SignalMedium,
        title: 'Qual è il tuo punto di partenza?',
        help: 'Ultima domanda: aiuta il trainer a calibrare la prima seduta.',
        options: [
            {
                value: 'beginner',
                label: 'Parto da zero',
                hint: 'O quasi',
                icon: SignalLow,
            },
            {
                value: 'occasional',
                label: 'Mi alleno ogni tanto',
                hint: 'Una volta a settimana o meno',
                icon: SignalMedium,
            },
            {
                value: 'regular',
                label: 'Mi alleno con regolarità',
                hint: 'Due o più volte a settimana',
                icon: SignalHigh,
            },
        ],
    },
];

export const emptyAnswers: QuizAnswers = {
    goal: null,
    disciplines: [],
    places: [],
    zone: null,
    radius: null,
    times: [],
    budget: null,
    level: null,
};

/** "online" in the zone answer = "Mi alleno solo online: la zona non conta". */
export const ONLINE_ZONE = 'online';

export const DEFAULT_RADIUS = '5';

export const radiusOptions = ['2', '5', '10'].map((km) => ({
    value: km,
    label: `Entro ${km} km`,
}));

/**
 * Suggestions of the "Zona" question; `zone` is the area sent to the server.
 * TODO: search real addresses and postcodes once trainers have a position.
 */
export const zoneSuggestions = [
    {
        label: 'Città Studi, Milano',
        detail: 'Piola, viale Romagna · 20133',
        zone: 'citta-studi-lambrate',
    },
    {
        label: 'Lambrate, Milano',
        detail: 'Ortica, Rubattino · 20134',
        zone: 'citta-studi-lambrate',
    },
    {
        label: 'Porta Romana, Milano',
        detail: 'Lodi, Crocetta · 20135',
        zone: 'navigli-porta-romana',
    },
    {
        label: 'Isola, Milano',
        detail: 'Garibaldi, Zara · 20159',
        zone: 'isola-bicocca',
    },
    {
        label: 'Monza',
        detail: 'Provincia di Monza e Brianza',
        zone: 'provincia',
    },
];

/** The first suggestion of an area, e.g. after opening a shared results link. */
export function zoneLabelOf(zone: string | null): string | null {
    if (zone === ONLINE_ZONE) {
        return 'Solo online';
    }

    return zoneSuggestions.find((item) => item.zone === zone)?.label ?? null;
}

/** True when the question has an answer, so "Avanti" can be pressed. */
export function isAnswered(
    question: QuizQuestion,
    answers: QuizAnswers,
): boolean {
    const value = answers[question.key];

    return Array.isArray(value) ? value.length > 0 : value !== null;
}

function labelOf(question: QuizQuestion, value: string): string {
    return question.kind === 'zone'
        ? value
        : (question.options.find((option) => option.value === value)?.label ??
              value);
}

/** The answer as text for the summaries, e.g. "Pilates, Functional". Empty if skipped. */
export function answerText(
    question: QuizQuestion,
    answers: QuizAnswers,
    zoneLabel: string | null,
): string {
    if (question.kind === 'zone') {
        if (answers.zone === null || zoneLabel === null) {
            return '';
        }

        return answers.zone === ONLINE_ZONE
            ? zoneLabel
            : `${zoneLabel} · entro ${answers.radius ?? DEFAULT_RADIUS} km`;
    }

    const value = answers[question.key];
    const values = Array.isArray(value) ? value : value === null ? [] : [value];

    return values.map((item) => labelOf(question, item)).join(', ');
}

const goalQuestion = questions[0];

/** "Libero di …" for each time slot of the "Orari" question. */
const freeAt: Record<string, string> = {
    'early-morning': 'Libero di mattina presto',
    morning: 'Libero in mattinata',
    lunch: 'Libero in pausa pranzo',
    afternoon: 'Libero di pomeriggio',
    evening: 'Libero di sera',
    weekend: 'Libero nel weekend',
};

/** The reasons of a suggested trainer as short texts. */
export function reasonTexts(reasons: QuizReason[]): string[] {
    if (reasons.length === 0) {
        return ['Profilo approvato dal nostro team'];
    }

    return reasons.map((reason) => {
        switch (reason.type) {
            case 'disciplines':
                return reason.disciplines.join(' e ');
            case 'goal': {
                const goal = labelOf(goalQuestion, reason.goal);

                return `Ideale per ${goal.charAt(0).toLowerCase()}${goal.slice(1)}`;
            }
            case 'zone':
                return 'Nella tua zona';
            case 'online':
                return 'Lavora online';
            case 'time':
                return freeAt[reason.time] ?? 'Libero nei tuoi orari';
            case 'budget':
                return 'Nel tuo budget';
        }
    });
}

/** "1" → "01", for the question numbers. */
export function padNumber(number: number): string {
    return String(number).padStart(2, '0');
}
