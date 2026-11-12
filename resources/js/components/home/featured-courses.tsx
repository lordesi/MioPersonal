import CardCarousel, {
    carouselCardClass,
} from '@/components/home/card-carousel';
import CourseCard from '@/components/gym/course-card';
import { courseSearchUrl } from '@/lib/course';
import { cn } from '@/lib/utils';
import type { CourseSummary } from '@/types';

/**
 * "Corsi in palestra" (HomeController): the courses of the gyms, the ones
 * booked on MioPersonal first. Hidden when there are none.
 */
export default function FeaturedCourses({
    courses,
}: {
    courses: CourseSummary[];
}) {
    if (courses.length === 0) {
        return null;
    }

    return (
        <CardCarousel
            title="Corsi in palestra"
            titleId="featured-courses-title"
            href={courseSearchUrl()}
            linkLabel="Vedi tutti"
            prevLabel="Corsi precedenti"
            nextLabel="Corsi successivi"
            className="pb-10 md:pb-18"
        >
            {courses.map((course) => (
                // Upright in the carousel, also on phones.
                <CourseCard
                    key={course.id}
                    course={course}
                    className={cn(
                        carouselCardClass,
                        'flex-col rounded-[20px] [&>span:first-child]:aspect-16/9 [&>span:first-child]:min-h-0 [&>span:first-child]:w-full',
                    )}
                />
            ))}
        </CardCarousel>
    );
}
