import { Link } from '@inertiajs/react';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import ResponsiveText from '@/components/shared/responsive-text';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { show as showClient } from '@/routes/trainer/clients';
import type { TrainerTodaySession } from '@/types';

export type SessionTiming = 'past' | 'next' | 'later';
/** null = not marked yet; once marked it never goes back to null. */
export type Attendance = 'completed' | 'no_show' | null;

type TodaySessionRowProps = {
    session: TrainerTodaySession;
    timing: SessionTiming;
    attendance: Attendance;
    onAttendanceChange: (attendance: Attendance) => void;
};

/**
 * One session of today. The next one is highlighted; finished ones ask the
 * trainer to mark them as done or as a no-show. The choice asks first and is
 * final: it can't be undone or changed.
 */
export default function TodaySessionRow({
    session,
    timing,
    attendance,
    onAttendanceChange,
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

                {timing === 'past' &&
                    attendance === null && (
                        // TODO: save the attendance on the server.
                        <div className="grid grid-cols-2 gap-1.5 pt-2 md:flex md:flex-wrap md:gap-2">
                            <ConfirmDialog
                                title="Seduta svolta?"
                                description={`${session.clientName}, ore ${formatTime(session.start)}. Una volta segnata non si può più cambiare.`}
                                confirmLabel="Sì, svolta"
                                onConfirm={() =>
                                    onAttendanceChange('completed')
                                }
                                trigger={
                                    <Button
                                        type="button"
                                        className="h-10 text-[13px] md:h-8 md:px-3"
                                    >
                                        <ResponsiveText
                                            mobile="Svolta"
                                            desktop="Completata"
                                        />
                                    </Button>
                                }
                            />
                            <ConfirmDialog
                                title="Il cliente non si è presentato?"
                                description={`${session.clientName}, ore ${formatTime(session.start)}. Si applica la regola di cancellazione; una volta segnata non si può più cambiare.`}
                                confirmLabel="Sì, non si è presentato"
                                destructive
                                onConfirm={() => onAttendanceChange('no_show')}
                                trigger={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 text-[13px] md:h-8 md:px-3"
                                    >
                                        <ResponsiveText
                                            mobile="Assente"
                                            desktop="Non si è presentato"
                                        />
                                    </Button>
                                }
                            />
                        </div>
                    )}
                {attendance === 'completed' && (
                    <span
                        role="status"
                        className="pt-1 text-xs md:pt-1.5 md:text-[13px]"
                    >
                        <ResponsiveText
                            mobile="Svolta"
                            desktop="Segnata come svolta"
                        />
                    </span>
                )}
                {attendance === 'no_show' && (
                    <span
                        role="status"
                        className="pt-1 text-xs md:pt-1.5 md:text-[13px]"
                    >
                        <ResponsiveText
                            mobile="Assenza registrata"
                            desktop="Segnata come assenza: si applica la regola di cancellazione"
                        />
                    </span>
                )}
            </div>
        </article>
    );
}
