import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import SessionActions from '@/components/trainer/calendar/session-actions';
import { StatusChip } from '@/components/trainer/ui/bits';
import SessionNote from '@/components/trainer/ui/session-note';
import type { CalendarItem } from '@/lib/calendar';
import { hourLabel, romeParts } from '@/lib/calendar';
import { cn } from '@/lib/utils';

/** The hours always shown; earlier or later ones only when a session is there. */
const FIRST_HOUR = 7;
const LAST_HOUR = 21;

type DayAgendaProps = {
    date: string;
    items: CalendarItem[];
    today: string;
    now: Date;
    openId: number | null;
    onToggle: (id: number) => void;
    /** "Aggiungi seduta" when the day is empty. */
    emptyHint: string;
};

/**
 * The day as rows of one hour, all as tall: each session sits on the row of
 * its start and opens in place with its actions. Today a dashed turquoise
 * line marks the time now.
 */
export default function DayAgenda({
    date,
    items,
    today,
    now,
    openId,
    onToggle,
    emptyHint,
}: DayAgendaProps) {
    const first = Math.min(
        FIRST_HOUR,
        ...items.map((item) => Math.floor(item.from)),
    );
    const last = Math.max(
        LAST_HOUR,
        ...items.map((item) => Math.ceil(item.to)),
    );
    const nowParts = romeParts(now);
    const isToday = date === today;
    const nextId = isToday
        ? items.find(
              (item) => item.kind === 'confirmed' && new Date(item.end) > now,
          )?.id
        : undefined;

    return (
        <div className="flex flex-col">
            {items.length === 0 && (
                <p className="mb-2 rounded-[18px] border border-dashed border-[#3a3a3a] px-3.5 py-3 text-[13px] text-muted-foreground">
                    {emptyHint}
                </p>
            )}
            {Array.from({ length: Math.min(last, 24) - first }, (_, index) => {
                const hour = first + index;
                const rowItems = items.filter(
                    (item) => Math.floor(item.from) === hour,
                );
                const current = isToday && Math.floor(nowParts.hour) === hour;

                return (
                    <div
                        key={hour}
                        className="relative flex min-h-15 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)]"
                    >
                        <span
                            className={cn(
                                'w-16 shrink-0 pt-3 text-[13px] tabular-nums',
                                current
                                    ? 'font-bold text-foreground'
                                    : 'text-[#8a8a8a]',
                            )}
                        >
                            {hourLabel(hour)}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1.5">
                            {rowItems.map((item) => (
                                <AgendaItem
                                    key={item.key}
                                    item={item}
                                    now={now}
                                    next={item.id === nextId}
                                    open={openId === item.id}
                                    onToggle={() => onToggle(item.id)}
                                />
                            ))}
                        </div>
                        {current && (
                            <div
                                role="img"
                                aria-label={`Adesso, ${hourLabel(nowParts.hour)}`}
                                className="pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1"
                                style={{
                                    top: `${(nowParts.hour - hour) * 100}%`,
                                }}
                            >
                                <span className="flex h-5 items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-[#0a0a0a] tabular-nums">
                                    {hourLabel(nowParts.hour)}
                                </span>
                                <span className="flex-1 border-t-[1.5px] border-dashed border-brand" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function AgendaItem({
    item,
    now,
    next,
    open,
    onToggle,
}: {
    item: CalendarItem;
    now: Date;
    next: boolean;
    open: boolean;
    onToggle: () => void;
}) {
    const panelId = useId();
    const done = item.kind === 'confirmed' && new Date(item.end) <= now;
    const live =
        item.kind === 'confirmed' && new Date(item.start) <= now && !done;
    const home = /domicilio/i.test(item.place);
    const [service] = item.detail.split(' · ');

    let status: {
        label: string;
        tone: 'brand' | 'neutral' | 'done' | 'waiting';
    } | null = null;

    if (item.kind === 'pending') {
        status = {
            label: item.fromTrainer ? 'In attesa del cliente' : 'Da confermare',
            tone: 'waiting',
        };
    } else if (live) {
        status = { label: 'In corso', tone: 'brand' };
    } else if (next) {
        const minutes = Math.max(
            0,
            Math.round(
                (new Date(item.start).getTime() - now.getTime()) / 60000,
            ),
        );
        const hours = Math.floor(minutes / 60);
        status = {
            label:
                hours > 0
                    ? `Tra ${hours} h${minutes % 60 ? ` ${minutes % 60}` : ''}`
                    : `Tra ${minutes} min`,
            tone: 'brand',
        };
    } else if (done) {
        status = { label: 'Completata', tone: 'done' };
    }

    return (
        <article
            className={cn(
                'rounded-2xl px-3.5 py-1',
                item.kind === 'pending'
                    ? 'bg-transparent text-muted-foreground outline outline-1 -outline-offset-1 outline-[#3a3a3a] outline-dashed'
                    : done
                      ? 'bg-[#141414] text-[#8a8a8a]'
                      : 'bg-card text-foreground',
                open && 'pb-3.5 shadow-[inset_0_0_0_1.5px_#42d7d9]',
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex min-h-12 w-full items-center gap-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        'my-1 w-0.75 self-stretch rounded-full',
                        done || item.kind === 'pending'
                            ? 'bg-[#3a3a3a]'
                            : home
                              ? 'bg-foreground'
                              : 'bg-brand',
                    )}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-base font-semibold">
                        {item.title}
                    </span>
                    <span className="truncate text-[13px] text-muted-foreground tabular-nums">
                        {hourLabel(item.from)}–{hourLabel(item.to)} ·{' '}
                        {item.place}
                    </span>
                </span>
                {status && (
                    <StatusChip tone={status.tone}>{status.label}</StatusChip>
                )}
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'size-4.5 shrink-0 text-[#8a8a8a] transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>
            {open && (
                <div
                    id={panelId}
                    className="flex flex-col gap-3 pt-1.5 pl-3.75"
                >
                    <div className="flex flex-wrap gap-6">
                        <span className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                                Servizio
                            </span>
                            <span className="text-[15px] text-foreground">
                                {service}
                            </span>
                        </span>
                        {item.package && (
                            <span className="flex flex-col">
                                <span className="text-xs text-muted-foreground">
                                    Pacchetto
                                </span>
                                <span className="text-[15px] text-foreground">
                                    Seduta {item.package.position} di{' '}
                                    {item.package.total}
                                </span>
                            </span>
                        )}
                        {item.guestNames.length > 0 && (
                            <span className="flex flex-col">
                                <span className="text-xs text-muted-foreground">
                                    Con
                                </span>
                                <span className="text-[15px] text-foreground">
                                    {item.guestNames.join(', ')}
                                </span>
                            </span>
                        )}
                    </div>
                    {item.kind === 'confirmed' && (
                        <SessionNote id={item.id} note={item.trainerNote} />
                    )}
                    <SessionActions item={item} />
                </div>
            )}
        </article>
    );
}
