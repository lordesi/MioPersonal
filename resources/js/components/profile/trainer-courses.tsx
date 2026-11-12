import { Link } from '@inertiajs/react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import ProfileSection from '@/components/profile/profile-section';
import type { CourseSummary } from '@/types';

/** "Corsi che tiene": the gyms' courses where the trainer is the instructor. */
export default function TrainerCourses({
    courses,
    trainerFirstName,
}: {
    courses: CourseSummary[];
    trainerFirstName: string;
}) {
    if (courses.length === 0) {
        return null;
    }

    return (
        <ProfileSection
            titleId="courses-title"
            title="Corsi che tiene"
            description={`Ti alleni con ${trainerFirstName} anche in gruppo, nei corsi di queste palestre.`}
        >
            <ul className="flex flex-col gap-2.5">
                {courses.map((course) => (
                    <li key={course.id}>
                        <Link
                            href={course.href}
                            className="flex items-center gap-3.5 rounded-2xl border p-3 hover:bg-accent"
                        >
                            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
                                {course.photoUrl ? (
                                    <img
                                        src={course.photoUrl}
                                        alt=""
                                        loading="lazy"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <CalendarDays
                                        aria-hidden="true"
                                        className="size-6"
                                    />
                                )}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate font-semibold">
                                    {course.name}
                                    {course.bookable && (
                                        <span className="ml-2 text-xs font-medium text-muted-foreground">
                                            · prenoti online
                                        </span>
                                    )}
                                </span>
                                <span className="truncate text-sm text-muted-foreground">
                                    {course.when}
                                </span>
                                <span className="truncate text-sm text-muted-foreground">
                                    {course.gym.name}, {course.gym.city}
                                </span>
                            </span>
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4.5 shrink-0 text-muted-foreground"
                            />
                        </Link>
                    </li>
                ))}
            </ul>
        </ProfileSection>
    );
}
