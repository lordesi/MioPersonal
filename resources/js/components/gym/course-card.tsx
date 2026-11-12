import { Link } from '@inertiajs/react';
import { Building2, CalendarDays, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CourseSummary } from '@/types';

const pill = 'h-5.5 rounded-full px-2 text-xs font-medium';

/**
 * A course in the lists: photo, level, name, when, the gym and the city.
 * Opens the gym's page with the plan of the course. Sideways on phones, like
 * the event cards.
 */
export default function CourseCard({
    course,
    className,
}: {
    course: CourseSummary;
    className?: string;
}) {
    return (
        <Link
            href={course.href}
            aria-label={[
                course.name,
                course.when,
                `${course.gym.name}, ${course.gym.city}`,
                course.maxPlaces !== null
                    ? `massimo ${course.maxPlaces} posti`
                    : null,
            ]
                .filter(Boolean)
                .join(', ')}
            className={cn(
                'flex h-full flex-row overflow-hidden rounded-2xl border bg-card text-foreground transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:flex-col sm:rounded-[20px]',
                className,
            )}
        >
            <span className="relative flex min-h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-primary text-primary-foreground sm:aspect-16/9 sm:min-h-0 sm:w-full">
                {course.photoUrl ? (
                    <img
                        src={course.photoUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                    />
                ) : (
                    <CalendarDays aria-hidden="true" className="size-8" />
                )}
                {course.maxPlaces !== null && (
                    <span className="absolute top-2 left-2 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground tabular-nums shadow sm:top-3 sm:left-3 sm:text-xs">
                        Max {course.maxPlaces} posti
                    </span>
                )}
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
                <span className="flex flex-wrap gap-1.5">
                    {course.discipline && (
                        <Badge variant="secondary" className={pill}>
                            {course.discipline}
                        </Badge>
                    )}
                    <Badge variant="outline" className={pill}>
                        {course.level}
                    </Badge>
                </span>
                <span className="line-clamp-2 text-base leading-5.5 font-semibold sm:text-[17px] sm:leading-6">
                    {course.name}
                </span>
                <span className="flex items-start gap-1 text-sm text-muted-foreground tabular-nums">
                    <Clock
                        aria-hidden="true"
                        className="mt-0.5 size-3.5 shrink-0"
                    />
                    <span className="line-clamp-2">{course.when}</span>
                </span>
                <span className="mt-auto flex items-center gap-1 pt-1 text-sm font-medium">
                    <Building2
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                    />
                    <span className="truncate">{course.gym.name}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3 shrink-0" />
                    <span className="truncate">
                        {course.gym.city}
                        {course.instructor && ` · con ${course.instructor}`}
                    </span>
                </span>
            </span>
        </Link>
    );
}

/** The grid of the course cards, as the other searches. */
export function CourseGrid({ courses }: { courses: CourseSummary[] }) {
    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 sm:gap-5">
            {courses.map((course) => (
                <li key={course.id} className="flex">
                    <CourseCard course={course} className="flex-1" />
                </li>
            ))}
        </ul>
    );
}
