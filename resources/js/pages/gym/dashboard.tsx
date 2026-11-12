import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, Circle, Eye, Inbox } from 'lucide-react';
import Panel from '@/components/trainer/area/panel';
import PageHeading from '@/components/trainer/area/page-heading';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import EventCard from '@/components/events/event-card';
import {
    amenities,
    courses,
    events,
    photos,
    plans,
    promotions,
    trainers,
} from '@/routes/gym';
import type { GroupSessionSummary, GymCourseDay } from '@/types';
import { edit as editProfile } from '@/routes/gym/profile';

type GymDashboardProps = {
    name: string;
    approved: boolean;
    checklist: {
        cover: boolean;
        gallery: number;
        hours: boolean;
        plans: number;
        promotions: number;
        trainers: number;
        /** Ticked services. */
        amenities: number;
        /** Active courses with weekly lessons. */
        courses: number;
    };
    /** Visits to the public profile in the last 30 days. */
    views: number;
    /** Trainers' requests waiting for an answer. */
    pendingCount: number;
    /** The next event the gym organizes, opening its page in "Eventi". */
    nextEvent: (GroupSessionSummary & { href: string }) | null;
    /** The courses' plan of today, the called off lessons too. */
    todayLessons: GymCourseDay['lessons'];
};

/** "Panoramica": how complete the profile is, numbers and requests. */
export default function GymDashboard({
    name,
    approved,
    checklist,
    views,
    pendingCount,
    nextEvent,
    todayLessons,
}: GymDashboardProps) {
    const items = [
        {
            done: checklist.cover && checklist.gallery >= 3,
            title: 'Copertina e almeno 3 foto',
            hint: `${checklist.gallery} foto nella galleria`,
            href: photos.url(),
        },
        {
            done: checklist.hours,
            title: 'Orari di apertura',
            hint: checklist.hours ? 'Indicati' : 'Da indicare',
            href: editProfile.url(),
        },
        {
            done: checklist.amenities > 0,
            title: 'Servizi',
            hint:
                checklist.amenities > 0
                    ? `${checklist.amenities} servizi indicati`
                    : 'Sala pesi, piscina, sauna…: si cercano anche così',
            href: amenities.url(),
        },
        {
            done: checklist.courses > 0,
            title: 'Corsi della settimana',
            hint:
                checklist.courses > 0
                    ? `${checklist.courses} ${checklist.courses === 1 ? 'corso' : 'corsi'} nel planner`
                    : 'Compaiono nella ricerca dei corsi',
            href: courses.url(),
        },
        {
            done: checklist.plans > 0,
            title: 'Abbonamenti',
            hint:
                checklist.plans === 1
                    ? '1 abbonamento'
                    : `${checklist.plans} abbonamenti`,
            href: plans.url(),
        },
        {
            done: checklist.promotions > 0,
            title: 'Una promozione attiva',
            hint:
                checklist.promotions > 0
                    ? `${checklist.promotions} attive`
                    : 'Fanno risaltare la palestra nella ricerca',
            href: promotions.url(),
        },
        {
            done: checklist.trainers > 0,
            title: 'I tuoi personal trainer',
            hint:
                checklist.trainers === 1
                    ? '1 trainer collegato'
                    : `${checklist.trainers} trainer collegati`,
            href: trainers.url(),
        },
    ];
    const done = items.filter((item) => item.done).length;

    return (
        <>
            <Head title="Panoramica" />

            <PageHeading title={name} eyebrow="Area palestra" />

            <div className="grid gap-4 md:grid-cols-3">
                <Panel title="Visite al profilo">
                    <span className="flex items-center gap-2 text-[32px] leading-10 font-bold tabular-nums">
                        <Eye aria-hidden="true" className="size-6" />
                        {views}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        Negli ultimi 30 giorni
                    </span>
                </Panel>
                <Panel title="Richieste dei trainer">
                    <span className="flex items-center gap-2 text-[32px] leading-10 font-bold tabular-nums">
                        <Inbox aria-hidden="true" className="size-6" />
                        {pendingCount}
                    </span>
                    <Link
                        href={trainers()}
                        className="text-sm font-medium underline underline-offset-4"
                    >
                        Vai ai trainer
                    </Link>
                </Panel>
                <Panel title="Trainer collegati">
                    <span className="text-[32px] leading-10 font-bold tabular-nums">
                        {checklist.trainers}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        Compaiono nel profilo della palestra
                    </span>
                </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel
                    title="Lezioni di oggi"
                    action={
                        <Link
                            href={courses()}
                            className="text-sm font-medium underline underline-offset-4"
                        >
                            {checklist.courses > 0
                                ? 'Planner'
                                : 'Crea un corso'}
                        </Link>
                    }
                >
                    {todayLessons.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                            {checklist.courses > 0
                                ? 'Nessuna lezione oggi.'
                                : 'I corsi della settimana compaiono nel profilo e nella ricerca dei corsi.'}
                        </span>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {todayLessons.map((lesson) => (
                                <li
                                    key={lesson.lessonId}
                                    className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm"
                                >
                                    <span
                                        className={cn(
                                            'min-w-0 truncate',
                                            lesson.cancelled &&
                                                'text-muted-foreground line-through',
                                        )}
                                    >
                                        <span className="font-semibold tabular-nums">
                                            {lesson.start}–{lesson.end}
                                        </span>{' '}
                                        {lesson.name}
                                        {lesson.room && ` · ${lesson.room}`}
                                    </span>
                                    {lesson.cancelled ? (
                                        <span className="shrink-0 text-muted-foreground">
                                            Annullata
                                        </span>
                                    ) : (
                                        lesson.bookable && (
                                            <span className="shrink-0 text-muted-foreground tabular-nums">
                                                {lesson.registered}/
                                                {lesson.capacity} iscritti
                                            </span>
                                        )
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    title="Prossimo evento"
                    action={
                        <Link
                            href={events()}
                            className="text-sm font-medium underline underline-offset-4"
                        >
                            {nextEvent ? 'Tutti gli eventi' : 'Crea un evento'}
                        </Link>
                    }
                >
                    {nextEvent ? (
                        <EventCard
                            event={nextEvent}
                            href={nextEvent.href}
                            className="max-w-md"
                        />
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            Open day, workshop, allenamenti di gruppo: compaiono
                            nel profilo e nella ricerca degli eventi.
                        </span>
                    )}
                </Panel>
            </div>

            <Panel
                title={`Completa il profilo · ${done} di ${items.length}`}
                action={
                    !approved ? (
                        <span className="text-sm text-muted-foreground">
                            Visibile dopo l’approvazione
                        </span>
                    ) : undefined
                }
            >
                <ul className="flex flex-col divide-y">
                    {items.map((item) => (
                        <li key={item.title}>
                            <Link
                                href={item.href}
                                className="flex items-center gap-3 py-3 hover:bg-accent/50"
                            >
                                <span
                                    className={cn(
                                        'flex size-7 shrink-0 items-center justify-center rounded-full',
                                        item.done
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {item.done ? (
                                        <Check
                                            aria-label="fatto"
                                            strokeWidth={3}
                                            className="size-4"
                                        />
                                    ) : (
                                        <Circle
                                            aria-label="da fare"
                                            className="size-5"
                                        />
                                    )}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="font-semibold">
                                        {item.title}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {item.hint}
                                    </span>
                                </span>
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4 text-muted-foreground"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
                <Button asChild variant="outline" className="self-start">
                    <Link href={editProfile()}>Modifica profilo</Link>
                </Button>
            </Panel>
        </>
    );
}

GymDashboard.layout = { section: 'dashboard' };
