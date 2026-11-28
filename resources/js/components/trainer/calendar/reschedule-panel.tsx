import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/trainer/calendar/session-row';
import {
    serviceShort,
    shortDay,
} from '@/components/trainer/calendar/session-status';
import {
    BottomSheet,
    FloatingPanel,
    PanelHeader,
} from '@/components/trainer/session/panel-shell';
import type { PopoverAnchor } from '@/components/trainer/session/panel-shell';
import {
    PanelFooter,
    SectionLabel,
} from '@/components/trainer/session/session-form-parts';
import { Spinner } from '@/components/ui/spinner';
import { freeStarts } from '@/lib/booking';
import { hourLabel, romeParts } from '@/lib/calendar';
import type { CalendarItem } from '@/lib/calendar';
import {
    formatDayNumber,
    formatDuration,
    formatTime,
    formatWeekdayShort,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { reschedule } from '@/routes/trainer/sessions';
import type { AvailabilityDay } from '@/types';

const focusRing =
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42D7D9]';

/** The free times of a day by part of the day; empty parts are left out. */
const PARTS: { label: string; from: number; to: number }[] = [
    { label: 'MATTINA', from: 0, to: 12 },
    { label: 'POMERIGGIO', from: 12, to: 18 },
    { label: 'SERA', from: 18, to: 24 },
];

/**
 * "Sposta la seduta" (design "Trainer · Sposta seduta · nuovo"): the free
 * days and times of the trainer (this session doesn't count). The client
 * gets the proposal and the session moves only if they accept; with
 * someone without an account it moves at once. A sheet on phones, a
 * popover beside "Sposta" on desktop. The page sends `rescheduleSlots`
 * (TrainerSessions::rescheduleSlots) when asked.
 */
