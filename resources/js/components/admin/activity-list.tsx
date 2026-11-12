import { formatAgo } from '@/lib/format';
import type { AdminActivityRow } from '@/types';

/** The lines of the "Registro attività": what, who, when. */
export default function ActivityList({
    activity,
}: {
    activity: AdminActivityRow[];
}) {
    if (activity.length === 0) {
        return (
            <p className="rounded-[14px] border bg-card p-6 text-center text-sm text-muted-foreground">
                Ancora nessuna azione registrata.
            </p>
        );
    }

    return (
        <ol className="flex flex-col divide-y rounded-[14px] border bg-card">
            {activity.map((row) => (
                <li
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-3"
                >
                    <span className="text-sm">{row.description}</span>
                    <span className="text-xs text-muted-foreground">
                        {row.adminName} · {formatAgo(row.createdAt)}
                    </span>
                </li>
            ))}
        </ol>
    );
}
