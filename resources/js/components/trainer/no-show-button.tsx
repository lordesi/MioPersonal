import { router } from '@inertiajs/react';
import type { VisitOptions } from '@inertiajs/core';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { formatDayShort, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { noShow } from '@/routes/trainer/sessions';
import { destroy as unmarkNoShow } from '@/routes/trainer/sessions/no-show';
import type { TrainerTodaySession } from '@/types';

type NoShowButtonProps = {
    session: TrainerTodaySession;
    className?: string;
};

/**
 * "Saltata" on a finished session: a session is done by itself, the trainer
 * marks it only when the client didn't come. The client doesn't see it; it can
 * be taken back within 7 days (Booking::NO_SHOW_DAYS on the server).
 */
export default function NoShowButton({
    session,
    className,
}: NoShowButtonProps) {
    const [processing, setProcessing] = useState(false);

    // The server sends the page back with `noShow` updated.
    const options: VisitOptions = {
        preserveScroll: true,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
        onError: (errors) => toast.error(errors.booking ?? 'Riprova tra poco.'),
    };

    if (session.noShow) {
        return (
            <div
                className={cn(
                    'flex flex-wrap items-center gap-x-2 text-xs md:text-[13px]',
                    className,
                )}
            >
                <span role="status">Segnata come saltata</span>
                <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs md:text-[13px]"
                    disabled={processing}
                    onClick={() =>
                        router.delete(unmarkNoShow.url(session.id), options)
                    }
                >
                    Annulla
                </Button>
            </div>
        );
    }

    return (
        <ConfirmDialog
            title="Seduta saltata?"
            description={`${session.clientName}, ${formatDayShort(session.start)} ore ${formatTime(session.start)}. Il cliente non lo vede: serve a calcolare le sue presenze. Puoi annullare entro 7 giorni.`}
            confirmLabel="Sì, saltata"
            destructive
            onConfirm={() => router.post(noShow.url(session.id), {}, options)}
            trigger={
                <Button
                    type="button"
                    variant="outline"
                    className={cn('h-10 text-[13px] md:h-8 md:px-3', className)}
                    disabled={processing}
                >
                    Saltata
                </Button>
            }
        />
    );
}
