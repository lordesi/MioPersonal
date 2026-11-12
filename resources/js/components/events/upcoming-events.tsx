import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { EventGrid } from '@/components/events/event-card';
import { cn } from '@/lib/utils';
import { search } from '@/routes/events';
import type { GroupSessionSummary } from '@/types';

/**
 * "Prossimi eventi" on the profile of a trainer or a gym, and in the client
 * home ("I miei eventi"). Hidden when empty.
 */
export default function UpcomingEvents({
    events,
    title = 'Prossimi eventi',
    id = 'events-title',
    showAll = true,
    allHref = search.url(),
    className,
}: {
    events: GroupSessionSummary[];
    title?: string;
    id?: string;
    /** The link to /eventi. */
    showAll?: boolean;
    /** Where "Tutti gli eventi" goes, e.g. the events of the city. */
    allHref?: string;
    className?: string;
}) {
    if (events.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby={id}
            className={cn('flex flex-col gap-3.5', className)}
        >
            <div className="flex flex-wrap items-end justify-between gap-3">
                <h2
                    id={id}
                    className="flex items-center gap-2 text-xl leading-7 font-semibold tracking-tight"
                >
                    <CalendarDays aria-hidden="true" className="size-5" />
                    {title}
                </h2>
                {showAll && (
                    <Link
                        href={allHref}
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium md:min-h-0"
                    >
                        Tutti gli eventi
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                )}
            </div>
            <EventGrid events={events} />
        </section>
    );
}
