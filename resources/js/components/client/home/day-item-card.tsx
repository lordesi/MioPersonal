import { Link } from '@inertiajs/react';
import { ChevronDown, MapPin, MessageCircle, Navigation } from 'lucide-react';
import { useId } from 'react';
import {
    AreaBadge,
    areaButtonClassName,
    openCardClassName,
    roundButtonClassName,
} from '@/components/mp/area-bits';
import type { BadgeTone } from '@/components/mp/area-bits';
import { Initials } from '@/components/trainer/ui/bits';
import { addDays, romeParts } from '@/lib/calendar';
import { formatDayLong, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClientDayItem } from '@/types';

type DayItemCardProps = {
    item: ClientDayItem;
    open: boolean;
    onToggle: () => void;
    now: Date;
};

type Badge = { label: string; tone: 'soon' | 'normal' | 'pending' | 'done' };

const BADGE_TONES: Record<Badge['tone'], BadgeTone> = {
    soon: 'solid',
    normal: 'neutral',
    pending: 'warning',
    done: 'neutral',
};

/**
 * A session or an event of the chosen day in the client's "Home". Closed:
 * who, when and a badge ("Tra 2 h", "Stasera", "In attesa", "Svolta"). Open:
 * the time in big, the place, the package, and Scrivi, Indicazioni and
 * "Vedi dettagli".
 */
export default function DayItemCard({
    item,
    open,
    onToggle,
    now,
}: DayItemCardProps) {
    const panelId = useId();
    const badge = badgeOf(item, now);
    const time = `${formatTime(item.start)}–${formatTime(item.end)}`;
    const firstName = item.title.split(' ')[0];
    const online = /online/i.test(item.placeLabel);

    return (
        <article
            className={cn(
                'flex flex-col gap-4.5 rounded-[24px] bg-card',
                open ? cn('p-4', openCardClassName) : 'py-3 pr-3 pl-4',
                badge.tone === 'done' && !open && 'text-muted-foreground',
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={panelId}
                className="-my-1 flex w-full items-center gap-3 rounded-2xl py-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <Initials
                    name={item.title}
                    src={item.avatar}
                    size={44}
                    tone={item.kind === 'trainer' ? 'next' : undefined}
                    className={
                        item.kind === 'event'
                            ? 'bg-secondary text-foreground'
                            : undefined
                    }
                />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[17px] leading-5.5 font-semibold tracking-[-0.43px] text-foreground">
                        {item.title}
                    </span>
                    <span className="truncate text-[15px] leading-5 text-muted-foreground tabular-nums">
                        {time} · {item.activity}
                    </span>
                </span>
                <AreaBadge tone={BADGE_TONES[badge.tone]}>
                    {badge.label}
                </AreaBadge>
                <span className="flex size-10 shrink-0 items-center justify-center">
                    <ChevronDown
                        aria-hidden="true"
                        className={cn(
                            'size-5 text-muted-foreground transition-transform duration-150',
                            open && 'rotate-180',
                        )}
                    />
                </span>
            </button>

            {open && (
                <div id={panelId} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[28px] leading-8.5 font-bold tracking-[-0.01em] text-foreground tabular-nums">
                            {time}
                        </span>
                        <span className="flex items-center gap-1.5 text-[15px] leading-5 text-muted-foreground">
                            <MapPin
                                aria-hidden="true"
                                className="size-4 shrink-0"
                            />
                            {item.placeLabel}
                        </span>
                        {item.packageLabel && (
                            <span className="mt-1 self-start rounded-full bg-brand-soft px-3 py-1.25 text-[13px] leading-4.5 font-semibold text-brand">
                                {item.packageLabel}
                            </span>
                        )}
                        {item.status === 'pending' && (
                            <p className="mt-2 text-[15px] leading-5 text-muted-foreground">
                                In attesa della conferma di {firstName}.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2.5">
                        {item.messageHref && (
                            <Link
                                href={item.messageHref}
                                aria-label={`Scrivi a ${firstName}`}
                                title="Scrivi"
                                className={roundButtonClassName}
                            >
                                <MessageCircle
                                    aria-hidden="true"
                                    className="size-5.5"
                                />
                            </Link>
                        )}
                        {!online && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.placeLabel)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Indicazioni per ${item.placeLabel}`}
                                title="Indicazioni"
                                className={roundButtonClassName}
                            >
                                <Navigation
                                    aria-hidden="true"
                                    className="size-5.5"
                                />
                            </a>
                        )}
                        <Link
                            href={item.detailsHref}
                            className={cn(
                                areaButtonClassName('primary', 'lg'),
                                'flex-1',
                            )}
                        >
                            Vedi dettagli
                        </Link>
                    </div>
                </div>
            )}
        </article>
    );
}

/** The badge of a closed card, from the time and the status. */
function badgeOf(item: ClientDayItem, now: Date): Badge {
    const start = new Date(item.start);
    const end = new Date(item.end);

    if (item.cancelled) {
        return { label: 'Annullato', tone: 'pending' };
    }

    if (item.status === 'pending') {
        return { label: 'Da confermare', tone: 'pending' };
    }

    if (end <= now) {
        return {
            label: item.kind === 'event' ? 'Concluso' : 'Svolta',
            tone: 'done',
        };
    }

    if (start <= now) {
        return { label: 'In corso', tone: 'soon' };
    }

    const today = romeParts(now).date;
    const { date, hour } = romeParts(start);
    const minutes = Math.round((start.getTime() - now.getTime()) / 60000);

    if (date === today) {
        if (minutes < 60) {
            return { label: `Tra ${Math.max(minutes, 1)} min`, tone: 'soon' };
        }

        if (minutes < 4 * 60) {
            return { label: `Tra ${Math.floor(minutes / 60)} h`, tone: 'soon' };
        }

        return { label: hour >= 18 ? 'Stasera' : 'Oggi', tone: 'normal' };
    }

    if (date === addDays(today, 1)) {
        return { label: 'Domani', tone: 'normal' };
    }

    // "Venerdì"
    return { label: formatDayLong(date).split(' ')[0], tone: 'normal' };
}
