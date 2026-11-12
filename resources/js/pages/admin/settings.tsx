import { Head } from '@inertiajs/react';
import ActivityList from '@/components/admin/activity-list';
import { formatAgo } from '@/lib/format';
import type { AdminActivityRow } from '@/types';

type SettingsProps = {
    team: {
        id: number;
        name: string;
        email: string;
        /** ISO UTC string; null if never active. */
        lastActiveAt: string | null;
    }[];
    activity: AdminActivityRow[];
};

/** "Impostazioni e registro": the team and the "Registro attività". */
export default function Settings({ team, activity }: SettingsProps) {
    return (
        <>
            <Head title="Admin · Impostazioni e registro" />

            <section
                aria-labelledby="team-title"
                className="flex flex-col gap-3"
            >
                <h2 id="team-title" className="text-lg font-semibold">
                    Il team
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {team.map((admin) => (
                        <li
                            key={admin.id}
                            className="flex flex-col gap-0.5 rounded-[14px] border bg-card p-4"
                        >
                            <span className="text-[15px] font-semibold">
                                {admin.name}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                {admin.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {admin.lastActiveAt
                                    ? `Attivo ${formatAgo(admin.lastActiveAt)}`
                                    : 'Mai entrato'}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section
                aria-labelledby="activity-title"
                className="flex flex-col gap-3"
            >
                <div className="flex flex-col gap-0.5">
                    <h2 id="activity-title" className="text-lg font-semibold">
                        Registro attività
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Verifiche, moderazione, utenti, discipline e città: chi
                        ha fatto cosa, le ultime 200 azioni.
                    </p>
                </div>
                <ActivityList activity={activity} />
            </section>
        </>
    );
}

Settings.layout = { section: 'settings' };
