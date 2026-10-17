import { Link } from '@inertiajs/react';
import NoShowButton from '@/components/trainer/no-show-button';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { show as showClient } from '@/routes/trainer/clients';
import type { TrainerTodaySession } from '@/types';

export type SessionTiming = 'past' | 'next' | 'later';

type TodaySessionRowProps = {
    session: TrainerTodaySession;
    timing: SessionTiming;
};

/**
 * One session of today. The next one is highlighted; finished ones are done
 * by themselves, with "Saltata" for when the client didn't come.
 */
export default function TodaySessionRow({
    session,
    timing,
}: TodaySessionRowProps) {
    const isNext = timing === 'next';
    const end = new Date(
        new Date(session.start).getTime() + session.hours * 60 * 60 * 1000,
    ).toISOString();

    return (
        <article
            className={cn(
                'flex gap-3.5 rounded-xl px-4 py-3.5',
                isNext
                    ? 'bg-primary text-primary-foreground'
                    : 'border bg-card',
            )}
        >
            <span className="flex w-12 flex-none flex-col tabular-nums md:w-13">
                <span className="text-[15px] leading-5.5 font-bold md:text-base">
                    {formatTime(session.start)}
                </span>
                <span className="hidden text-xs opacity-60 md:block">
                    {formatTime(end)}
                </span>
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] leading-5 font-semibold md:text-base">
                        {session.clientId === null ? (
                            session.clientName
                        ) : (
                            <Link
                                href={showClient(session.clientId)}
                                className="hover:underline"
                            >
                                {session.clientName}
                            </Link>
                        )}
                    </span>
                    {isNext && (
                        <span className="hidden h-5 items-center rounded-full bg-primary-foreground px-2 text-[11px] font-semibold text-primary md:inline-flex">
                            Prossima
                        </span>
                    )}
                </div>
                <span className="text-xs opacity-70 md:text-[13px] md:leading-4.5">
                    {session.serviceName} · {session.placeLabel}
                </span>

                {timing === 'past' && (
                    <NoShowButton
                        session={session}
                        className="mt-2 self-start"
                    />
                )}
            </div>
        </article>
    );
}