export default function ReschedulePanel({
    item,
    anchor,
    onClose,
}: {
    item: CalendarItem;
    /** Desktop: the "Sposta" button; null on phones (the sheet). */
    anchor: PopoverAnchor | null;
    onClose: () => void;
}) {
    const slots = usePage<{ rescheduleSlots?: AvailabilityDay[] | null }>()
        .props.rescheduleSlots;
    const [loaded, setLoaded] = useState(false);
    const [date, setDate] = useState<string | null>(null);
    const [chosen, setChosen] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const minutes = Math.round(
        (new Date(item.end).getTime() - new Date(item.start).getTime()) / 60000,
    );

    // When it opens: the free times of now, not old ones.
    useEffect(() => {
        router.reload({
            only: ['rescheduleSlots'],
            data: { sposta: item.id },
            onFinish: () => setLoaded(true),
        });
    }, [item.id]);

    const timesOf = (day: AvailabilityDay) =>
        freeStarts(day, minutes).filter((time) => time !== item.start);
    const days = (loaded ? (slots ?? []) : []).filter(
        (day) => timesOf(day).length > 0,
    );
    const day = days.find((other) => other.date === date) ?? days[0] ?? null;
    const times = day ? timesOf(day) : [];
    // The first free time is chosen at first, as in the design.
    const proposal =
        chosen && times.includes(chosen) ? chosen : (times[0] ?? null);

    const submit = () => {
        if (!proposal) {
            return;
        }

        router.post(
            reschedule.url(item.id),
            { start: proposal },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: onClose,
                onError: (errors) =>
                    setError(errors.start ?? errors.booking ?? null),
            },
        );
    };

    const chip = (on: boolean) =>
        cn(
            'h-10.5 cursor-pointer rounded-full border-0 px-3.5 text-[15px] font-semibold tabular-nums',
            focusRing,
            on
                ? 'bg-[#42D7D9] text-black'
                : 'bg-[#1C1E21] text-foreground hover:bg-[#26282C]',
        );

    const content: ReactNode = (
        <>
            <PanelHeader title="Sposta la seduta" />

            <div className="flex items-center gap-3">
                <Avatar name={item.title} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b className="truncate text-base font-semibold">
                        {item.title}
                    </b>
                    <span className="truncate text-sm text-muted-foreground">
                        {serviceShort(item)} · {formatDuration(minutes)}
                    </span>
                </span>
            </div>

            <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-0.5 rounded-[18px] bg-[#0B0C0D] px-3.5 py-3">
                    <span className="text-[13px] font-semibold text-muted-foreground">
                        ADESSO
                    </span>
                    <b className="text-base font-semibold text-muted-foreground line-through">
                        {shortDay(item.date)}, {hourLabel(item.from)}
                    </b>
                </div>
                <div className="flex flex-1 flex-col gap-0.5 rounded-[18px] bg-[rgba(66,215,217,0.10)] px-3.5 py-3 shadow-[inset_0_0_0_1.5px_#42D7D9]">
                    <span className="text-[13px] font-semibold text-[#42D7D9]">
                        PROPOSTA
                    </span>
                    <b className="text-base font-semibold tabular-nums">
                        {proposal
                            ? `${shortDay(romeParts(proposal).date)}, ${formatTime(proposal)}`
                            : '—'}
                    </b>
                </div>
            </div>

            {!loaded ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner /> Cerco gli orari liberi…
                </span>
            ) : days.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">
                    Non hai orari liberi nei prossimi giorni: cambia le tue
                    disponibilità, oppure annulla la seduta.
                </p>
            ) : (
                <>
                    <div
                        role="group"
                        aria-label="Giorno"
                        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:-mx-5.5 md:px-5.5"
                    >
                        {days.map((other) => {
                            const on = other.date === day?.date;

                            return (
                                <button
                                    key={other.date}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => {
                                        setDate(other.date);
                                        setChosen(null);
                                        setError(null);
                                    }}
                                    className={cn(
                                        'flex h-18 w-15 flex-none cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[18px] border-0',
                                        focusRing,
                                        on
                                            ? 'bg-[#42D7D9] text-black'
                                            : 'bg-[#1C1E21] text-foreground',
                                    )}
                                >
                                    <span className="text-[13px] font-semibold">
                                        {formatWeekdayShort(other.date)}
                                    </span>
                                    <b className="text-[22px] font-bold tabular-nums">
                                        {formatDayNumber(other.date)}
                                    </b>
                                </button>
                            );
                        })}
                    </div>

                    {PARTS.map((part) => {
                        const list = times.filter((time) => {
                            const hour = romeParts(time).hour;

                            return hour >= part.from && hour < part.to;
                        });

                        return list.length === 0 ? null : (
                            <div
                                key={part.label}
                                className="flex flex-col gap-2"
                            >
                                <SectionLabel>{part.label}</SectionLabel>
                                <div
                                    role="group"
                                    aria-label={part.label.toLowerCase()}
                                    className="flex flex-wrap gap-1.5"
                                >
                                    {list.map((time) => (
                                        <button
                                            key={time}
                                            type="button"
                                            aria-pressed={time === proposal}
                                            onClick={() => {
                                                setChosen(time);
                                                setError(null);
                                            }}
                                            className={chip(time === proposal)}
                                        >
                                            {formatTime(time)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            <PanelFooter
                onCancel={onClose}
                onConfirm={submit}
                label={item.offApp ? 'Sposta' : 'Invia proposta'}
                processing={processing}
                disabled={!proposal}
                errors={error ? [error] : []}
            />
        </>
    );

    const onOpenChange = (open: boolean) => !open && onClose();

    return anchor ? (
        <FloatingPanel
            open
            onOpenChange={onOpenChange}
            anchor={anchor}
            label="Sposta la seduta"
        >
            {content}
        </FloatingPanel>
    ) : (
        <BottomSheet open onOpenChange={onOpenChange} label="Sposta la seduta">
            {content}
        </BottomSheet>
    );
}
