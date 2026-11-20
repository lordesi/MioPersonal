import { Link } from '@inertiajs/react';
import { ChevronDown, MapPin, MessageCircle, Navigation } from 'lucide-react';
import { useId } from 'react';
import { Initials } from '@/components/trainer/ui/bits';
import { roundOutlineClassName } from '@/components/trainer/ui/styles';
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
                'flex flex-col gap-4 rounded-[26px] bg-card',
                open
                    ? 'p-4 shadow-[inset_0_0_0_2px_#42d7d9]'
                    : 'px-4 py-3 shadow-[inset_0_0_0_1px_#2c2c2c]',
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
                <span
                    className={cn(
                        'shrink-0 rounded-full px-3 py-1.5 text-[13px] leading-4.5 font-semibold whitespace-nowrap',
                        badge.tone === 'soon' && 'bg-brand text-[#0a0a0a]',
                        badge.tone === 'normal' &&
                            'bg-secondary text-foreground',
                        badge.tone === 'pending' &&
                            'bg-secondary text-[#ff9230]',
                        badge.tone === 'done' &&
                            'bg-secondary text-muted-foreground',
                    )}
                >
                    {badge.label}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'size-5 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {open && (
                <div id={panelId} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[28px] leading-8.5 font-bold tracking-[0.38px] text-foreground tabular-nums">
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
                            <span className="mt-2 self-start rounded-full bg-brand-soft px-2.5 py-1 text-[13px] leading-4.5 font-semibold text-brand">
                                {item.packageLabel}
                            </span>
                        )}
                        {item.status === 'pending' && (
                            <p className="mt-2 text-[15px] leading-5 text-muted-foreground">
                                In attesa della conferma di {firstName}.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {item.messageHref && (
                            <Link
                                href={item.messageHref}
                                aria-label={`Scrivi a ${firstName}`}
                                title="Scrivi"
                                className={cn(roundOutlineClassName, 'size-13')}
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
                                className={cn(roundOutlineClassName, 'size-13')}
                            >
                                <Navigation
                                    aria-hidden="true"
                                    className="size-5.5"
                                />
                            </a>
                        )}
                        <Link
                            href={item.detailsHref}
                            className="inline-flex h-13 flex-1 items-center justify-center rounded-full bg-brand px-5 text-[17px] font-semibold tracking-[-0.43px] text-[#0a0a0a] outline-none hover:bg-[#7fe6e7] focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
        return { label: 'In attesa', tone: 'pending' };
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
