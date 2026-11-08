import { Link, router, usePage } from '@inertiajs/react';
import { Clock, MapPin, User, Users } from 'lucide-react';
import { useState } from 'react';
import ChoiceChips from '@/components/shared/choice-chips';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { romeParts } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { show as eventPage } from '@/routes/events';
import { register, start } from '@/routes/gyms/lessons';
import type { GymCourseDay, GymCourseInfo, GymCourseLessonSlot } from '@/types';

type GymCoursePlannerProps = {
    /** This week and the next one. */
    weeks: GymCourseDay[][];
    courses: GymCourseInfo[];
    /** The gym: "Prenota il posto" for the courses with places on MioPersonal. */
    gymSlug?: string;
};

const ALL = 'all';

/**
 * "Corsi" on the public profile of a gym: the plan of the week, day by day
 * (today first), with the lessons called off marked; then the courses with
 * photo and description. The courses with "Prenotazione posto" are booked
 * here; the others at the gym.
 */
export default function GymCoursePlanner({
    weeks,
    courses,
    gymSlug,
}: GymCoursePlannerProps) {
    const [today] = useState(() => romeParts(new Date()).date);
    const [weekIndex, setWeekIndex] = useState(0);
    const week = weeks[weekIndex] ?? [];
    const [date, setDate] = useState(
        () =>
            weeks[0]?.find((day) => day.date === today)?.date ??
            weeks[0]?.[0]?.date ??
            '',
    );
    const [discipline, setDiscipline] = useState(ALL);
    const disciplines = [
        ...new Set(
            courses
                .map((course) => course.discipline)
                .filter((name): name is string => name !== null),
        ),
    ];

    const day = week.find((item) => item.date === date) ?? week[0];
    const lessons = (day?.lessons ?? []).filter(
        (lesson) => discipline === ALL || lesson.discipline === discipline,
    );

    const changeWeek = (index: number) => {
        setWeekIndex(index);
        // The same weekday in the other week.
        const position = week.findIndex((item) => item.date === date);
        setDate(weeks[index]?.[Math.max(0, position)]?.date ?? '');
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ChoiceChips
                    aria-label="Settimana"
                    options={[
                        { value: '0', label: 'Questa settimana' },
                        { value: '1', label: 'La prossima' },
                    ]}
                    value={String(weekIndex)}
                    onChange={(value) => changeWeek(Number(value))}
                />
                {disciplines.length > 1 && (
                    <ChoiceChips
                        aria-label="Disciplina"
                        className="gap-1.5"
                        options={[
                            { value: ALL, label: 'Tutti' },
                            ...disciplines.map((name) => ({
                                value: name,
                                label: name,
                            })),
                        ]}
                        value={discipline}
                        onChange={setDiscipline}
                    />
                )}
            </div>

            {/* The days: scroll sideways on phones. */}
            <div
                role="tablist"
                aria-label="Giorno"
                className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
            >
                {week.map((item) => {
                    const selected = item.date === day?.date;
                    const count = item.lessons.filter(
                        (lesson) =>
                            !lesson.cancelled &&
                            (discipline === ALL ||
                                lesson.discipline === discipline),
                    ).length;

                    return (
                        <button
                            key={item.date}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setDate(item.date)}
                            className={cn(
                                'flex min-w-17 flex-none flex-col items-center gap-0.5 rounded-xl border px-2.5 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30',
                                selected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'bg-background hover:border-foreground/40',
                            )}
                        >
                            <span className="font-semibold">
                                {item.label.slice(0, 3)}
                                {item.date === today && ' · oggi'}
                            </span>
                            <span
                                className={cn(
                                    'text-xs tabular-nums',
                                    selected
                                        ? 'text-primary-foreground/70'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {Number(item.date.slice(8, 10))} ·{' '}
                                {count === 1 ? '1 corso' : `${count} corsi`}
                            </span>
                        </button>
                    );
                })}
            </div>

            {lessons.length === 0 ? (
                <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                    Nessun corso {day ? `di ${day.label.toLowerCase()}` : ''}.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {lessons.map((lesson) => (
                        <li
                            key={lesson.lessonId}
                            className={cn(
                                'flex flex-wrap items-start gap-x-4 gap-y-1.5 rounded-2xl border bg-card p-3.5',
                                lesson.cancelled && 'opacity-60',
                            )}
                        >
                            <span className="flex w-24 flex-none items-center gap-1.5 text-[15px] font-bold tabular-nums">
                                <Clock
                                    aria-hidden="true"
                                    className="size-4 text-muted-foreground"
                                />
                                {lesson.start}–{lesson.end}
                            </span>
                            <span className="flex min-w-50 flex-1 flex-col gap-1">
                                <span className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={cn(
                                            'text-[15px] font-semibold',
                                            lesson.cancelled && 'line-through',
                                        )}
                                    >
                                        {lesson.name}
                                    </span>
                                    <Badge variant="secondary">
                                        {lesson.level}
                                    </Badge>
                                    {lesson.cancelled && (
                                        <Badge variant="outline">
                                            Annullata
                                        </Badge>
                                    )}
                                </span>
                                <span className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                                    {lesson.instructor && (
                                        <span className="flex items-center gap-1">
                                            <User
                                                aria-hidden="true"
                                                className="size-3.5"
                                            />
                                            {lesson.instructorHref ? (
                                                <Link
                                                    href={lesson.instructorHref}
                                                    className="underline underline-offset-2 hover:text-foreground"
                                                >
                                                    {lesson.instructor}
                                                </Link>
                                            ) : (
                                                lesson.instructor
                                            )}
                                        </span>
                                    )}
                                    {lesson.room && (
                                        <span className="flex items-center gap-1">
                                            <MapPin
                                                aria-hidden="true"
                                                className="size-3.5"
                                            />
                                            {lesson.room}
                                        </span>
                                    )}
                                    {lesson.capacity && !lesson.bookable && (
                                        <span className="flex items-center gap-1">
                                            <Users
                                                aria-hidden="true"
                                                className="size-3.5"
                                            />
                                            {lesson.capacity} posti
                                        </span>
                                    )}
                                </span>
                                {lesson.cancelled && lesson.cancelNote && (
                                    <span className="text-[13px]">
                                        «{lesson.cancelNote}»
                                    </span>
                                )}
                            </span>
                            {gymSlug && day && lesson.bookable && (
                                <LessonPlace
                                    lesson={lesson}
                                    date={day.date}
                                    gymSlug={gymSlug}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <p className="text-xs text-muted-foreground">
                {week.some((item) =>
                    item.lessons.some((lesson) => lesson.bookable),
                )
                    ? 'Dove vedi “Prenota il posto” prenoti qui, confermato subito; per gli altri corsi chiedi alla palestra.'
                    : 'Orari indicativi: per i posti chiedi alla palestra.'}
            </p>

            {courses.length > 0 && (
                <ul className="grid gap-3 md:grid-cols-2">
                    {courses.map((course) => (
                        <li
                            key={course.id}
                            className="flex flex-col overflow-hidden rounded-2xl border bg-card"
                        >
                            {course.photoUrl && (
                                <img
                                    src={course.photoUrl}
                                    alt={course.name}
                                    loading="lazy"
                                    className="aspect-16/9 w-full object-cover"
                                />
                            )}
                            <div className="flex flex-col gap-1.5 p-4">
                                <h3 className="text-base font-semibold">
                                    {course.name}
                                </h3>
                                <p className="text-[13px] text-muted-foreground">
                                    {[
                                        course.when,
                                        course.level,
                                        course.instructor &&
                                            `con ${course.instructor}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                {course.description && (
                                    <p className="text-sm leading-5.5 break-words whitespace-pre-line text-foreground/80">
                                        {course.description}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/** "Prenota il posto" of a lesson: places left, the client's place, or login. */
function LessonPlace({
    lesson,
    date,
    gymSlug,
}: {
    lesson: GymCourseLessonSlot;
    date: string;
    gymSlug: string;
}) {
    const { auth } = usePage().props;
    const [busy, setBusy] = useState(false);
    const remaining = lesson.remaining ?? 0;

    if (lesson.cancelled || lesson.started) {
        return null;
    }

    const places = (
        <span className="flex items-center gap-1 text-[13px] text-muted-foreground tabular-nums">
            <Users aria-hidden="true" className="size-3.5" />
            {remaining === 0
                ? 'Esaurita'
                : remaining === 1
                  ? '1 posto libero'
                  : `${remaining} posti liberi`}
        </span>
    );

    let action = null;

    if (lesson.booked) {
        action = (
            <Button asChild size="sm" variant="secondary">
                <Link
                    href={
                        lesson.eventSlug ? eventPage.url(lesson.eventSlug) : '#'
                    }
                >
                    Prenotato ✓
                </Link>
            </Button>
        );
    } else if (remaining > 0 && !auth?.user) {
        action = (
            <Button asChild size="sm">
                <Link href={start.url(gymSlug)}>Accedi per prenotare</Link>
            </Button>
        );
    } else if (remaining > 0 && auth?.user?.role === 'client') {
        action = (
            <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() =>
                    router.post(
                        register.url({
                            slug: gymSlug,
                            lesson: lesson.lessonId,
                        }),
                        { date },
                        {
                            preserveScroll: true,
                            onStart: () => setBusy(true),
                            onFinish: () => setBusy(false),
                            onError: (errors) =>
                                toast.error(
                                    Object.values(errors)[0] ??
                                        'Riprova tra poco.',
                                ),
                        },
                    )
                }
            >
                Prenota il posto
            </Button>
        );
    }

    return (
        <span className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
            {places}
            {action}
        </span>
    );
}
