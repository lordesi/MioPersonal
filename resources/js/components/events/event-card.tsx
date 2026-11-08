import { Link } from '@inertiajs/react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { dateBlockParts, formatDateMedium, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { GroupSessionSummary } from '@/types';

const pill = 'h-5.5 rounded-full px-2 text-xs font-medium';

/** "Ultimi 3 posti", "Esauriti", "12 posti". */
export function placesLabel(event: GroupSessionSummary): string {
    if (event.remaining === 0) {
        return 'Posti esauriti';
    }

    if (event.remaining <= 3) {
        return event.remaining === 1
            ? 'Ultimo posto'
            : `Ultimi ${event.remaining} posti`;
    }

    return `${event.remaining} posti liberi`;
}

/** "Sab 14 dicembre · 10:00–11:30" */
export function eventWhen(event: Pick<GroupSessionSummary, 'start' | 'end'>) {
    return `${formatDateMedium(event.start)} · ${formatTime(event.start)}–${formatTime(event.end)}`;
}

/**
 * An event in the lists: the cover with the date, the type, the title, when
 * and where, the price and the places left.
 */
export default function EventCard({
    event,
    href = event.href,
    className,
}: {
    event: GroupSessionSummary;
    /** The organizer area opens its own page. */
    href?: string;
    className?: string;
}) {
    const day = dateBlockParts(event.start);
    const soldOut = event.remaining === 0;

    return (
        <Link
            href={href}
            aria-label={[
                event.title,
                eventWhen(event),
                event.place,
                event.price,
                event.cancelled ? 'annullato' : placesLabel(event),
            ].join(', ')}
            className={cn(
                'flex h-full flex-row overflow-hidden rounded-2xl border bg-card text-foreground transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:flex-col sm:rounded-[20px]',
                event.cancelled && 'opacity-70',
                className,
            )}
        >
            <span className="relative flex min-h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-primary text-primary-foreground sm:aspect-16/9 sm:min-h-0 sm:w-full">
                {event.coverUrl ? (
                    <img
                        src={event.coverUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                    />
                ) : (
                    <CalendarDays aria-hidden="true" className="size-8" />
                )}
                <span
                    aria-hidden="true"
                    className="absolute top-2 left-2 flex min-w-11 flex-col items-center rounded-xl bg-background px-2 py-1 text-foreground shadow sm:top-3 sm:left-3"
                >
                    <span className="text-[11px] leading-3.5 font-semibold text-muted-foreground uppercase">
                        {day.month}
                    </span>
                    <span className="text-lg leading-5.5 font-bold tabular-nums">
                        {day.day}
                    </span>
                </span>
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
                <span className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className={pill}>
                        {event.typeLabel}
                    </Badge>
                    {event.cancelled ? (
                        <Badge variant="destructive" className={pill}>
                            Annullato
                        </Badge>
                    ) : (
                        <Badge
                            variant={soldOut ? 'outline' : 'secondary'}
                            className={pill}
                        >
                            {event.price}
                        </Badge>
                    )}
                </span>
                <span className="line-clamp-2 text-base leading-5.5 font-semibold sm:text-[17px] sm:leading-6">
                    {event.title}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                    {eventWhen(event)}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="truncate">{event.place}</span>
                </span>
                {!event.cancelled && (
                    <span
                        className={cn(
                            'mt-auto flex items-center gap-1 pt-1 text-sm font-medium',
                            soldOut
                                ? 'text-muted-foreground'
                                : 'text-foreground',
                        )}
                    >
                        <Users aria-hidden="true" className="size-3.5" />
                        {placesLabel(event)}
                    </span>
                )}
                {event.hosts.length > 0 && (
                    <span className="truncate text-xs text-muted-foreground">
                        con {event.hosts.map((host) => host.name).join(', ')}
                    </span>
                )}
            </span>
        </Link>
    );
}

/** The grid of the event cards, as the other searches. */
export function EventGrid({
    events,
    hrefOf,
}: {
    events: GroupSessionSummary[];
    hrefOf?: (event: GroupSessionSummary) => string;
}) {
    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 sm:gap-5">
            {events.map((event) => (
                <li key={event.id} className="flex">
                    <EventCard
                        event={event}
                        href={hrefOf?.(event)}
                        className="flex-1"
                    />
                </li>
            ))}
        </ul>
    );
}
