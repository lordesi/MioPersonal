import { Link } from '@inertiajs/react';
import { ArrowRight, Inbox } from 'lucide-react';
import UserAvatar from '@/components/shared/user-avatar';
import Panel from '@/components/trainer/area/panel';
import { formatHoursShort, formatRelativeSlot, hoursUntil } from '@/lib/format';
import { requests as requestsPage } from '@/routes/trainer';
import type { TrainerBookingRequest } from '@/types';

type PendingRequestsSummaryProps = {
    /** The first ones, expiring first on top. */
    requests: TrainerBookingRequest[];
    /** All the requests waiting, also the ones not in `requests`. */
    total: number;
};

/** "Richieste in attesa" of "Panoramica": the answer is given in "Richieste". */
export default function PendingRequestsSummary({
    requests,
    total,
}: PendingRequestsSummaryProps) {
    return (
        <Panel title="Richieste in attesa" className="gap-3.5">
            {total === 0 ? (
                <div className="flex items-center gap-3.5">
                    <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-secondary">
                        <Inbox aria-hidden="true" className="size-4.5" />
                    </span>
                    <span className="text-[15px] leading-5.5 font-semibold">
                        Nessuna richiesta da confermare
                    </span>
                </div>
            ) : (
                <>
                    <ul className="flex flex-col gap-2.5">
                        {requests.map((request) => (
                            <li
                                key={request.id}
                                className="flex items-center gap-3"
                            >
                                <UserAvatar
                                    name={request.clientName}
                                    size="md"
                                    className="[&_[data-slot=avatar-fallback]]:bg-secondary"
                                />
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-[15px] leading-5.5 font-semibold">
                                        {request.clientName}
                                    </span>
                                    <span className="text-[13px] leading-4.5 text-muted-foreground tabular-nums">
                                        {formatRelativeSlot(request.start)} ·{' '}
                                        {request.serviceName}
                                    </span>
                                </span>
                                <span className="flex-none text-xs font-semibold tabular-nums">
                                    Scade tra{' '}
                                    {formatHoursShort(
                                        hoursUntil(request.expiresAt),
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={requestsPage()}
                        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold hover:underline"
                    >
                        {total === 1
                            ? 'Rispondi alla richiesta'
                            : `Rispondi alle ${total} richieste`}
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </>
            )}
        </Panel>
    );
}
