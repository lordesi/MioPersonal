import { Link, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    User,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Chip } from '@/components/mp/filter-chips';
import { romeParts } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import type { GymCourseDay, GymCourseInfo, GymCourseLessonSlot } from '@/types';

type GymCoursePlannerProps = {
    /** This week and the next one. */
    weeks: GymCourseDay[][];
    courses: GymCourseInfo[];
};

const ALL = 'all';

/**
 * "Corsi" on the public profile of a gym: the plan of the week, day by day
 * (today first), with the lessons called off marked; then the courses with
 * photos and description. Only to look at: the gym's members book at the
 * gym.
 */
export default function GymCoursePlanner({
    weeks,
    courses,
}: GymCoursePlannerProps) {
    const [today] = useState(() => romeParts(new Date()).date);
    const { url } = usePage();
    // "?corso=12": opened from a course card (search, home, trainer's profile).
    const [courseId, setCourseId] = useState<number | null>(() => {
        const wanted = Number(
            new URLSearchParams(url.split('?')[1] ?? '').get('corso'),
        );

        return courses.some((course) => course.id === wanted) ? wanted : null;
    });
    const focused = courses.find((course) => course.id === courseId) ?? null;
    const ofCourse = (lesson: GymCourseLessonSlot) =>
        courseId === null || lesson.courseId === courseId;
    // The first day (from today) with a lesson of the course, else today.
    const [start] = useState(() => {
        for (const [index, days] of weeks.entries()) {
            const day = days.find(
                (item) =>
                    item.date >= today &&
                    item.lessons.some((lesson) => ofCourse(lesson)),
            );

            if (courseId !== null && day) {
                return { weekIndex: index, date: day.date };
            }
        }

        return {
            weekIndex: 0,
            date:
                weeks[0]?.find((day) => day.date === today)?.date ??
                weeks[0]?.[0]?.date ??
                '',
        };
    });
    const [weekIndex, setWeekIndex] = useState(start.weekIndex);
    const week = weeks[weekIndex] ?? [];
    const [date, setDate] = useState(start.date);
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
        (lesson) =>
            ofCourse(lesson) &&
            (discipline === ALL || lesson.discipline === discipline),
    );

    const changeWeek = (index: number) => {
        setWeekIndex(index);
        // The same weekday in the other week.
        const position = week.findIndex((item) => item.date === date);
        setDate(weeks[index]?.[Math.max(0, position)]?.date ?? '');
    };

    return (
        <div className="flex flex-col gap-5">
            {focused && (
                <p
                    role="status"
                    className="flex flex-wrap items-center gap-2 rounded-[20px] px-4 py-3 text-[15px] shadow-[inset_0_0_0_1px_var(--brand)]"
                >
                    <span className="flex-1">
                        Stai vedendo solo <strong>{focused.name}</strong>
                        {' · '}
                        {focused.when}
                    </span>
                    <button
                        type="button"
                        onClick={() => setCourseId(null)}
                        className="inline-flex h-9 items-center gap-1 rounded-full px-3.5 font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)] hover:bg-brand/10"
                    >
                        <X aria-hidden="true" className="size-3.5" />
                        Tutti i corsi
                    </button>
                </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                    role="group"
                    aria-label="Settimana"
                    className="flex flex-wrap gap-2"
                >
                    {['Questa settimana', 'La prossima'].map((label, index) => (
                        <Chip
                            key={label}
                            pressed={weekIndex === index}
                            onClick={() => changeWeek(index)}
                        >
                            {label}
                        </Chip>
                    ))}
                </div>
                {disciplines.length > 1 && (
                    <div
                        role="group"
                        aria-label="Disciplina"
                        className="flex flex-wrap gap-2"
                    >
                        {[ALL, ...disciplines].map((name) => (
                            <Chip
                                key={name}
                                pressed={discipline === name}
                                onClick={() => setDiscipline(name)}
                            >
                                {name === ALL ? 'Tutti' : name}
                            </Chip>
                        ))}
                    </div>
                )}
            </div>

            {/* The days: scroll sideways on phones. */}
            <div
                role="tablist"
                aria-label="Giorno"
                className="-mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden"
            >
                {week.map((item) => {
                    const selected = item.date === day?.date;
                    const count = item.lessons.filter(
                        (lesson) =>
                            !lesson.cancelled &&
                            ofCourse(lesson) &&
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
                                'flex min-w-17 flex-none flex-col items-center gap-0.5 rounded-[14px] px-2.5 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                selected
                                    ? 'text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]'
                                    : 'shadow-[inset_0_0_0_1px_var(--field)] hover:bg-foreground/5',
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
                                        ? 'text-brand/80'
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
                <p className="rounded-[20px] bg-card px-4 py-3 text-[15px] text-muted-foreground">
                    Nessun corso {day ? `di ${day.label.toLowerCase()}` : ''}.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {lessons.map((lesson) => (
                        <li
                            key={lesson.lessonId}
                            className={cn(
                                'flex flex-wrap items-start gap-x-4 gap-y-1.5 rounded-[20px] bg-card p-4',
                                lesson.cancelled && 'opacity-60',
                            )}
                        >
                            <span className="flex w-24 flex-none items-center gap-1.5 text-[15px] font-bold tabular-nums">
                                <Clock
                                    aria-hidden="true"
                                    className="size-4 text-brand"
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
                                    <span className="flex h-5.5 items-center rounded-full border border-field px-2 text-[11px] font-semibold">
                                        {lesson.level}
                                    </span>
                                    {lesson.cancelled && (
                                        <span className="flex h-5.5 items-center rounded-full border border-destructive px-2 text-[11px] font-semibold text-destructive">
                                            Annullata
                                        </span>
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
                                    {lesson.capacity !== null && (
                                        <span className="flex items-center gap-1 tabular-nums">
                                            <Users
                                                aria-hidden="true"
                                                className="size-3.5"
                                            />
                                            Max {lesson.capacity} posti
                                        </span>
                                    )}
                                </span>
                                {lesson.cancelled && lesson.cancelNote && (
                                    <span className="text-[13px]">
                                        «{lesson.cancelNote}»
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <p className="text-[13px] text-muted-foreground">
                Orari indicativi. I corsi sono per gli iscritti alla palestra:
                per partecipare chiedi direttamente a loro.
            </p>

            {courses.length > 0 && (
                <ul className="grid gap-2 md:grid-cols-2 md:gap-4">
                    {courses.map((course) => (
                        <li
                            key={course.id}
                            className={cn(
                                'flex flex-col overflow-hidden rounded-[26px] bg-card',
                                course.id === courseId &&
                                    'ring-[1.5px] ring-brand',
                            )}
                        >
                            {course.photos.length > 0 && (
                                <CoursePhotoStrip
                                    name={course.name}
                                    photos={course.photos}
                                />
                            )}
                            <div className="flex flex-col gap-1.5 p-5">
                                <h3 className="text-[17px] font-semibold">
                                    {course.name}
                                </h3>
                                <p className="text-[13px] text-muted-foreground">
                                    {[
                                        course.when,
                                        course.level,
                                        course.maxPlaces !== null &&
                                            `max ${course.maxPlaces} posti`,
                                        course.instructor &&
                                            `con ${course.instructor}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                {course.description && (
                                    <p className="text-[15px] leading-5.5 break-words whitespace-pre-line text-muted-foreground">
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

/**
 * The photos of a course, side by side: swipe on phones, arrows elsewhere.
 * One photo is just the photo.
 */
function CoursePhotoStrip({
    name,
    photos,
}: {
    name: string;
    photos: string[];
}) {
    const [index, setIndex] = useState(0);
    const many = photos.length > 1;
    const go = (step: number) =>
        setIndex((current) => (current + step + photos.length) % photos.length);

    return (
        <div className="relative aspect-16/9 w-full overflow-hidden bg-muted">
            <img
                src={photos[index]}
                alt={
                    many
                        ? `${name}, foto ${index + 1} di ${photos.length}`
                        : name
                }
                loading="lazy"
                className="size-full object-cover"
            />
            {many && (
                <>
                    <button
                        type="button"
                        aria-label="Foto precedente"
                        onClick={() => go(-1)}
                        className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-foreground shadow-[inset_0_0_0_1px_var(--field)] hover:bg-background/90"
                    >
                        <ChevronLeft aria-hidden="true" className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Foto successiva"
                        onClick={() => go(1)}
                        className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-foreground shadow-[inset_0_0_0_1px_var(--field)] hover:bg-background/90"
                    >
                        <ChevronRight aria-hidden="true" className="size-4" />
                    </button>
                    <span className="absolute right-2 bottom-2 rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                        {index + 1}/{photos.length}
                    </span>
                </>
            )}
        </div>
    );
}
